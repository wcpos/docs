function issue(code, file, message) {
  return { code, severity: 'error', file, message };
}

function sameList(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function extractCodeBlocks(source) {
  const blocks = [];
  const fencePattern = /(^|\n)(?<indent>[ \t]*)(?<fence>`{3,}|~{3,})[^\n]*(?:\n[\s\S]*?\n)?\k<indent>\k<fence>[ \t]*(?=\n|$)/g;
  for (const match of source.matchAll(fencePattern)) {
    blocks.push(match[0].startsWith('\n') ? match[0].slice(1) : match[0]);
  }
  return blocks;
}

function maskCodeBlocks(source) {
  const fencePattern = /(^|\n)(?<indent>[ \t]*)(?<fence>`{3,}|~{3,})[^\n]*(?:\n[\s\S]*?\n)?\k<indent>\k<fence>[ \t]*(?=\n|$)/g;
  return source.replace(fencePattern, (match) => '\n'.repeat(match.split('\n').length - 1));
}

function isCompleteImportDeclaration(statement) {
  const trimmed = statement.trimEnd();
  return /;\s*$/.test(trimmed)
    || /^import\s+["'][^"']+["']\s*$/.test(trimmed)
    || /\sfrom\s+["'][^"']+["']\s*$/.test(trimmed);
}

function extractImportStatements(source) {
  const imports = [];
  const lines = source.split(/(?<=\n)/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    if (!/^\s*import(?:\s+type)?(?:\s|["'{*])/.test(line)) {
      continue;
    }

    let statement = line;
    while (!isCompleteImportDeclaration(statement) && index + 1 < lines.length) {
      index += 1;
      statement += lines[index] ?? '';
    }
    imports.push(statement);
  }
  return imports;
}

function extractMarkdownDestination(rawDestinationAndTitle) {
  const value = rawDestinationAndTitle.trimStart();
  if (value.startsWith('<')) {
    let escaped = false;
    for (let index = 1; index < value.length; index += 1) {
      const char = value[index];
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '>') {
        return value.slice(1, index);
      }
    }
  }

  let depth = 0;
  let escaped = false;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (escaped) {
      if (char === ')' && depth > 0) {
        depth -= 1;
      }
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '(') {
      depth += 1;
      continue;
    }
    if (char === ')') {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (/\s/.test(char) && depth === 0) {
      return value.slice(0, index);
    }
  }
  return value;
}

function extractMarkdownLinkUrls(source) {
  const urls = [];
  for (const line of source.split('\n')) {
    const inlineCodeRanges = extractInlineCodeRanges(line);
    let cursor = 0;
    while (cursor < line.length) {
      const textStart = line.indexOf('[', cursor);
      if (textStart === -1) {
        break;
      }
      if (rangeOverlapsAny({ start: textStart, end: textStart + 1 }, inlineCodeRanges)) {
        cursor = textStart + 1;
        continue;
      }
      const textEnd = line.indexOf(']', textStart + 1);
      if (textEnd === -1 || line[textEnd + 1] !== '(') {
        cursor = textStart + 1;
        continue;
      }

      let depth = 1;
      let escaped = false;
      let index = textEnd + 2;
      while (index < line.length) {
        const char = line[index];
        if (escaped) {
          if (char === ')' && depth > 1) {
            depth -= 1;
          }
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '(') {
          depth += 1;
        } else if (char === ')') {
          depth -= 1;
          if (depth === 0) {
            urls.push(extractMarkdownDestination(line.slice(textEnd + 2, index)));
            break;
          }
        }
        index += 1;
      }
      cursor = index + 1;
    }
  }
  return urls;
}

function extractInlineCodeRanges(line) {
  const ranges = [];
  let cursor = 0;
  while (cursor < line.length) {
    if (line[cursor] !== '`') {
      cursor += 1;
      continue;
    }
    const start = cursor;
    while (cursor < line.length && line[cursor] === '`') {
      cursor += 1;
    }
    const delimiter = line.slice(start, cursor);
    const endStart = line.indexOf(delimiter, cursor);
    if (endStart === -1) {
      continue;
    }
    ranges.push({ start, end: endStart + delimiter.length });
    cursor = endStart + delimiter.length;
  }
  return ranges;
}

function rangeOverlapsAny(range, ranges) {
  return ranges.some((candidate) => range.start < candidate.end && candidate.start < range.end);
}


function extractParenthesizedInlineCodeSpans(source) {
  const spans = [];
  for (const line of source.split('\n')) {
    for (const range of extractInlineCodeRanges(line)) {
      const before = line[range.start - 1];
      const after = line[range.end];
      if (before === '(' && after === ')') {
        spans.push(line.slice(range.start - 1, range.end + 1));
      }
    }
  }
  return spans;
}

function isSpaceSensitiveLetter(ch) {
  if (!ch) return false;
  if (!/\p{L}/u.test(ch)) return false;
  // CJK ideographs and kana need no adjacent space; Korean particles also attach
  // without one (137/297 Korean docs have glued Hangul, 139 have spaced Hangul).
  // Latin, Cyrillic, etc. remain space-sensitive.
  return !/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(ch);
}

// Keys identifying each inline-code span occurrence that is glued (no space) to
// a space-sensitive letter, by side + occurrence + span text. Comparing the
// source and the translation per span avoids the false "issue" a whole-document
// regex produces when a line contains two or more spans (the prose between them
// looks like one long span to a greedy matcher).
function collectGluedInlineCodeKeys(masked) {
  const keys = new Set();
  let spanIndex = 0;
  for (const line of masked.split('\n')) {
    for (const range of extractInlineCodeRanges(line)) {
      const span = line.slice(range.start, range.end);
      const keyBase = `${spanIndex}:${span}`;
      if (isSpaceSensitiveLetter(line[range.start - 1])) keys.add(`before ${keyBase}`);
      if (isSpaceSensitiveLetter(line[range.end])) keys.add(`after ${keyBase}`);
      spanIndex += 1;
    }
  }
  return keys;
}

// True when the translation glues an inline-code span to prose where the source
// (for that same span and side) did not — i.e. a space the model dropped.
function inlineCodeSpacingRegressed(maskedSource, maskedTranslated) {
  const sourceGlued = collectGluedInlineCodeKeys(maskedSource);
  for (const key of collectGluedInlineCodeKeys(maskedTranslated)) {
    if (!sourceGlued.has(key)) return true;
  }
  return false;
}

function extractInlineCodeSpans(source) {
  const spans = [];
  for (const line of source.split('\n')) {
    for (const range of extractInlineCodeRanges(line)) {
      spans.push(line.slice(range.start, range.end));
    }
  }
  return spans;
}

function parseInlineCodeSpan(span) {
  const delimiter = /^`+/.exec(span)?.[0];
  if (!delimiter || !span.endsWith(delimiter) || span.length < delimiter.length * 2) {
    return undefined;
  }
  return { delimiter, content: span.slice(delimiter.length, -delimiter.length) };
}

const ADMIN_BREADCRUMB_ROOT_SEGMENTS = new Set(['WP Admin', 'WooCommerce', 'WCPOS', 'POS']);
const ADMIN_BREADCRUMB_PROTECTED_SEGMENTS = new Set(['WP Admin', 'WooCommerce', 'WCPOS']);

/**
 * Sourced admin breadcrumb labels.
 *
 * Sources used for these values:
 * - WordPress core language packs from api.wordpress.org/translations/core/1.0/?version=6.8.3
 *   (admin-<locale>.po and <locale>.po from downloads.wordpress.org/translation/core/...)
 * - WooCommerce language packs from api.wordpress.org/translations/plugins/1.0/?slug=woocommerce
 *   (woocommerce-<locale>.po from downloads.wordpress.org/translation/plugin/woocommerce/...)
 * - WCPOS language packs from /Users/kilbot/Projects/translations/translations/php/<locale>/
 *   (woocommerce-pos-<locale>.l10n.php and woocommerce-pos-pro-<locale>.l10n.php)
 *
 * Do not add guesses here. If a label is absent from these sources, leave it out until we can
 * verify it from the product's actual translation files or official WordPress.org translations.
 */
const ADMIN_BREADCRUMB_SOURCE_LABELS = [
  'Plugins',
  'Add New',
  'Upload Plugin',
  'Settings',
  'Payments',
  'Stores',
  'Extensions',
  'Support',
  'Logs',
  'Dashboard',
  'Checkout',
  'POS',
];


const ADMIN_BREADCRUMB_LOCALE_LABELS = {
  ar: {
    'Add New': ['إضافة جديد'],
    Checkout: ['إتمام الطلب'],
    Dashboard: ['الرئيسية', 'لوحة التحكم'],
    Extensions: ['الإضافات'],
    Logs: ['السجلات'],
    Payments: ['المدفوعات', 'الدفعات'],
    Plugins: ['إضافات'],
    POS: ['نقطة البيع'],
    Settings: ['الإعدادات'],
    Stores: ['المتاجر'],
    Support: ['الدعم'],
    'Upload Plugin': ['رفع إضافة'],
  },
  de: {
    'Add New': ['Neu hinzufügen'],
    Checkout: ['Kasse', 'Checkout'],
    Dashboard: ['Dashboard'],
    Extensions: ['Erweiterungen'],
    Logs: ['Protokolle'],
    Payments: ['Zahlungen'],
    Plugins: ['Plugins'],
    POS: ['POS'],
    Settings: ['Einstellungen'],
    Stores: ['Geschäfte'],
    Support: ['Support'],
    'Upload Plugin': ['Plugin hochladen'],
  },
  es: {
    'Add New': ['Añadir nuevo'],
    Checkout: ['Finalizar compra'],
    Dashboard: ['Escritorio'],
    Extensions: ['Extensiones'],
    Logs: ['Registros'],
    Payments: ['Pagos'],
    Plugins: ['Plugins'],
    POS: ['POS'],
    Settings: ['Ajustes', 'Configuración'],
    Stores: ['Tiendas'],
    Support: ['Soporte'],
    'Upload Plugin': ['Subir plugin'],
  },
  fr: {
    'Add New': ['Ajouter'],
    Checkout: ['Validation de la commande'],
    Dashboard: ['Tableau de bord'],
    Extensions: ['Extensions'],
    Logs: ['Journaux'],
    Payments: ['Paiements'],
    Plugins: ['Extensions'],
    POS: ['POS'],
    Settings: ['Réglages', 'Paramètres'],
    Stores: ['Boutiques'],
    Support: ['Forums de support'],
    'Upload Plugin': ['Téléverser une extension'],
  },
  hi: {
    'Add New': ['नया जोड़ें'],
    Dashboard: ['डैशबोर्ड'],
    Payments: ['भुगतान'],
    Plugins: ['प्लगइन्स'],
    POS: ['POS'],
    Settings: ['सेटिंग्स'],
    Stores: ['स्टोर'],
    Support: ['सहायता'],
    'Upload Plugin': ['प्लगिन अपलोड करे'],
  },
  it: {
    'Add New': ['Aggiungi Nuovo'],
    Checkout: ['Pagamento'],
    Dashboard: ['Bacheca'],
    Extensions: ['Estensioni'],
    Logs: ['Log'],
    Payments: ['Pagamenti'],
    Plugins: ['Plugin'],
    POS: ['POS'],
    Settings: ['Impostazioni'],
    Stores: ['Negozi'],
    Support: ['Supporto'],
    'Upload Plugin': ['Carica plugin'],
  },
  ja: {
    'Add New': ['新規追加'],
    Checkout: ['支払い'],
    Dashboard: ['ダッシュボード'],
    Extensions: ['拡張機能'],
    Logs: ['ログ'],
    Payments: ['支払い'],
    Plugins: ['プラグイン'],
    POS: ['POS'],
    Settings: ['設定'],
    Stores: ['店舗'],
    Support: ['サポート'],
    'Upload Plugin': ['プラグインのアップロード'],
  },
  ko: {
    'Add New': ['새로 추가', '추가하기'],
    Checkout: ['결제'],
    Dashboard: ['알림판', '대시보드'],
    Extensions: ['확장'],
    Logs: ['로그'],
    Payments: ['결제', '결제 내역'],
    Plugins: ['플러그인'],
    POS: ['POS'],
    Settings: ['설정'],
    Stores: ['매장'],
    Support: ['지원'],
    'Upload Plugin': ['플러그인 업로드'],
  },
  'pt-BR': {
    'Add New': ['Adicionar novo', 'Adicionar Novo'],
    Checkout: ['Finalização de compra'],
    Dashboard: ['Painel'],
    Extensions: ['Extensões'],
    Logs: ['Logs'],
    Payments: ['Pagamentos'],
    Plugins: ['Plugins'],
    POS: ['POS'],
    Settings: ['Configurações'],
    Stores: ['Lojas'],
    Support: ['Suporte'],
    'Upload Plugin': ['Enviar plugin'],
  },
  'zh-CN': {
    'Add New': ['新增', '添加新'],
    Checkout: ['结账'],
    Dashboard: ['仪表盘'],
    Extensions: ['扩展'],
    Logs: ['日志'],
    Payments: ['支付', '支付记录'],
    Plugins: ['插件'],
    POS: ['POS'],
    Settings: ['设置'],
    Stores: ['商店'],
    Support: ['支持'],
    'Upload Plugin': ['上传插件'],
  },
};

const ADMIN_BREADCRUMB_COMPATIBLE_TRANSLATED_SEGMENTS = Object.fromEntries(
  ADMIN_BREADCRUMB_SOURCE_LABELS.map((label) => [
    label,
    [...new Set(Object.values(ADMIN_BREADCRUMB_LOCALE_LABELS).flatMap((labels) => labels[label] ?? []))],
  ]),
);


function breadcrumbSegments(content) {
  return content.split('>').map((segment) => segment.trim()).filter(Boolean);
}

function isAdminBreadcrumbContent(content) {
  const segments = breadcrumbSegments(content);
  return segments.length >= 2 && (
    segments.some((segment) => ADMIN_BREADCRUMB_ROOT_SEGMENTS.has(segment))
    || segments.some((segment) => ADMIN_BREADCRUMB_SOURCE_LABELS.includes(segment))
  );
}

function isBreadcrumbLikeContent(content) {
  return breadcrumbSegments(content).length >= 2;
}

function isAdminBreadcrumbSpan(span) {
  const parsed = parseInlineCodeSpan(span);
  return parsed !== undefined && isAdminBreadcrumbContent(parsed.content);
}

function adminBreadcrumbLocaleLabels(locale) {
  return locale ? ADMIN_BREADCRUMB_LOCALE_LABELS[locale] ?? {} : {};
}

function adminBreadcrumbSegmentCompatible(sourceSegment, translatedSegment, locale) {
  if (ADMIN_BREADCRUMB_PROTECTED_SEGMENTS.has(sourceSegment)) {
    return translatedSegment === sourceSegment;
  }
  if (!ADMIN_BREADCRUMB_SOURCE_LABELS.includes(sourceSegment)) {
    return translatedSegment === sourceSegment;
  }
  const sourceLabel = sourceSegment;
  const localeValues = adminBreadcrumbLocaleLabels(locale)[sourceLabel] ?? [];
  if (localeValues.length > 0) {
    return localeValues.includes(translatedSegment);
  }
  if (translatedSegment === sourceSegment) {
    return true;
  }
  return ADMIN_BREADCRUMB_COMPATIBLE_TRANSLATED_SEGMENTS[sourceSegment]?.includes(translatedSegment) ?? false;
}

function adminBreadcrumbSpansCompatible(sourceSpan, translatedSpan, locale) {
  if (sourceSpan === translatedSpan) {
    return true;
  }
  const source = parseInlineCodeSpan(sourceSpan);
  const translated = parseInlineCodeSpan(translatedSpan);
  if (!source || !translated || source.delimiter !== translated.delimiter) {
    return false;
  }
  if (!isAdminBreadcrumbContent(source.content) || !isBreadcrumbLikeContent(translated.content)) {
    return false;
  }
  const sourceSegments = breadcrumbSegments(source.content);
  const translatedSegments = breadcrumbSegments(translated.content);
  if (sourceSegments.length !== translatedSegments.length) {
    return false;
  }
  return sourceSegments.every((segment, index) => adminBreadcrumbSegmentCompatible(segment, translatedSegments[index] ?? '', locale));
}

function sourcedAdminBreadcrumbSegment(sourceSegment, translatedSegment, locale) {
  if (adminBreadcrumbSegmentCompatible(sourceSegment, translatedSegment, locale)) {
    return translatedSegment;
  }
  if (ADMIN_BREADCRUMB_PROTECTED_SEGMENTS.has(sourceSegment)) {
    return sourceSegment;
  }
  if (!ADMIN_BREADCRUMB_SOURCE_LABELS.includes(sourceSegment)) {
    return sourceSegment;
  }
  const localeValues = adminBreadcrumbLocaleLabels(locale)[sourceSegment] ?? [];
  return localeValues[0] ?? sourceSegment;
}

function normalizeAdminBreadcrumbSpan(sourceSpan, translatedSpan, locale) {
  const source = parseInlineCodeSpan(sourceSpan);
  const translated = parseInlineCodeSpan(translatedSpan);
  if (!source || !translated || !isAdminBreadcrumbContent(source.content) || !isBreadcrumbLikeContent(translated.content)) {
    return translatedSpan;
  }
  const sourceSegments = breadcrumbSegments(source.content);
  const translatedSegments = breadcrumbSegments(translated.content);
  if (sourceSegments.length !== translatedSegments.length) {
    return translatedSpan;
  }
  const normalizedSegments = sourceSegments.map((segment, index) => (
    sourcedAdminBreadcrumbSegment(segment, translatedSegments[index] ?? '', locale)
  ));
  return `${source.delimiter}${normalizedSegments.join(' > ')}${source.delimiter}`;
}

function normalizeAdminBreadcrumbInlineCode(source, translated, locale) {
  const sourceSpans = extractInlineCodeSpans(maskCodeBlocks(source));
  const translatedSpans = extractInlineCodeSpans(maskCodeBlocks(translated));
  if (sourceSpans.length === 0 || sourceSpans.length !== translatedSpans.length) {
    return translated;
  }

  let spanIndex = 0;
  const maskedTranslatedLines = maskCodeBlocks(translated).split('\n');
  const lines = translated.split('\n').map((line, index) => {
    const ranges = extractInlineCodeRanges(maskedTranslatedLines[index] ?? '');
    if (ranges.length === 0) return line;
    let cursor = 0;
    let nextLine = '';
    for (const range of ranges) {
      const translatedSpan = line.slice(range.start, range.end);
      nextLine += line.slice(cursor, range.start);
      nextLine += normalizeAdminBreadcrumbSpan(sourceSpans[spanIndex] ?? '', translatedSpan, locale);
      cursor = range.end;
      spanIndex += 1;
    }
    nextLine += line.slice(cursor);
    return nextLine;
  });
  return lines.join('\n');
}

function inlineCodeSpansCompatible(sourceSpans, translatedSpans, locale) {
  return sourceSpans.length === translatedSpans.length
    && sourceSpans.every((span, index) => (
      span === translatedSpans[index]
      || adminBreadcrumbSpansCompatible(span, translatedSpans[index] ?? '', locale)
    ));
}

function parenthesizedInlineCodeSpansCompatible(sourceSpans, translatedSpans, locale) {
  return sourceSpans.length === translatedSpans.length
    && sourceSpans.every((span, index) => {
      const translated = translatedSpans[index] ?? '';
      if (span === translated) {
        return true;
      }
      if (!span.startsWith('(') || !span.endsWith(')') || !translated.startsWith('(') || !translated.endsWith(')')) {
        return false;
      }
      return adminBreadcrumbSpansCompatible(span.slice(1, -1), translated.slice(1, -1), locale);
    });
}

function findUntranslatedAdminBreadcrumbLabels(translated, locale) {
  if (!locale || locale === 'en') {
    return [];
  }
  const labels = new Set();
  for (const span of extractInlineCodeSpans(maskCodeBlocks(translated))) {
    if (!isAdminBreadcrumbSpan(span)) {
      continue;
    }
    const content = parseInlineCodeSpan(span)?.content ?? '';
    const segments = breadcrumbSegments(content);
    const localeLabels = adminBreadcrumbLocaleLabels(locale);
    const labelsToCheck = ADMIN_BREADCRUMB_SOURCE_LABELS.filter((label) => !(localeLabels[label] ?? []).includes(label));
    for (const label of labelsToCheck) {
      if (segments.includes(label)) {
        labels.add(label);
      }
    }
  }
  return [...labels];
}



const MUST_TRANSLATE_VISIBLE_LABELS = [
  'Any WooCommerce Gateway',
  'Checkout Settings',
  'Cash Gateway',
  'Custom Gateways',
  '**Enabled**',
  'Pro Feature',
  'Per-Location Stock',
  'Flexible Pricing',
  'Location SKUs',
  'Audit-Safe Stock Movement',
  'Product Edit Write-Back',
  'WooCommerce installed and activated',
  'Free version works; per-store language selection requires WCPOS Pro',
  'API Credentials',
  'Inventory Location',
  'Pricing Source',
  'SKU Override',
  'Stock quantity',
  'Regular price / Sale price / Price',
  'WCPOS ATUM Integration',
  'ATUM Inventory',
  'Email Invoice',
  'Web Checkout',
  'Gateway Template',
  'Default',
  'Requires Pro',
  'No POS orders found',
];

/** Additional model guidance for this locale. Keep concise; global rules still apply. */
/** Locale-specific visible terms that indicate untranslated or wrong-register output. */
/** Regex style guards for language-specific register issues. */
/** Words/labels this locale intentionally keeps in English (loanwords), so the
   *  untranslated-table-cell check does not flag them. Compared case-insensitively. */

const DOCS_LOCALE_PROFILES = {
  de: {
    guidance: 'German glossary/style: translate payment gateway as Zahlungsgateway or Zahlungs-Gateway consistently; translate Cash gateway as Bargeld-Gateway; translate Checkout Settings as Checkout-Einstellungen; translate Checkout Troubleshooting as Checkout-Fehlerbehebung; translate WCPOS store/stores as Filiale/Filialen when referring to store locations/settings, never Store/Stores or pro Store; translate checkout/search context as Kassensuche, never Kassierersuche; translate gateway template as Gateway-Vorlage, never Gateway-Template; translate in-person as Vor-Ort, never persönlicher Einsatz; keep POS as POS when it is the product/domain acronym and prefer im POS/den POS, never die POS or in der POS; translate POS when it is a visible app/admin menu label if the locale UI has a localized label; keep Stripe Terminal and SumUp Terminal unchanged; use formal Sie or neutral professional documentation wording, never informal singular imperatives like Gehe or Aktiviere.',
    forbiddenVisibleText: [
      'Cash-Gateway',
      'Kassierereinstellungen',
      'Kassierer-Fehlerbehebung',
      'Payment-Gateways',
      'Payment-Integrationen',
      'in der POS',
      'die POS',
      'pro Store',
      'Stores ',
      'Kassierersuche',
      'persönlichen Einsatz',
      'Gateway-Template',
    ],
    forbiddenStylePatterns: [
      { pattern: /(^|\n)[^\n]*\bGehe\b/g, label: 'Gehe' },
      { pattern: /(^|\n)[^\n]*\bAktiviere\b/g, label: 'Aktiviere' },
    ],
    // German docs keep these engine/column labels in English (the feature card
    // itself is named "Thermal-XML" and the table header is "Engine").
    untranslatedCellAllowList: ['Thermal', 'Engine', 'Option', 'Standard'],
  },
  es: {
    untranslatedCellAllowList: ['No'],
    guidance: 'Spanish glossary/style: use professional neutral Spanish suitable for software documentation; translate generic UI and marketing labels, but preserve product brands; translate store/stores as tienda/tiendas when referring to retail locations; preserve WCPOS exactly and avoid changing WCPOS to POS; for admin breadcrumbs use sourced WordPress, WooCommerce, and WCPOS labels, so keep POS as POS when WCPOS source labels do. Use formal usted or neutral professional documentation wording; never use informal tú imperatives such as visita, crea, descarga, instala, configura, activa, habilita, envía, acepta, or procesa.',
    forbiddenStylePatterns: [
      { pattern: /(^|[\n.!?,;:]\s*)(visita|crea|descarga|instala|configura|activa|habilita|envía|acepta|procesa)\b/giu, label: 'visita/crea' },
    ],
  },
  fr: {
    guidance: 'French glossary/style: use professional French documentation register; translate generic UI and marketing labels, but preserve product brands; translate store/stores as boutique/boutiques or point(s) de vente when referring to retail locations; preserve WCPOS exactly and avoid changing WCPOS to POS; translate standalone POS as PDV or point de vente when it is not part of WCPOS, including visible app/admin menu labels; follow French punctuation spacing naturally without touching true code spans.',
    forbiddenVisibleText: ['paiement POS'],
  },
  ja: {
    guidance: 'Japanese glossary/style: use concise professional Japanese software-documentation wording; translate generic UI and marketing labels, but preserve product brands; preserve WCPOS exactly; translate POS when it is a visible app/admin menu label if the locale UI has a localized label; translate WCPOS store/stores as 店舗 when referring to retail locations/settings, not ストア; avoid literal word-for-word output when Japanese documentation would naturally reorder the sentence; keep true code spans and URLs unchanged.',
    forbiddenVisibleText: ['WCPOS Pro ストア'],
  },
  'pt-BR': {
    guidance: 'Brazilian Portuguese glossary/style: use professional Brazilian Portuguese documentation register; translate generic UI and marketing labels, but preserve product brands; translate store/stores as loja/lojas when referring to retail locations; preserve WCPOS exactly and avoid changing WCPOS to POS; translate POS when it is a visible app/admin menu label if the locale UI has a localized label.',
  },
  ko: {
    guidance: 'Korean glossary/style: use concise professional Korean software-documentation wording; translate generic UI and marketing labels, but preserve product brands; preserve WCPOS exactly; translate POS when it is a visible app/admin menu label if the locale UI has a localized label; translate WCPOS store/stores as 매장 when referring to retail locations/settings, not 스토어; reorder sentences naturally for Korean while keeping true code spans and URLs unchanged.',
    forbiddenVisibleText: ['WCPOS Pro 스토어'],
  },
  it: {
    guidance: 'Italian glossary/style: use professional Italian documentation register; translate generic UI and marketing labels, but preserve product brands; translate store/stores as negozio/negozi or punto/i vendita when referring to retail locations; preserve WCPOS exactly and avoid changing WCPOS to POS; translate POS when it is a visible app/admin menu label if the locale UI has a localized label.',
  },
  nl: {
    guidance: 'Dutch glossary/style: use professional Dutch software-documentation wording; translate generic UI and marketing labels, but preserve product brands; translate store/stores as winkel/winkels when referring to retail locations; preserve WCPOS exactly; translate POS when it is a visible app/admin menu label if the locale UI has a localized label.',
  },
  ar: {
    guidance: 'Arabic glossary/style: use professional Modern Standard Arabic software-documentation wording; translate generic UI and marketing labels, but preserve product brands; preserve WCPOS exactly; translate POS when it is a visible app/admin menu label if the locale UI has a localized label; keep true code spans, URLs, and MDX syntax left-to-right exactly as provided.',
  },
  'hi-IN': {
    guidance: 'Hindi glossary/style: use professional Hindi software-documentation wording for India; translate generic UI and marketing labels, but preserve product brands; preserve WCPOS exactly; translate POS when it is a visible app/admin menu label if the locale UI has a localized label; translate integration consistently as एकीकरण in visible prose, not इंटीग्रेशन; keep true code spans, URLs, and MDX syntax exactly as provided.',
    forbiddenVisibleText: ['इंटीग्रेशन'],
  },
  'zh-CN': {
    guidance: 'Simplified Chinese glossary/style: use concise professional Simplified Chinese software-documentation wording; translate generic UI and marketing labels, but preserve product brands; preserve WCPOS exactly; translate POS when it is a visible app/admin menu label if the locale UI has a localized label; translate WCPOS store/stores as 店铺 when referring to retail locations/settings, not 商店; use Simplified Chinese punctuation in prose, not ASCII commas or colons, while keeping true code spans and URLs unchanged.',
    forbiddenVisibleText: ['WCPOS Pro 商店', '链接,以便'],
  },
};

function stripInlineCodeSpans(line) {
  const ranges = extractInlineCodeRanges(line);
  if (ranges.length === 0) return line;
  let output = '';
  let cursor = 0;
  for (const range of ranges) {
    output += line.slice(cursor, range.start);
    cursor = range.end;
  }
  output += line.slice(cursor);
  return output;
}


function findLocaleStyleViolations(source, locale) {
  if (!locale) return [];
  const visibleText = maskCodeBlocks(source)
    .split('\n')
    .map(stripInlineCodeSpans)
    .join('\n');
  const patterns = DOCS_LOCALE_PROFILES[locale]?.forbiddenStylePatterns ?? [];
  return patterns
    .filter(({ pattern }) => {
      pattern.lastIndex = 0;
      return pattern.test(visibleText);
    })
    .map(({ label }) => label);
}

function stripMarkdownEmphasis(source) {
  return source
    .replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, '$2')
    .replace(/(?<!\*)\*(?!\*)(?=\S)([\s\S]*?\S)\*(?!\*)/g, '$1')
    .replace(/(?<!_)_(?!_)(?=\S)([\s\S]*?\S)_(?!_)/g, '$1');
}

function findUntranslatedVisibleLabels(source, locale) {
  const visibleText = maskCodeBlocks(source)
    .split('\n')
    .map(stripInlineCodeSpans)
    .join('\n');
  const normalizedVisibleText = stripMarkdownEmphasis(visibleText);
  const labels = [
    ...MUST_TRANSLATE_VISIBLE_LABELS,
    ...(locale ? DOCS_LOCALE_PROFILES[locale]?.forbiddenVisibleText ?? [] : []),
  ];
  return labels.filter((label) => {
    const searchableText = PROTECTED_PRODUCT_TERMS.reduce(
      (text, term) => term.includes(label) ? text.replaceAll(term, '') : text,
      normalizedVisibleText,
    );
    return searchableText.includes(label);
  });
}

// Cells that are legitimately identical across locales regardless of language:
// technical acronyms, format/engine tokens, and known multi-word product names.
// Enumerated cell values that must be translated even when a whole column of
// them is left in English; they never mark a column as an identifier column.
const ENUMERATED_CELL_VALUES = new Set([
  'yes', 'no', 'none', 'enabled', 'disabled', 'required', 'optional', 'standard', 'default', 'on', 'off',
]);

const GLOBAL_UNTRANSLATED_CELL_ALLOWLIST = new Set([
  'html', 'esc/pos', 'rtl', 'ltr', 'pdf', 'sku', 'csv', 'json', 'xml', 'url', 'qr',
  'stripe terminal', 'sumup terminal', 'wp overnight',
]);

function splitTableCells(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) return undefined;
  const parts = trimmed.split(/(?<!\\)\|/);
  if (parts.length > 0 && parts[0].trim() === '') parts.shift();
  if (parts.length > 0 && parts[parts.length - 1].trim() === '') parts.pop();
  return parts.map((cell) => cell.trim());
}

function isTableSeparatorRow(cells) {
  return cells.length > 0 && cells.every((cell) => /^:?-+:?$/.test(cell) || cell === '');
}

function tableBlocksOf(masked) {
  const tables = [];
  let rows;
  for (const line of masked.split('\n')) {
    const cells = splitTableCells(line);
    if (!cells) {
      rows = undefined;
      continue;
    }
    if (cells.length === 0 || isTableSeparatorRow(cells)) continue;
    if (!rows) {
      rows = [];
      tables.push(rows);
    }
    rows.push(cells);
  }
  return tables;
}

function visibleCellText(cell) {
  return stripMarkdownEmphasis(stripInlineCodeSpans(cell))
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .trim();
}

// A cell value that is never a translation leak: acronyms, codes, dimensions,
// and "/"-joined alternatives (whose translation is ambiguous and left to the
// LLM drift pass instead).
function isUntranslatableCellToken(visible) {
  if (visible.includes('/')) return true;
  if (/\d/.test(visible)) return true;
  const tokens = visible.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  return tokens.every((token) => /[A-Z]/.test(token) && token === token.toUpperCase());
}

// Table cells left byte-identical to the English source in a non-English locale
// while a sibling cell in the same row WAS translated — a strong signal the cell
// is an untranslated leak (e.g. "Kitchen Ticket", "Detailed Thermal Receipt").
// Acronyms, codes, dimensions, brand names, and per-locale intentional keeps
// (e.g. German "Thermal"/"Engine") are excluded.
function findUntranslatedTableCells(source, translated, locale) {
  if (!locale || locale === 'en') return [];
  const sourceTables = tableBlocksOf(maskCodeBlocks(source));
  const translatedTables = tableBlocksOf(maskCodeBlocks(translated));
  const sourceRows = sourceTables.flat();
  const translatedRows = translatedTables.flat();
  if (sourceRows.length === 0 || sourceRows.length !== translatedRows.length) return [];

  // Infer identifier columns (plugin names, template ids, setting keys) from the
  // data rows, never the header: every cell unchanged, at least two data rows, and
  // every value distinct. Distinctness is the discriminator against a column the
  // translator simply skipped: enumerated values ("Yes", "No", "Standard") repeat
  // across rows and are named below, while identifiers are unique per row.
  const identifierColumnsByRow = sourceTables.flatMap((table, index) => {
    const translatedTable = translatedTables[index] ?? [];
    const columns = table[0].map((_, col) => {
      if (table.length < 3 || table.length !== translatedTable.length) return false;
      const dataCells = table.slice(1).map((cells) => cells[col]);
      // A ragged row (missing trailing cell) must not count as an unchanged value.
      if (!dataCells.every((cell) => typeof cell === 'string' && cell.trim() !== '')) return false;
      if (!dataCells.every((cell, row) => cell === translatedTable[row + 1]?.[col])) return false;
      const values = dataCells.map((cell) => visibleCellText(cell).toLowerCase());
      if (new Set(values).size !== values.length) return false;
      return values.every((value) => !ENUMERATED_CELL_VALUES.has(value));
    });
    return table.map(() => columns);
  });

  const localeAllow = new Set(
    (DOCS_LOCALE_PROFILES[locale]?.untranslatedCellAllowList ?? []).map((entry) => entry.toLowerCase()),
  );
  const flagged = new Set();
  for (let row = 0; row < sourceRows.length; row += 1) {
    const sourceCells = sourceRows[row];
    const translatedCells = translatedRows[row];
    if (sourceCells.length !== translatedCells.length) continue;
    const rowWasTranslated = sourceCells.some((cell, col) =>
      visibleCellText(cell) !== visibleCellText(translatedCells[col])
    );
    if (!rowWasTranslated) continue;
    for (let col = 0; col < sourceCells.length; col += 1) {
      if (identifierColumnsByRow[row][col]) continue;
      if (sourceCells[col] !== translatedCells[col]) continue;
      const visible = visibleCellText(sourceCells[col]);
      if (!/\p{L}/u.test(visible)) continue;
      if (isUntranslatableCellToken(visible)) continue;
      if (PROTECTED_PRODUCT_TERMS.includes(visible)) continue;
      if (GLOBAL_UNTRANSLATED_CELL_ALLOWLIST.has(visible.toLowerCase())) continue;
      if (localeAllow.has(visible.toLowerCase())) continue;
      flagged.add(visible);
    }
  }
  return [...flagged];
}

const ENGLISH_PROSE_MARKERS = new Set([
  'a',
  'an',
  'and',
  'are',
  'at',
  'for',
  'from',
  'how',
  'in',
  'is',
  'my',
  'no',
  'of',
  'on',
  'or',
  'since',
  'the',
  'to',
  'under',
  'with',
  'you',
  'your',
]);

function extractQuotedVisibleText(source) {
  const visibleText = maskCodeBlocks(source)
    .split('\n')
    .map(stripInlineCodeSpans)
    .join('\n');
  const phrases = new Set();
  const patterns = [
    /["“](?<phrase>[^"”\n]{3,})["”]/g,
    /'(?<phrase>[^'\n]{3,})'/g,
  ];
  for (const pattern of patterns) {
    for (const match of visibleText.matchAll(pattern)) {
      const phrase = match.groups?.phrase?.trim();
      if (phrase) phrases.add(phrase);
    }
  }
  return [...phrases];
}

function isUnprotectedEnglishProsePhrase(phrase) {
  if (/[`{}<>/\\]|https?:|www\./i.test(phrase)) return false;
  if (PROTECTED_PRODUCT_TERMS.some((term) => phrase.includes(term))) return false;
  const tokens = phrase.match(/[A-Za-z]+/g) ?? [];
  if (tokens.length < 3) return false;
  return tokens.some((token) => ENGLISH_PROSE_MARKERS.has(token.toLowerCase()));
}

