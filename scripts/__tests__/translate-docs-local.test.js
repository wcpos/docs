const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// The script uses macOS /usr/bin/lockf and runs only on the Mac mini.
describe.skipIf(process.platform !== 'darwin')('translate-docs-local.sh', () => {
// Each integration case starts many CLI processes on the shared Mac mini.
vi.setConfig({ testTimeout: 25000 });

const script = path.resolve(__dirname, '../translate-docs-local.sh');
let source, root, bin, wt, copy, callsFile, env;
const readCalls = () => fs.readFileSync(callsFile, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const isCall = (call, tool, ...args) => call.tool === tool && args.every(arg => call.args.includes(arg));
const models = result => result.calls.filter(c => ['codex', 'claude'].includes(c.tool));
const body = () => fs.readFileSync(path.join(wt, '.translate/pr-body.md'), 'utf8');
const pr = { number: 42, headRefName: 'docs-translate/existing', url: 'https://example.test/pr/42', isCrossRepository: false };
const gates = ['validate-frontmatter.js', 'check-translation-completeness.js', 'check-translation-safety.js'];
function run(config = {}, args = [], overrides = {}) {
  fs.writeFileSync(path.join(root, 'config.json'), JSON.stringify(config));
  fs.writeFileSync(callsFile, '');
  fs.writeFileSync(path.join(root, 'executions.txt'), '');
  const result = spawnSync('/bin/bash', [copy, ...args], { env: { ...env, ...overrides }, encoding: 'utf8', timeout: 20000 });
  assert.ifError(result.error);
  return { ...result, calls: readCalls() };
}

beforeAll(() => {
  source = fs.readFileSync(script, 'utf8');
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'translate-docs-local-')));
  bin = path.join(root, 'bin');
  wt = path.join(root, '.claude/worktrees/docs-translate');
  copy = path.join(root, 'translate-docs-local.sh');
  callsFile = path.join(root, 'calls.jsonl');
  env = { ...process.env, TMPDIR: root, TRANSLATE_REPO_ROOT: root };
  for (const key of ['TRANSLATE_LOCAL_REEXEC', 'TRANSLATE_TRANSLATOR', 'TRANSLATE_MODEL', 'TRANSLATE_REVIEW_MODEL', 'TRANSLATE_EFFORT']) delete env[key];
  for (const dir of [bin, path.join(wt, 'scripts/docs-translation')]) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(wt, 'scripts/docs-translation/translate-prompt.md'), 'TRANSLATE\n## Packets for this run\n');
  fs.writeFileSync(path.join(wt, 'scripts/docs-translation/review-prompt.md'), 'REVIEW\n## Packets for this run\n');
  // Redirect command lookup, shorten the timeout, and record executed paths in this isolated copy.
  fs.writeFileSync(copy, source.replace(/^PATH=.*$/m, 'PATH=' + JSON.stringify(bin) + ':$PATH').replace('CALL_TIMEOUT=1800', 'CALL_TIMEOUT=1')
    .replace('set -euo pipefail\n', 'set -euo pipefail\nprintf \'%s\\n\' "$0" >> ' + JSON.stringify(path.join(root, 'executions.txt')) + '\n'));
  const stub = String.raw`#!@NODE@
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const root = path.dirname(__dirname), tool = path.basename(process.argv[1]), args = process.argv.slice(2);
const config = JSON.parse(fs.readFileSync(path.join(root, 'config.json')));
const wt = path.join(root, '.claude/worktrees/docs-translate');
fs.appendFileSync(path.join(root, 'calls.jsonl'), JSON.stringify({ tool, args, cwd: process.cwd(), base: process.env.BASE_REF }) + '\n');
if (tool === 'git') {
  if (args.includes('show')) {
    if (!config.reexec) process.exit(1);
    process.stdout.write(fs.readFileSync(path.join(root, 'translate-docs-local.sh'), 'utf8') + (config.reexec === 'updated' ? '\n# updated\n' : ''));
  }
  if (args.includes('list') && !config.newWorktree) console.log('worktree ' + wt);
  if (args.includes('status') && fs.existsSync('.translate/accepted')) console.log(' M i18n/translation-state.json');
  if (args.includes('diff')) console.log(JSON.parse(fs.readFileSync('.translate/accepted')).join('\n'));
  if (args.includes('merge') && !args.includes('--abort') && config.conflict) process.exit(1);
} else if (tool === 'gh') {
  if (args[1] === 'list') {
    const filtered = cp.spawnSync('jq', [args[args.indexOf('--jq') + 1]], { input: JSON.stringify(config.prs || (config.pr ? [config.pr] : [])), encoding: 'utf8' });
    process.stdout.write(filtered.stdout);
    process.exit(filtered.status);
  }
  if (args[1] === 'create' && args[0] === 'pr') console.log('https://example.test/pr/1');
  if (args[0] === 'label' && config.labelExists) process.exit(1);
} else if (tool === 'pnpm') {
  if (args[0] === 'write-translations') console.log('English UI strings regenerated');
} else if (tool === 'node') {
  if (args[0] === 'scripts/docs-translation/worklist.js') {
    const counts = config.counts || [2, 1], names = config.packets || ['fr-01', 'de-01'], locales = {};
    fs.mkdirSync('.translate/work', { recursive: true });
    counts.forEach((n, i) => {
      const locale = names[i].replace(/-\d+$/, ''); locales[locale] = n;
      fs.writeFileSync('.translate/work/' + names[i] + '.json', JSON.stringify({ locale, count: n }));
    });
    fs.writeFileSync('.translate/plan.json', '{}');
    const total = counts.reduce((a, b) => a + b, 0);
    console.log(JSON.stringify({ total, packets: counts.length, targets: { translate: counts.length, refresh: 0, record: 0, unchanged: 0, deferred: 0 }, deferred_units: config.deferred || 0, locales }));
  } else if (args[0] === 'scripts/docs-translation/apply.js') {
    const results = fs.readdirSync('.translate/results').filter(f => f.endsWith('.json'));
    const packets = results.map(f => JSON.parse(fs.readFileSync('.translate/work/' + f)));
    const files = results.map((f, i) => 'i18n/' + packets[i].locale + '/' + f);
    files.push(...(config.refresh || []));
    const report = { applied: packets.reduce((n, p) => n + p.count, 0), rejected: 0, warnings: 0, missing: 0, files: files.length, incomplete: 0 };
    fs.writeFileSync('.translate/report.json', JSON.stringify(report));
    fs.writeFileSync('.translate/report.md', 'REPORT\n');
    if (files.length || config.record) fs.writeFileSync('.translate/accepted', JSON.stringify([...files, 'i18n/en/code.json', 'i18n/translation-state.json']));
    console.log(JSON.stringify(report));
  } else if (args[0] === 'scripts/sync-translations.js') {
    process.exit(0);
  } else if (['scripts/validate-frontmatter.js', 'scripts/check-translation-completeness.js', 'scripts/check-translation-safety.js'].includes(args[0])) {
    process.exit(config.invalid === path.basename(args[0]) ? 1 : 0);
  } else process.exit(99);
} else if (tool === 'codex' || tool === 'claude') {
  const prompt = fs.readFileSync(0, 'utf8');
  fs.appendFileSync(path.join(root, 'calls.jsonl'), JSON.stringify({ tool: 'prompt', prompt }) + '\n');
  console.log('MODEL LOG');
  if (config.fail && prompt.includes('/de-01.json')) process.exit(1);
  if (config.failReview && prompt.startsWith('REVIEW')) process.exit(1);
  if (config.hang) {
    const child = cp.spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { stdio: 'ignore' });
    fs.writeFileSync(path.join(root, 'child.pid'), String(child.pid));
    setInterval(() => {}, 1000);
  } else if (!config.noResults) {
    for (const match of prompt.matchAll(/-> (\.translate\/results\/([\w-]+)\.json)/g)) fs.writeFileSync(match[1], '{}');
  }
}
`.replace('@NODE@', process.execPath);
  for (const tool of ['git', 'gh', 'pnpm', 'node', 'codex', 'claude']) fs.writeFileSync(path.join(bin, tool), stub, { mode: 0o755 });
});
afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

