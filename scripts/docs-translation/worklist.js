#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { parseDocsMdxUnits } = require('./mdx-units');
const { decodeDocsUnitSource, unitKey, recoverTranslations } = require('./recover');
const { parseJsonUnits } = require('./json-units');
const { readState, unitHash } = require('./state');
const {
  LOCALES, AUDIT_EXCLUDE_DEFAULT, isSignificantProse, lineToProse,
  UNTRANSLATED_PROP_ALLOWLIST, sourceToTranslatedPath, jsonSourceToTranslatedPath,
} = require('../check-translation-completeness');

const PACKET_MAX_CHARS = 30000;
const LOCALE_NAMES = {
  es: 'Spanish', fr: 'French', de: 'German', nl: 'Dutch', ja: 'Japanese',
  'pt-BR': 'Portuguese (Brazil)', ko: 'Korean', it: 'Italian', ar: 'Arabic',
  'hi-IN': 'Hindi (India)', 'zh-CN': 'Chinese (Simplified)',
};

function buildWorklist({ rootDir, locales = LOCALES, maxUnits = Infinity, packetMaxChars = PACKET_MAX_CHARS }) {
  const state = readState(rootDir);
  const gitCache = new Map();
  function git(args, allowFailure = false) {
    const key = JSON.stringify(args);
    if (!gitCache.has(key)) {
      try {
        gitCache.set(key, execFileSync('git', ['-C', rootDir, ...args], {
          encoding: 'utf8', stdio: ['ignore', 'pipe', allowFailure ? 'ignore' : 'pipe'],
        }));
      } catch (error) {
        if (!allowFailure) throw error;
        gitCache.set(key, null);
      }
    }
    return gitCache.get(key);
  }
  function walkJson(directory) {
    if (!fs.existsSync(path.join(rootDir, directory))) return [];
    return fs.readdirSync(path.join(rootDir, directory), { withFileTypes: true }).flatMap(entry => {
      const file = `${directory}/${entry.name}`;
      return entry.isDirectory() ? walkJson(file) : entry.isFile() && file.endsWith('.json') ? [file] : [];
    });
  }
  function baseline(source, target, entry) {
    if (entry.source && git(['cat-file', '-e', entry.source], true) !== null) {
      return { blob: entry.source, text: git(['cat-file', '-p', entry.source]) };
    }
    const commit = git(['log', '-1', '--format=%H', '--', target]).trim();
    const text = commit ? git(['show', `${commit}:${source}`], true) : null;
    return text === null ? { blob: null, text: null }
      : { blob: git(['rev-parse', `${commit}:${source}`]).trim(), text };
  }

  const exclude = new RegExp(process.env.AUDIT_EXCLUDE ?? AUDIT_EXCLUDE_DEFAULT);
  const sources = [
    ...git(['ls-files', '-z', 'versioned_docs']).split('\0').filter(file => /\.mdx?$/.test(file)),
    ...walkJson('i18n/en'),
  ].filter(file => !exclude.test(file)).sort();
  const selectedLocales = LOCALES.filter(locale => locales.includes(locale));
  const groups = [];
  const plan = { targets: [] };
  const summary = {
    total: 0, packets: 0,
    targets: { translate: 0, refresh: 0, record: 0, unchanged: 0, deferred: 0 },
    deferred_units: 0, locales: {},
  };

  for (const source of sources) {
    const sourceText = fs.readFileSync(path.join(rootDir, source), 'utf8');
    const currentBlob = git(['hash-object', source]).trim();
    const kind = source.endsWith('.json') ? 'json' : 'mdx';
    const parsed = kind === 'mdx' ? parseDocsMdxUnits(source, sourceText) : null;
    const units = kind === 'json' ? parseJsonUnits(sourceText).map(unit => ({ ...unit, type: 'json' }))
      : parsed.units.map((unit, index) => ({ ...unit, index, source: decodeDocsUnitSource(parsed, unit) }));
    const group = { source, priority: Infinity, targets: [], count: 0 };
    for (const locale of selectedLocales) {
      const target = (kind === 'json' ? jsonSourceToTranslatedPath : sourceToTranslatedPath)(source, locale);
      const exists = fs.existsSync(path.join(rootDir, target));
      const saved = state[target] ?? {};
      const old = exists ? baseline(source, target, saved) : { blob: null, text: null };
      const targetText = exists ? fs.readFileSync(path.join(rootDir, target), 'utf8') : null;
      let targetJson;
      if (kind === 'json' && exists) {
        try { targetJson = JSON.parse(targetText); } catch { targetJson = undefined; }
      }
      const oldJson = kind === 'json' && old.text !== null ? JSON.parse(old.text) : null;
      const recovered = kind === 'mdx' && old.text !== null ? recoverTranslations({
        file: target, locale, oldEnglishPath: source, oldEnglish: old.text, target: targetText,
      }).translations : new Map();
      const pending = [];
      const reused = {};
      const reasons = { missing: 0, changed: 0, english: 0 };
      for (const unit of units) {
        const key = kind === 'json' ? ['json', unit.key, '', unit.source].join('\u0000') : unitKey(unit, unit.source);
        const hash = unitHash(key);
        let translation;
        let reason;
        if (!exists || (kind === 'json' && targetJson === undefined)) {
          reason = 'missing';
        } else {
          if (kind === 'mdx') translation = recovered.get(key) ?? saved.partial?.[hash];
          else {
            const value = targetJson?.[unit.key];
            const message = typeof value === 'string' ? value : value?.message;
            const oldValue = oldJson?.[unit.key];
            const oldMessage = typeof oldValue === 'string' ? oldValue : oldValue?.message;
            translation = typeof message === 'string' && message.length > 0
              && (old.text === null || oldMessage === unit.source) ? message : saved.partial?.[hash];
          }
          const significant = kind === 'json' ? /\p{L}/u.test(unit.source)
            : isSignificantProse(lineToProse(unit.source)) && !UNTRANSLATED_PROP_ALLOWLIST.has(unit.source.trim());
          if (translation === undefined || translation === null) reason = 'changed';
          else if (translation === unit.source && significant && !saved.same?.includes(hash)) reason = 'english';
        }
        if (reason) {
          pending.push(unit.index);
          reasons[reason] += 1;
        } else reused[unit.index] = translation;
      }
      const status = pending.length ? 'translate' : old.blob !== currentBlob || !exists ? 'refresh'
        : saved.source !== currentBlob ? 'record' : 'unchanged';
      const entry = { target, source, locale, kind, status, source_blob: currentBlob, pending };
      if (status !== 'record') entry.reused = reused;
      entry.reasons = reasons;
      if (status === 'translate') {
        const priority = kind === 'json' ? 0 : reasons.changed ? 1 : reasons.missing ? 3 : 2;
        group.priority = Math.min(group.priority, priority);
        group.count += pending.length;
        group.targets.push({ entry, units: units.filter(unit => pending.includes(unit.index)), exists });
      } else {
        summary.targets[status] += 1;
        if (status !== 'unchanged') plan.targets.push(entry);
      }
    }
    if (group.targets.length) groups.push(group);
  }

  groups.sort((a, b) => a.priority - b.priority || (a.source < b.source ? -1 : a.source > b.source ? 1 : 0));
  const taken = [];
  let deferred = false;
  for (const [index, group] of groups.entries()) {
    if (index > 0 && summary.total + group.count > maxUnits) deferred = true;
    if (deferred) {
      summary.targets.deferred += group.targets.length;
      summary.deferred_units += group.count;
    } else {
      summary.total += group.count;
      summary.targets.translate += group.targets.length;
      taken.push(...group.targets);
      plan.targets.push(...group.targets.map(item => item.entry));
    }
  }

  const glossary = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts/docs-translation/glossary.json'), 'utf8'));
  const packets = [];
  for (const locale of selectedLocales) {
    let packet;
    for (const { entry, units, exists } of taken.filter(item => item.entry.locale === locale)) {
      const chars = units.reduce((sum, unit) => sum + unit.source.length, 0);
      if (!packet || packet.counts.chars + chars > packetMaxChars) {
        const notes = `scripts/docs-translation/locale-context/${locale}.md`;
        packet = {
          locale, locale_name: LOCALE_NAMES[locale],
          locale_notes: fs.existsSync(path.join(rootDir, notes)) ? notes : null,
          glossary: glossary[locale] ?? {}, counts: { units: 0, files: 0, chars: 0 }, files: {},
        };
        packets.push(packet);
      }
      const packetUnits = {};
      for (const unit of units) {
        const value = { type: unit.type, source: unit.source };
        for (const field of ['key', 'attr', 'description']) {
          if (unit[field] !== undefined) value[field] = unit[field];
        }
        packetUnits[`u${unit.index}`] = value;
      }
      packet.files[entry.target] = {
        source_path: entry.source, existing_translation: exists ? entry.target : null,
        kind: entry.kind, units: packetUnits,
      };
      packet.counts.units += units.length;
      packet.counts.files += 1;
      packet.counts.chars += chars;
      const counts = summary.locales[locale] ??= { units: 0, files: 0 };
      counts.units += units.length;
      counts.files += 1;
    }
  }
  summary.packets = packets.length;
  plan.targets.sort((a, b) => a.target < b.target ? -1 : a.target > b.target ? 1 : 0);
  return { packets, plan, summary };
}

