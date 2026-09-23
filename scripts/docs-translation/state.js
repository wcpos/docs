const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

const STATE_PATH = 'i18n/translation-state.json';
const COMMENT = 'Written by scripts/docs-translation; do not edit by hand.';

function readState(rootDir) {
  const file = path.join(rootDir, STATE_PATH);
  if (!fs.existsSync(file)) return {};
  const { _comment, ...state } = JSON.parse(fs.readFileSync(file, 'utf8'));
  return state;
}

function serializeState(state) {
  const lines = [`  "_comment": ${JSON.stringify(COMMENT)}`];
  for (const target of Object.keys(state).filter(key => key !== '_comment').sort()) {
    const { source, same, partial } = state[target];
    const value = {};
    if (source !== undefined) value.source = source;
    if (same?.length) value.same = [...same].sort();
    if (partial && Object.keys(partial).length) {
      value.partial = Object.fromEntries(Object.keys(partial).sort().map(key => [key, partial[key]]));
    }
    lines.push(`  ${JSON.stringify(target)}: ${JSON.stringify(value)}`);
  }
  return `{\n${lines.join(',\n')}\n}\n`;
}

function writeState(rootDir, state) {
  const file = path.join(rootDir, STATE_PATH);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, serializeState(state));
}

function unitHash(key) {
  return createHash('sha256').update(key).digest('hex').slice(0, 16);
}

module.exports = { STATE_PATH, readState, serializeState, writeState, unitHash };