it('is executable Bash and contains no forbidden commands or models', () => {
  const syntax = spawnSync('/bin/bash', ['-n', script], { encoding: 'utf8' });
  assert.equal(syntax.status, 0, syntax.stderr);
  assert.match(source, /^#!\/bin\/bash\nset -euo pipefail/);
  assert.ok(fs.statSync(script).mode & 0o111);
  for (const forbidden of ['--force', 'push origin main', 'gh pr merge', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'MAX_PER_CALL', '--max-per-call', 'TRANSLATE_CHUNK_SELFTEST']) assert.ok(!source.includes(forbidden), forbidden);
  assert.doesNotMatch(source, /gpt-5\./);
});

it('applies an empty plan and exits 0 without any model, commit, or push', () => {
  const result = run({ counts: [] });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /nothing to translate/);
  assert.equal(models(result).length, 0);
  assert.ok(result.calls.some(c => isCall(c, 'node', 'scripts/docs-translation/apply.js')));
  assert.ok(!result.calls.some(c => isCall(c, 'git', 'commit') || isCall(c, 'git', 'push')));
});

it.each(['updated', 'identical', false].flatMap(reexec => [[], [2, 1]].map(counts => ({ counts, reexec }))))('prints a dry-run summary, preserving arguments across exactly one self-update: %j', ({ counts, reexec }) => {
  const result = run({ counts, reexec }, ['--dry-run', '--base', 'stack', '--locale', 'de', '--locale', 'fr', '--max-units', '7']);
  assert.equal(result.status, 0, result.stderr);
  const executions = fs.readFileSync(path.join(root, 'executions.txt'), 'utf8').trim().split('\n');
  assert.equal(executions.length, 2);
  assert.equal(executions[0], copy);
  assert.notEqual(executions[1], copy);
  assert.equal(path.dirname(executions[1]), root);
  assert.equal(fs.readFileSync(executions[1], 'utf8'), fs.readFileSync(copy, 'utf8') + (reexec === 'updated' ? '\n# updated\n' : ''));
  assert.equal(JSON.parse(result.stdout).total, counts.reduce((a, b) => a + b, 0));
  assert.equal(result.calls.filter(c => isCall(c, 'git', 'show', 'origin/stack:scripts/translate-docs-local.sh')).length, 1);
  assert.equal(result.calls.filter(c => isCall(c, 'git', 'fetch')).length, 2);
  assert.ok(result.calls.some(c => isCall(c, 'git', 'checkout', 'origin/stack')));
  assert.deepEqual(result.calls.find(c => isCall(c, 'node', 'scripts/docs-translation/worklist.js')).args, ['scripts/docs-translation/worklist.js', '--out', '.translate/work', '--plan', '.translate/plan.json', '--locale', 'de', '--locale', 'fr', '--max-units', '7']);
  assert.equal(models(result).length, 0);
  assert.ok(!result.calls.some(c => isCall(c, 'node', 'scripts/docs-translation/apply.js') || isCall(c, 'git', 'commit') || isCall(c, 'git', 'push')));
  assert.ok(!fs.existsSync(path.join(wt, '.translate/results')));
});

