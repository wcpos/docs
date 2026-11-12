const fs = require('fs');
const path = require('path');
const {
  VDOCS, GROUPS, docSource, pageHash, loadScores, saveScores, meanOf,
} = require('./lib/page-scores');

function gateEntry(gate, climb, judged = new Date().toISOString().slice(0, 10)) {
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

function recordFromGate({ root, doc, gate, climb, judged }) {
  if (!docSource(root, doc)) throw new Error(`No source for doc: ${doc}`);
  const entry = { hash: pageHash(root, doc), ...gateEntry(gate, climb, judged) };
  const entries = loadScores(root);
  entries[doc] = entry;
  saveScores(root, entries);
  return entry;
}

function recordGroup({ root, group, gate, climb, sample, judged }) {
  if (!GROUPS[group]) throw new Error(`Unknown group: ${group}`);
  const entry = { ...gateEntry(gate, climb, judged), group: true, pages: {}, sample };
  if (!sample || !sample.length) throw new Error('Group sample must be non-empty');
  const docs = new Set();
  function walk(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, item.name);
      if (item.isDirectory()) walk(file);
      else if (item.isFile() && /\.mdx?$/.test(item.name)) {
        docs.add(path.relative(path.join(root, VDOCS), file).split(path.sep).join('/').replace(/\.mdx?$/, ''));
      }
    }
  }
  walk(path.join(root, VDOCS, GROUPS[group]));
  for (const doc of sample) {
    if (!docs.has(doc)) throw new Error(`Sample doc is not in group ${group}: ${doc}`);
  }
  for (const doc of [...docs].sort()) entry.pages[doc] = pageHash(root, doc);
  const entries = loadScores(root);
  entries[group] = entry;
  saveScores(root, entries);
  return entry;
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
    for (let i = 2; i < process.argv.length; i += 2) {
      args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
    }
    const root = args.root || process.cwd();
    if (args.seed) {
      seed({ root, seed: JSON.parse(fs.readFileSync(args.seed, 'utf8')) });
    } else {
      if (args.doc && !docSource(root, args.doc)) throw new Error(`No source for doc: ${args.doc}`);
      const gate = JSON.parse(fs.readFileSync(args.gate, 'utf8'));
      const options = { root, gate, climb: args.climb, judged: args.judged };
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

module.exports = { recordFromGate, recordGroup, seed };