function runCli(argv) {
  const args = { rootDir: path.resolve(__dirname, '../..') };
  let outDir;
  let planFile;
  for (let i = 0; i < argv.length; i += 1) {
    const option = argv[i];
    if (!['--out', '--plan', '--locale', '--max-units', '--root'].includes(option)) {
      throw new Error(`Unknown argument: ${option}`);
    }
    const value = argv[++i];
    if (!value || value.startsWith('-')) throw new Error(`Missing value for ${option}`);
    if (option === '--out') outDir = path.resolve(value);
    if (option === '--plan') planFile = path.resolve(value);
    if (option === '--root') args.rootDir = path.resolve(value);
    if (option === '--locale') {
      if (!LOCALES.includes(value)) throw new Error(`Unknown locale: ${value}`);
      (args.locales ??= []).push(value);
    }
    if (option === '--max-units') {
      if (!/^[0-9]+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) <= 0) {
        throw new Error('--max-units must be a positive integer');
      }
      args.maxUnits = Number(value);
    }
  }
  if (!outDir) throw new Error('--out is required');
  if (!planFile) throw new Error('--plan is required');
  const { packets, plan, summary } = buildWorklist(args);
  fs.mkdirSync(outDir, { recursive: true });
  for (const file of fs.readdirSync(outDir)) {
    if (file.endsWith('.json')) fs.unlinkSync(path.join(outDir, file));
  }
  const chunks = {};
  for (const packet of packets) {
    chunks[packet.locale] = (chunks[packet.locale] ?? 0) + 1;
    const name = `${packet.locale}-${String(chunks[packet.locale]).padStart(2, '0')}`;
    fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(packet, null, 2) + '\n');
  }
  fs.mkdirSync(path.dirname(planFile), { recursive: true });
  fs.writeFileSync(planFile, JSON.stringify(plan, null, 2) + '\n');
  process.stdout.write(JSON.stringify(summary) + '\n');
}

if (require.main === module) {
  try {
    runCli(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}

module.exports = { buildWorklist, runCli, PACKET_MAX_CHARS };