it('translates and reviews each sorted packet with the reference CLI arguments and publishes the report after all gates', () => {
  const result = run({ deferred: 17, newWorktree: true, labelExists: true });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(models(result).map(c => c.args), ['gpt-6-luna', 'gpt-6-sol', 'gpt-6-luna', 'gpt-6-sol'].map(model => ['exec', '-m', model, '-c', 'model_reasoning_effort="medium"', '-c', 'approval_policy="never"', '-s', 'workspace-write', '-C', wt, '-']));
  const prompts = result.calls.filter(c => c.tool === 'prompt').map(c => c.prompt);
  assert.deepEqual(prompts.map(p => p.match(/work\/([^\s]+)\.json/)[1]), ['de-01', 'de-01', 'fr-01', 'fr-01']);
  assert.deepEqual(prompts.map(p => p.split('\n')[0]), ['TRANSLATE', 'REVIEW', 'TRANSLATE', 'REVIEW']);
  for (const packet of ['de-01', 'fr-01']) for (const prefix of ['', 'review-']) assert.match(fs.readFileSync(path.join(wt, '.translate/logs/' + prefix + packet + '.log'), 'utf8'), /MODEL LOG/);
  assert.deepEqual(result.calls.filter(c => c.tool === 'pnpm').map(c => c.args), [['install', '--prefer-offline', '--silent'], ['write-translations', '--locale', 'en']]);
  assert.ok(result.calls.findIndex(c => isCall(c, 'pnpm', 'write-translations')) < result.calls.findIndex(c => isCall(c, 'node', 'scripts/docs-translation/worklist.js')));
  assert.ok(result.calls.some(c => isCall(c, 'node', '--max-units', '1500')));
  assert.deepEqual(result.calls.find(c => isCall(c, 'node', 'scripts/docs-translation/apply.js')).args, ['scripts/docs-translation/apply.js', '--plan', '.translate/plan.json', '--results', '.translate/results', '--report', '.translate/report.json', '--report-md', '.translate/report.md']);
  assert.ok(result.calls.some(c => isCall(c, 'git', 'worktree', 'add', '--detach', wt, 'origin/main')));
  assert.ok(result.calls.some(c => isCall(c, 'git', 'add', 'i18n')));
  const commit = result.calls.findIndex(c => isCall(c, 'git', 'commit', 'docs(i18n): translate 3 units in 2 files'));
  const push = result.calls.findIndex(c => isCall(c, 'git', 'push', '--quiet', '-u', 'origin'));
  assert.ok(commit >= 0 && push > commit);
  for (const [i, gate] of gates.entries()) {
    const index = result.calls.findIndex(c => isCall(c, 'node', 'scripts/' + gate));
    assert.ok(index > commit && index < push);
    assert.equal(result.calls[index].base, 'origin/main');
    assert.deepEqual(result.calls[index].args.slice(1), i === 0 ? ['--check', '--changed'] : i === 1 ? ['--changed'] : []);
  }
  assert.match(body(), /^Applied 3 units in 2 files \(de, fr\); translator: codex \(gpt-6-luna\); review: gpt-6-sol; deferred: 17 units\.\n\nREPORT\n\nGenerated by scripts\/translate-docs-local.sh on .+ at \d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ\.\n$/);
  const create = result.calls.find(c => isCall(c, 'gh', 'pr', 'create', '-R', 'wcpos/docs', '--base', 'main', '--label', 'docs-translate', '--body-file', '.translate/pr-body.md'));
  assert.ok(create);
  assert.match(create.args[create.args.indexOf('--head') + 1], /^docs-translate\/\d{8}-\d{6}$/);
  assert.match(create.args[create.args.indexOf('--title') + 1], /^docs\(i18n\): automated docs translations \d{4}-\d\d-\d\d$/);
  assert.match(result.stdout, /https:\/\/example.test\/pr\/1/);
  assert.ok(result.calls.filter(c => models(result).includes(c) || (c.tool === 'git' && ['reset', 'clean', 'checkout', 'add', 'commit', 'push'].includes(c.args[0]))).every(c => c.cwd === wt));
});