function findUntranslatedQuotedVisibleText(source, translated, locale) {
  if (!locale || locale === 'en') return [];
  const translatedVisibleText = maskCodeBlocks(translated)
    .split('\n')
    .map(stripInlineCodeSpans)
    .join('\n');
  return extractQuotedVisibleText(source)
    .filter(isUnprotectedEnglishProsePhrase)
    .filter((phrase) => translatedVisibleText.includes(phrase));
}

function extractFrontmatter(source) {
  if (!source.startsWith('---\n')) {
    return undefined;
  }
  const end = source.indexOf('\n---', 4);
  if (end === -1) {
    return undefined;
  }
  return source.slice(4, end);
}

function isQuotedYamlScalar(value) {
  const trimmed = value.trim();
  return (trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith('\'') && trimmed.endsWith('\''));
}

function isUnsafeUnquotedYamlScalar(value) {
  const trimmed = value.trim();
  if (trimmed === '' || isQuotedYamlScalar(trimmed)) return false;
  return /:\s/.test(trimmed)
    || /(?:^|\s)#/.test(trimmed)
    || /^[!&*#[\]{}>|'"%@`,?:-]/.test(trimmed)
    || /["{}[\]&*!|>%@`]/.test(trimmed);
}

function findUnsafeFrontmatterScalars(source) {
  const frontmatter = extractFrontmatter(source);
  if (frontmatter === undefined) return [];

  const unsafeKeys = [];
  for (const line of frontmatter.split('\n')) {
    const match = /^(?<key>[A-Za-z0-9_-]+):(?<value>.*)$/.exec(line);
    const key = match?.groups?.key;
    const value = match?.groups?.value;
    if (key === undefined || value === undefined) continue;
    if (isUnsafeUnquotedYamlScalar(value)) {
      unsafeKeys.push(key);
    }
  }
  return unsafeKeys;
}


const PROTECTED_PRODUCT_TERMS = [
  'ATUM Inventory Management',
  'Stripe Terminal',
  'SumUp Terminal',
  'WooCommerce',
  'WordPress',
  'WCPOS',
  'Stripe',
  'SumUp',
];

function countExactTerm(source, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return source.match(new RegExp(`(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`, 'g'))?.length ?? 0;
}

function validateProtectedTermsInText(source, translated, file) {
  const issues = [];
  for (const term of PROTECTED_PRODUCT_TERMS) {
    const sourceCount = countExactTerm(source, term);
    if (sourceCount === 0) continue;
    const translatedCount = countExactTerm(translated, term);
    if (translatedCount < sourceCount) {
      issues.push(issue(
        'protected_term_removed',
        file,
        `Protected product term "${term}" appears ${sourceCount} time(s) in source but ${translatedCount} time(s) in translation.`,
      ));
    }
  }
  return issues;
}

function extractFrontmatterSlug(source) {
  const frontmatter = extractFrontmatter(source);
  if (frontmatter === undefined) {
    return undefined;
  }
  const match = /^slug:(?<value>.*)$/m.exec(frontmatter);
  return match?.groups?.value.trim();
}

function validateDocsMdxStructure(source, translated, file, locale) {
  const issues = [...validateProtectedTermsInText(source, translated, file)];

  if (!sameList(extractCodeBlocks(source), extractCodeBlocks(translated))) {
    issues.push(issue('code_block_changed', file, 'Code block count or content changed.'));
  }

  const sourceWithoutCodeBlocks = maskCodeBlocks(source);
  const translatedWithoutCodeBlocks = maskCodeBlocks(translated);

  if (!sameList(extractImportStatements(sourceWithoutCodeBlocks), extractImportStatements(translatedWithoutCodeBlocks))) {
    issues.push(issue('import_changed', file, 'Import statements changed.'));
  }

  if (!sameList(extractMarkdownLinkUrls(sourceWithoutCodeBlocks), extractMarkdownLinkUrls(translatedWithoutCodeBlocks))) {
    issues.push(issue('link_url_changed', file, 'Markdown link URLs changed.'));
  }

  if (!inlineCodeSpansCompatible(extractInlineCodeSpans(sourceWithoutCodeBlocks), extractInlineCodeSpans(translatedWithoutCodeBlocks), locale)) {
    issues.push(issue('inline_code_changed', file, 'Inline code spans changed.'));
  }

  if (!parenthesizedInlineCodeSpansCompatible(extractParenthesizedInlineCodeSpans(sourceWithoutCodeBlocks), extractParenthesizedInlineCodeSpans(translatedWithoutCodeBlocks), locale)) {
    issues.push(issue('inline_code_punctuation_changed', file, 'Parenthesized inline code punctuation changed.'));
  }

  if (inlineCodeSpacingRegressed(sourceWithoutCodeBlocks, translatedWithoutCodeBlocks)) {
    issues.push(issue('inline_code_spacing_changed', file, 'Inline code spans are directly adjacent to prose.'));
  }

  if (extractFrontmatterSlug(source) !== extractFrontmatterSlug(translated)) {
    issues.push(issue('frontmatter_slug_changed', file, 'Frontmatter slug changed.'));
  }

  const unsafeFrontmatterKeys = findUnsafeFrontmatterScalars(translated);
  if (unsafeFrontmatterKeys.length > 0) {
    issues.push(issue(
      'frontmatter_yaml_unsafe',
      file,
      `Frontmatter has unsafe unquoted YAML scalar values: ${unsafeFrontmatterKeys.join(', ')}.`,
    ));
  }

  const untranslatedVisibleLabels = [
    ...findUntranslatedVisibleLabels(translated, locale),
    ...findUntranslatedQuotedVisibleText(source, translated, locale),
    ...findUntranslatedAdminBreadcrumbLabels(translated, locale),
  ];
  if (untranslatedVisibleLabels.length > 0) {
    issues.push(issue(
      'untranslated_visible_label',
      file,
      `Visible UI/marketing labels were left untranslated: ${untranslatedVisibleLabels.join(', ')}.`,
    ));
  }

  const untranslatedTableCells = findUntranslatedTableCells(source, translated, locale);
  if (untranslatedTableCells.length > 0) {
    issues.push(issue(
      'untranslated_table_cell',
      file,
      `Table cells were left untranslated: ${untranslatedTableCells.join(', ')}.`,
    ));
  }

  const localeStyleViolations = findLocaleStyleViolations(translated, locale);
  if (localeStyleViolations.length > 0) {
    issues.push(issue(
      'locale_style_violation',
      file,
      `Locale style violations found: ${localeStyleViolations.join(', ')}. Use formal Sie or neutral professional documentation wording.`,
    ));
  }

  const duplicateAnchors = findDuplicateHeadingAnchors(translated);
  if (duplicateAnchors.length > 0) {
    issues.push(issue(
      'duplicate_heading_anchor',
      file,
      `Duplicate Docusaurus heading anchor IDs in same file: ${duplicateAnchors.join(', ')}. Each {#anchor} must be unique.`,
    ));
  }

  return issues;
}

function findDuplicateHeadingAnchors(source) {
  const seen = new Map();
  const duplicates = new Set();
  const lines = maskCodeBlocks(source).split(/\r?\n/);
  for (const line of lines) {
    const match = /^\s*#{1,6}\s+.*?\s+\{#([^}\n]+)\}\s*$/.exec(line);
    if (!match) continue;
    const anchor = match[1];
    const count = (seen.get(anchor) ?? 0) + 1;
    seen.set(anchor, count);
    if (count > 1) {
      duplicates.add(anchor);
    }
  }
  return [...duplicates].sort();
}

module.exports = {
  normalizeAdminBreadcrumbInlineCode,
  DOCS_LOCALE_PROFILES,
  validateProtectedTermsInText,
  validateDocsMdxStructure,
};
