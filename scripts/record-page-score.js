const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const {
  VDOCS, GROUPS, docSource, pageHash, loadScores, saveScores, meanOf, resolveCommit,
  JUDGES, sha256Of, runPath, climbOf, runHeader, firstScoreColumn, runScores,
} = require('./lib/page-scores.js');

function gateEntry(gate, climb, judged = new Date().toISOString().slice(0, 10)) {
  if (typeof climb !== 'string' || !climb) throw new Error('--climb <climb folder> is required');
  if (['revert', 'error', 'frozen'].includes(gate.state)) {
    throw new Error(`Cannot record gate state: ${gate.state}`);
  }
  const judges = Object.keys(gate.scores || {});
  if (!judges.length) throw new Error('Gate scores are empty');
  const categories = [...new Set(judges.flatMap((judge) => Object.keys(gate.scores[judge])))];
  if (!categories.length) throw new Error('Gate scores have no categories');
  const scores = {};
  for (const category of categories) {
    if (judges.some((judge) => !Object.hasOwn(gate.scores[judge], category))) {
      throw new Error(`Category missing from a judge: ${category}`);
    }
    scores[category] = Math.min(...judges.map((judge) => gate.scores[judge][category]));
  }
  return {
    judged, round: gate.round, judges: judges.map((judge) => `opus-${judge}`),
    scores, mean: meanOf(scores), climb,
  };
}

// Checks the judges' transcripts against the gate scores, then copies them, behind a header naming entry `key`, under RUNS_DIR for the gate to recompute.
function bindRun({ root, gate, climb, run, key }, scores) {
  if (climb !== climbOf(key)) throw new Error(`--climb ${climb} is not this page's climb (${climbOf(key)})`);
  if (!run) throw new Error('--run <judge run dir with opus-a.md and opus-b.md> is required');
  const keys = Object.keys(gate.scores);
  if (keys.length !== 2 || !keys.includes('a') || !keys.includes('b')) {
    throw new Error(`gate scores must come from Opus judges a and b, not ${keys.join(', ')}`);
  }
  const files = JUDGES.map((judge) => path.join(run, `${judge}.md`));
  if (!files.every((file) => fs.existsSync(file))) throw new Error(`--run ${run} needs opus-a.md and opus-b.md`);
  const bytes = files.map((file) => fs.readFileSync(file));
  const columnOf = JUDGES.map((judge, i) => {
    const column = firstScoreColumn(bytes[i].toString('utf8'));
    if (!column) throw new Error(`cannot find the page column in ${files[i]}`);
    return column;
  });
  const categories = Object.keys(scores);
  const parsed = runScores(bytes.map(String), columnOf, categories);
  const bad = categories.find((key) => parsed[key] !== scores[key]);
  if (bad !== undefined) throw new Error(`judge files do not match the gate scores: ${bad} ${parsed[bad]} vs ${scores[bad]}`);
  const stored = JUDGES.map((judge, i) => Buffer.concat([Buffer.from(runHeader({ doc: key, climb, round: gate.round, judge }) + '\n'), bytes[i]]));
  const judgeRun = JUDGES.map((judge, i) => ({ judge, path: runPath(climb, gate.round, judge), sha256: sha256Of(stored[i]), column: columnOf[i] }));
  for (const [i, { path: target }] of judgeRun.entries()) {
    const file = path.join(root, target);
    if (fs.existsSync(file) && !fs.readFileSync(file).equals(stored[i])) throw new Error(`${target} already exists with different content`);
  }
  for (const [i, { path: target }] of judgeRun.entries()) {
    fs.mkdirSync(path.dirname(path.join(root, target)), { recursive: true });
    fs.writeFileSync(path.join(root, target), stored[i]);
  }
  return { judges: [...JUDGES], judgeRun };
}

function recordFromGate({ root, doc, gate, climb, judged, commit, run }) {
  if (!commit) throw new Error('--commit <judged commit> is required');
  commit = resolveCommit(root, commit);
  if (!docSource(root, doc, commit)) throw new Error(`No source for doc at ${commit}: ${doc}`);
  const scored = gateEntry(gate, climb, judged);
  const entry = { hash: pageHash(root, doc, commit), ...scored, commit, ...bindRun({ root, gate, climb, run, key: doc }, scored.scores) };
  const entries = loadScores(root);
  entries[doc] = entry;
  saveScores(root, entries);
  return entry;
}

