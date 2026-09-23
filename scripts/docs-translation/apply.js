#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseDocsMdxUnits, applyDocsMdxTranslations } = require('./mdx-units');
const { parseJsonUnits, applyJsonTranslations } = require('./json-units');
const { decodeDocsUnitSource, unitKey, STRUCTURAL_ISSUE_CODES } = require('./recover');
const { readState, writeState, unitHash } = require('./state');
const {
  applyStableHeadingAnchorsFromSource, missingPreservedHeadingAnchors,
  restoreNonBreadcrumbInlineCodeSpans,
} = require('./heading-anchors');
const {
  normalizeAdminBreadcrumbInlineCode, validateDocsMdxStructure, validateProtectedTermsInText,
} = require('./docs-qa');
const {
  LOCALES, sourceToTranslatedPath,
  findUntranslatedProps, findLeftoverProse, isStub, findMissingSections,
} = require('../check-translation-completeness');
const { canonicalizeDescriptionQuoting, validateFrontmatter } = require('../validate-frontmatter');

function applyResults({ rootDir, plan, results }) {
  const state = readState(rootDir);
  const previousTargets = new Set(Object.keys(state));
  const report = { applied: 0, rejected: 0, warnings: 0, missing: 0,
    files_written: [], files_incomplete: [], sources_held_back: [], rejected_details: [], warning_details: [] };
  const candidates = [];
  for (const entry of plan.targets) {
    const { target, source, locale, kind, status, source_blob, pending, reused } = entry;
    const saved = state[target] ??= {};
    if (status === 'record') {
      saved.source = source_blob;
      continue;
    }
    const english = fs.readFileSync(path.join(rootDir, source), 'utf8');
    const targetPath = path.join(rootDir, target);
    const existing = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : undefined;
    const parsed = kind === 'mdx' ? parseDocsMdxUnits(source, english) : null;
    const units = kind === 'mdx' ? parsed.units : parseJsonUnits(english);
    const translations = new Map(Object.entries(reused ?? {}).map(([index, text]) => [Number(index), text]));
    const accepted = {};
    for (const index of pending) {
      const id = `u${index}`;
      let text = results.filter(result => result?.locale === locale)
        .map(result => result.files?.[target]?.[id]).find(value => value !== undefined);
      if (typeof text !== 'string') {
        report.missing += 1;
        continue;
      }
      const unit = units[index];
      const decoded = kind === 'mdx' ? decodeDocsUnitSource(parsed, unit) : unit.source;
      const key = kind === 'mdx' ? unitKey(unit, decoded) : ['json', unit.key, '', decoded].join('\u0000');
      let issues = [];
      const reasons = [];
      if (kind === 'mdx') {
        text = text.replace(/（(`[^`\n]+`)）/g, '($1)');
        text = restoreNonBreadcrumbInlineCodeSpans(decoded, normalizeAdminBreadcrumbInlineCode(decoded, text, locale));
        if (text.split('\n').length !== decoded.split('\n').length) reasons.push('line_count');
        if (unit.type !== 'paragraph' && text.includes('\n')) reasons.push('non_paragraph_newline');
        issues = [...validateDocsMdxStructure(decoded, text, target, locale),
          ...validateProtectedTermsInText(decoded, text, target)];
        reasons.push(...new Set(issues.filter(issue => STRUCTURAL_ISSUE_CODES.has(issue.code)).map(issue => issue.code)));
      } else {
        const sourcePlaceholders = (decoded.match(/\{[^{}]*\}/g) ?? []).sort();
        const translatedPlaceholders = (text.match(/\{[^{}]*\}/g) ?? []).sort();
        if (JSON.stringify(sourcePlaceholders) !== JSON.stringify(translatedPlaceholders)) reasons.push('placeholders');
      }
      if (!(kind === 'json' && decoded.includes('|'))) {
        const numbers = text.match(/\d+/g) ?? [];
        if ((decoded.match(/\d+/g) ?? []).some(number => {
          const index = numbers.indexOf(number);
          if (index === -1) return true;
          numbers.splice(index, 1);
          return false;
        })) reasons.push('numbers');
      }
      if (text.trim() === '') reasons.push('empty');
      if (text.includes('WooCommerce POS')) reasons.push('WooCommerce POS');
      if (reasons.length) {
        report.rejected += 1;
        report.rejected_details.push({ target, unit: id, reason: reasons.join(', ') });
        continue;
      }
      const codes = [...new Set(issues.filter(issue => !STRUCTURAL_ISSUE_CODES.has(issue.code)).map(issue => issue.code))];
      if (text === decoded) codes.push('identical');
      if (codes.length) {
        report.warnings += 1;
        report.warning_details.push({ target, unit: id, codes });
      }
      translations.set(index, text);
      const hash = unitHash(key);
      accepted[hash] = text;
      if (text === decoded && !saved.same?.includes(hash)) (saved.same ??= []).push(hash);
      report.applied += 1;
    }

    let complete = units.every((_unit, index) => translations.has(index));
    let fileRejected = false;
    let out;
    if (complete) {
      if (kind === 'json') out = applyJsonTranslations(english, translations);
      else {
        out = applyDocsMdxTranslations(parsed, new Map(units.map((unit, index) => [unit.id, translations.get(index)])));
        out = applyStableHeadingAnchorsFromSource(english, out, existing);
        out = canonicalizeDescriptionQuoting(out).content;
        const reasons = [];
        if (!validateFrontmatter(out).valid) reasons.push('frontmatter');
        reasons.push(...new Set(validateDocsMdxStructure(english, out, target, locale)
          .filter(issue => STRUCTURAL_ISSUE_CODES.has(issue.code)).map(issue => issue.code)));
        if (existing && missingPreservedHeadingAnchors(english, out, existing)
          .filter(anchor => english.includes(anchor)).length) reasons.push('missing_preserved_anchors');
        if (findUntranslatedProps(english, out).length > 0) reasons.push('untranslated_props');
        if (isStub(english, out, locale)) reasons.push('stub');
        if (findLeftoverProse(english, out).length >= 3) reasons.push('leftover_prose');
        if (findMissingSections(english, out).length >= 1) reasons.push('missing_sections');
        if (reasons.length) {
          complete = false;
          fileRejected = true;
          report.rejected += 1;
          report.rejected_details.push({ target, unit: null, reason: reasons.join(', ') });
        }
      }
    }
    candidates.push({ entry, english, existing, out, complete, accepted, fileRejected });
  }

  const proposed = new Map(candidates.filter(item => item.complete && item.out !== item.existing)
    .map(item => [item.entry.target, item.out]));
  const checkedSources = new Set();
  for (const { entry, english } of candidates) {
    if (entry.kind !== 'mdx' || !proposed.has(entry.target) || checkedSources.has(entry.source)) continue;
    checkedSources.add(entry.source);
    const dropped = LOCALES.some(locale => {
      const target = sourceToTranslatedPath(entry.source, locale);
      let content = proposed.get(target);
      if (content === undefined && fs.existsSync(path.join(rootDir, target))) {
        content = fs.readFileSync(path.join(rootDir, target), 'utf8');
      }
      return content === undefined || isStub(english, content, locale);
    });
    if (dropped) report.sources_held_back.push(entry.source);
  }

  const writes = [];
  for (const { entry, out, existing, complete, accepted, fileRejected } of candidates) {
    const saved = state[entry.target];
    const held = proposed.has(entry.target) && report.sources_held_back.includes(entry.source);
    if (complete && !held) {
      saved.source = entry.source_blob;
      delete saved.partial;
      if (out !== existing) writes.push({ path: entry.target, content: out });
    } else {
      if (fileRejected) delete saved.partial;
      else Object.assign(saved.partial ??= {}, accepted);
      report.files_incomplete.push(entry.target);
    }
  }
  for (const [target, saved] of Object.entries(state)) {
    if (!previousTargets.has(target) && saved.source === undefined
      && !saved.same?.length && !Object.keys(saved.partial ?? {}).length) delete state[target];
  }
  report.files_written = writes.map(write => write.path);
  return { writes, state, report };
}

function runCli(argv) {
  const options = { '--root': path.resolve(__dirname, '../..') };
  const required = ['--plan', '--results', '--report', '--report-md'];
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (![...required, '--root'].includes(option)) throw new Error(`Unknown argument: ${option}`);
    const value = argv[++index];
    if (!value || value.startsWith('-')) throw new Error(`Missing value for ${option}`);
    options[option] = path.resolve(value);
  }
  for (const option of required) {
    if (!options[option]) throw new Error(`${option} is required`);
  }
  const rootDir = options['--root'];
  const plan = JSON.parse(fs.readFileSync(options['--plan'], 'utf8'));
  const results = [];
  const resultsDir = options['--results'];
  const files = fs.existsSync(resultsDir) ? fs.readdirSync(resultsDir).sort() : [];
  for (const file of files.filter(file => file.endsWith('.json'))) {
    try { results.push(JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf8'))); } catch { /* Missing or invalid results remain pending. */ }
  }
  const { writes, state, report } = applyResults({ rootDir, plan, results });
  for (const write of writes) {
    const file = path.join(rootDir, write.path);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, write.content);
  }
  writeState(rootDir, state);
  const { applied, rejected, warnings, missing } = report;
  const counts = new Map();
  for (const file of report.files_written) {
    const locale = plan.targets.find(entry => entry.target === file).locale;
    counts.set(locale, (counts.get(locale) ?? 0) + 1);
  }
  const markdown = [
    `Applied: ${applied}; rejected: ${rejected}; warnings: ${warnings}; missing: ${missing}; files written: ${writes.length}; incomplete: ${report.files_incomplete.length}.`,
    '', '| Locale | Files written |', '| --- | --- |',
    ...[...counts].map(([locale, count]) => `| ${locale} | ${count} |`),
    '', '## Rejected units', '', '| Target | Unit | Reason |', '| --- | --- | --- |',
    ...report.rejected_details.slice(0, 50).map(item => `| ${item.target} | ${item.unit ?? 'file'} | ${item.reason} |`),
    '', '## Warnings', '', '| Target | Unit | Codes |', '| --- | --- | --- |',
    ...report.warning_details.slice(0, 50).map(item => `| ${item.target} | ${item.unit} | ${item.codes.join(', ')} |`),
    '', '## Held-back sources', '', ...report.sources_held_back.map(source => `- ${source}`), '',
  ].join('\n');
  for (const [file, content] of [[options['--report'], JSON.stringify(report, null, 2) + '\n'], [options['--report-md'], markdown]]) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  process.stdout.write(JSON.stringify({ applied, rejected, warnings, missing, files: writes.length, incomplete: report.files_incomplete.length }) + '\n');
}

if (require.main === module) {
  try {
    runCli(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}

module.exports = { applyResults, runCli };