it('continues after a failed packet and lets CLI flags override environment models and effort', () => {
  const result = run({ fail: true }, ['--translator', 'codex', '--model', 'chosen', '--review-model', 'chosen-review', '--effort', 'high'], { TRANSLATE_TRANSLATOR: 'claude', TRANSLATE_MODEL: 'env-model', TRANSLATE_REVIEW_MODEL: 'env-review', TRANSLATE_EFFORT: 'low' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(models(result).map(c => c.args[c.args.indexOf('-m') + 1]), ['chosen', 'chosen', 'chosen-review']);
  assert.ok(models(result).every(c => c.tool === 'codex' && c.args.includes('model_reasoning_effort="high"')));
  assert.match(result.stdout, /packet de-01 failed or timed out; continuing/);
  assert.match(body(), /^Applied 2 units in 1 files \(fr\); translator: codex \(chosen\); review: chosen-review;/);
});

it('cleans orphan translations immediately after English regeneration', () => {
  const result = run({ counts: [] });
  assert.equal(result.status, 0, result.stderr);
  const regeneration = result.calls.findIndex(c => isCall(c, 'pnpm', 'write-translations'));
  assert.deepEqual(result.calls[regeneration + 1].args, ['scripts/sync-translations.js', '--clean']);
  assert.equal(result.calls[regeneration + 1].tool, 'node');
});

it('stages regeneration before models, then discards model edits before apply', () => {
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  const worklist = result.calls.findIndex(c => isCall(c, 'node', 'scripts/docs-translation/worklist.js'));
  const firstModel = result.calls.indexOf(models(result)[0]);
  const lastModel = result.calls.indexOf(models(result).at(-1));
  assert.deepEqual(result.calls[worklist + 1].args, ['add', '-A', 'i18n']);
  assert.equal(result.calls[worklist + 1].tool, 'git');
  assert.ok(worklist + 1 < firstModel);
  const checkout = result.calls.findIndex(c => isCall(c, 'git', 'checkout', '--', '.'));
  const apply = result.calls.findIndex(c => isCall(c, 'node', 'scripts/docs-translation/apply.js'));
  assert.ok(checkout > lastModel && checkout + 2 === apply);
  assert.deepEqual(result.calls[checkout + 1].args, ['clean', '-fdq']);
  assert.equal(result.calls[checkout + 1].tool, 'git');
  assert.ok(result.calls.slice(apply + 1).some(c => c.tool === 'git' && JSON.stringify(c.args) === '["add","i18n"]'));
});

it('uses Claude Sonnet for both passes and merges into and comments on the open PR even after review failure', () => {
  const result = run({ pr, failReview: true }, ['--translator', 'claude']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(models(result).length, 4);
  assert.ok(models(result).every(c => c.tool === 'claude'));
  for (const call of models(result)) assert.deepEqual(call.args, ['-p', '--model', 'sonnet', '--permission-mode', 'acceptEdits', '--allowedTools', 'Read,Write,Glob,Grep']);
  assert.ok(result.calls.some(c => isCall(c, 'git', 'checkout', pr.headRefName, 'origin/' + pr.headRefName)));
  assert.ok(result.calls.some(c => isCall(c, 'git', 'merge', '--no-edit', 'origin/main')));
  assert.ok(result.calls.some(c => isCall(c, 'gh', 'pr', 'comment', '42', '--body-file', '.translate/pr-body.md')));
  assert.ok(!result.calls.some(c => isCall(c, 'gh', 'create')));
  assert.match(result.stdout, /review de-01 failed or timed out; continuing/);
  assert.match(result.stdout, /https:\/\/example.test\/pr\/42/);
});

it.each(['codex', 'claude'])('retains environment model overrides for %s', translator => {
  const result = run({ counts: [1] }, ['--translator', translator], { TRANSLATE_MODEL: 'env-model', TRANSLATE_REVIEW_MODEL: 'env-review' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(models(result).map(c => c.args[c.args.indexOf(translator === 'codex' ? '-m' : '--model') + 1]), ['env-model', 'env-review']);
});

it.each(gates)('commits before %s and never pushes when it fails', invalid => {
  const result = run({ invalid }, ['--no-review', '--base', 'stack']);
  assert.equal(result.status, 1, result.stderr);
  assert.equal(models(result).length, 2);
  assert.ok(result.calls.findIndex(c => isCall(c, 'git', 'commit')) < result.calls.findIndex(c => isCall(c, 'node', 'scripts/' + invalid)));
  assert.equal(result.calls.find(c => isCall(c, 'node', 'scripts/' + invalid)).base, 'origin/stack');
  assert.ok(!result.calls.some(c => isCall(c, 'git', 'push') || isCall(c, 'gh', 'create') || isCall(c, 'gh', 'comment')));
  assert.ok(result.stdout.includes('validation failed; worktree left at ' + wt));
});

it('aborts a merge conflict and exits before installing or calling a model', () => {
  const result = run({ pr, conflict: true });
  assert.equal(result.status, 1, result.stderr);
  assert.ok(result.calls.some(c => isCall(c, 'git', 'merge', '--abort')));
  assert.match(result.stdout, /merge failed for PR 42/);
  assert.ok(!result.calls.some(c => c.tool === 'pnpm' || isCall(c, 'git', 'push')));
  assert.equal(models(result).length, 0);
});

it.each([
  { ...pr, headRefName: 'main' }, { ...pr, headRefName: 'stack' },
  { ...pr, headRefName: 'manual-translation' }, { ...pr, isCrossRepository: true },
])('ignores an unrelated or fork PR: %j', other => {
  const result = run({ pr: other }, ['--base', 'stack', '--no-review']);
  assert.equal(result.status, 0, result.stderr);
  const list = result.calls.find(c => isCall(c, 'gh', 'pr', 'list'));
  assert.equal(list.args[list.args.indexOf('--json') + 1], 'number,headRefName,url,isCrossRepository');
  const push = result.calls.find(c => isCall(c, 'git', 'push'));
  assert.match(push.args.at(-1), /^docs-translate\/\d{8}-\d{6}$/);
  assert.ok(!result.calls.some(c => isCall(c, 'git', 'merge') || isCall(c, 'gh', 'pr', 'comment')));
  assert.ok(result.calls.some(c => isCall(c, 'gh', 'pr', 'create')));
  assert.match(body(), /review: skipped;/);
});

it('reuses the first own translation PR after unrelated and fork PRs', () => {
  const result = run({ prs: [{ ...pr, number: 40, headRefName: 'manual' }, { ...pr, number: 41, isCrossRepository: true }, pr, { ...pr, number: 43 }] });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.calls.some(c => isCall(c, 'gh', 'pr', 'comment', '42')));
  assert.ok(!result.calls.some(c => isCall(c, 'gh', 'pr', 'create')));
});

it('refuses to push to the base and supports skipping review', () => {
  const result = run({ pr }, ['--base', pr.headRefName, '--no-review']);
  assert.equal(result.status, 1, result.stderr);
  assert.equal(models(result).length, 2);
  assert.ok(!result.calls.some(c => isCall(c, 'git', 'push')));
  assert.match(body(), /review: skipped;/);
});

it.each([{ refresh: ['i18n/de/page.mdx'] }, { record: true }])('publishes zero-unit refresh/state work without a model: %j', config => {
  const result = run({ counts: [], ...config });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(models(result).length, 0);
  assert.ok(result.calls.some(c => isCall(c, 'git', 'push')));
  assert.match(body(), /^Applied 0 units/);
  assert.match(body(), /review: skipped;/);
});

it('skips review without a results file and fails when nothing is accepted', () => {
  const result = run({ noResults: true });
  assert.equal(result.status, 1, result.stderr);
  assert.equal(models(result).length, 2);
  assert.match(result.stdout, /no translations accepted/);
  assert.ok(!result.calls.some(c => isCall(c, 'git', 'commit') || isCall(c, 'git', 'push')));
});

it('kills a hung call and its child process at the timeout', () => {
  const result = run({ counts: [1], hang: true });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /packet fr-01 failed or timed out/);
  assert.match(result.stdout, /no translations accepted/);
  assert.throws(() => process.kill(Number(fs.readFileSync(path.join(root, 'child.pid'))), 0), { code: 'ESRCH' });
});

it('exits safely while another run holds the real lock', () => {
  fs.writeFileSync(path.join(root, 'config.json'), '{}');
  fs.writeFileSync(callsFile, '');
  const locked = spawnSync('/bin/bash', ['-c', 'exec 9>"$1"; /usr/bin/lockf -s -t 0 9; /bin/bash "$2" 9>&-', 'test', path.join(root, '.claude/docs-translate.lock'), copy], { env, encoding: 'utf8', timeout: 20000 });
  assert.ifError(locked.error);
  assert.equal(locked.status, 0, locked.stderr);
  assert.match(locked.stdout, /already running/);
  assert.ok(!readCalls().some(c => isCall(c, 'git', 'reset') || ['codex', 'claude'].includes(c.tool)));
  assert.ok(fs.existsSync(path.join(root, '.claude/docs-translate.lock')));
});
});