function recordGroup({ root, group, gate, climb, sample, judged, commit, run }) {
  if (!commit) throw new Error('--commit <judged commit> is required');
  commit = resolveCommit(root, commit);
  if (!GROUPS[group]) throw new Error(`Unknown group: ${group}`);
  const entry = { ...gateEntry(gate, climb, judged), commit, group: true, pages: {}, sample };
  if (!sample || !sample.length) throw new Error('Group sample must be non-empty');
  const files = execFileSync('git', ['ls-tree', '-r', '--name-only', commit, '--', `${VDOCS}/${GROUPS[group]}`],
    { cwd: root }).toString().trim().split('\n');
  const docs = new Set(files.filter((file) => /\.mdx?$/.test(file))
    .map((file) => file.slice(VDOCS.length + 1).replace(/\.mdx?$/, '')));
  for (const doc of sample) {
    if (!docs.has(doc)) throw new Error(`Sample doc is not in group ${group}: ${doc}`);
  }
  for (const doc of [...docs].sort()) entry.pages[doc] = pageHash(root, doc, commit);
  Object.assign(entry, bindRun({ root, gate, climb, run, key: group }, entry.scores));
  const entries = loadScores(root);
  entries[group] = entry;
  saveScores(root, entries);
  return entry;
}

function carry({ root, carry: old, doc, commit }) {
  if (!commit) throw new Error('--commit <judged commit> is required');
  commit = resolveCommit(root, commit);
  const entries = loadScores(root);
  if (!entries[old]) throw new Error(`No entry to carry: ${old}`);
  if (!docSource(root, doc, commit)) throw new Error(`No source for doc at ${commit}: ${doc}`);
  if (entries[doc]) throw new Error(`cannot carry onto ${doc}: it already has a score`);
  if (docSource(root, old, commit)) throw new Error(`cannot carry from ${old}: its page still exists at ${commit}`);
  const entry = { ...entries[old], hash: pageHash(root, doc, commit), commit, carriedFrom: old };
  entries[doc] = entry;
  delete entries[old];
  saveScores(root, entries);
  return entry;
}

function prune({ root }) {
  const entries = loadScores(root);
  let removed = 0;
  let pages = 0;
  for (const [doc, entry] of Object.entries(entries)) {
    if (entry.group) {
      for (const page of Object.keys(entry.pages)) {
        if (!docSource(root, page)) { delete entry.pages[page]; pages++; }
      }
    } else if (!docSource(root, doc)) { delete entries[doc]; removed++; }
  }
  console.log(`pruned ${removed} entries, ${pages} group pages`);
  saveScores(root, entries);
}

function seed({ root, seed }) {
  const entries = loadScores(root);
  const summary = { seeded: 0, skipped: 0 };
  for (const [doc, value] of Object.entries(seed)) {
    if (!docSource(root, doc)) {
      console.error(`No source for doc: ${doc}`);
      summary.skipped++;
      continue;
    }
    if (!value.scores || !Object.keys(value.scores).length) {
      console.error(`No scores for doc: ${doc}`);
      summary.skipped++;
      continue;
    }
    entries[doc] = { ...value, hash: pageHash(root, doc), mean: meanOf(value.scores), seeded: true };
    summary.seeded++;
  }
  saveScores(root, entries);
  console.log(`seeded ${summary.seeded}, skipped ${summary.skipped}`);
  return summary;
}

if (require.main === module) {
  try {
    const args = {};
    for (let i = 2; i < process.argv.length; i++) {
      args[process.argv[i].replace(/^--/, '')] = process.argv[i] === '--prune' ? true : process.argv[++i];
    }
    const root = args.root || process.cwd();
    if (args.seed) {
      seed({ root, seed: JSON.parse(fs.readFileSync(args.seed, 'utf8')) });
    } else if (args.prune) {
      prune({ root });
    } else if (args.carry) {
      carry({ root, carry: args.carry, doc: args.doc, commit: args.commit });
    } else {
      if (!args.commit) throw new Error('--commit <judged commit> is required');
      const gate = JSON.parse(fs.readFileSync(args.gate, 'utf8'));
      const options = { root, gate, climb: args.climb, judged: args.judged, commit: args.commit, run: args.run };
      if (args.group) {
        recordGroup({ ...options, group: args.group, sample: args.sample ? args.sample.split(',') : [] });
      } else {
        recordFromGate({ ...options, doc: args.doc });
      }
    }
  } catch (error) {
    console.error(error.message.split('\n')[0]);
    process.exitCode = 1;
  }
}

module.exports = { recordFromGate, recordGroup, seed, carry, prune };
