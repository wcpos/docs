import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildGraph } from '../buildGraph';
import { KIND } from '../kinds';

const scannerPage = path.resolve(
  process.cwd(),
  'versioned_docs/version-1.x/hardware/scanners/setup-wizard.mdx',
);

const kindByTag = {
  WizardQuestion: KIND.QUESTION,
  WizardStep: KIND.STEP,
  WizardFix: KIND.FIX,
  WizardTerminal: KIND.TERMINAL,
};

function attrs(source) {
  return Object.fromEntries(
    [...source.matchAll(/([A-Za-z][\w-]*)="([^"]*)"/g)].map((match) => [match[1], match[2]]),
  );
}

function element(kind, props, children = []) {
  const Component = () => null;
  Component.wizardKind = kind;
  return { type: Component, props: { ...props, children } };
}

function authoredGraph() {
  const mdx = readFileSync(scannerPage, 'utf8');
  const nodes = [];
  const choicesByNode = new Map();
  const nodePattern = /<(WizardQuestion|WizardStep|WizardFix|WizardTerminal)\b([^>]*)>/g;

  for (const match of mdx.matchAll(nodePattern)) {
    const [opening, tag, attrSource] = match;
    const props = attrs(attrSource);
    const closeAt = mdx.indexOf(`</${tag}>`, match.index + opening.length);
    if (closeAt === -1) throw new Error(`Missing closing tag for ${props.id || tag}`);
    const body = mdx.slice(match.index + opening.length, closeAt);
    const choices = [...body.matchAll(/<WizardChoice\b([^>]*)\/>/g)].map((choiceMatch) => (
      attrs(choiceMatch[1])
    ));
    choicesByNode.set(props.id, choices);
    nodes.push(element(
      kindByTag[tag],
      props,
      choices.map((choice) => element(KIND.CHOICE, choice)),
    ));
  }

  return { graph: buildGraph(nodes), choicesByNode };
}

function reachableFrom(graph, startId) {
  const adjacency = new Map();
  for (const { from, to } of graph.edges) {
    adjacency.set(from, [...(adjacency.get(from) || []), to]);
  }
  const seen = new Set();
  const pending = [startId];
  while (pending.length) {
    const id = pending.pop();
    if (seen.has(id)) continue;
    seen.add(id);
    pending.push(...(adjacency.get(id) || []));
  }
  return seen;
}

function goTo(choicesByNode, nodeId, value) {
  const choice = choicesByNode.get(nodeId)?.find((candidate) => candidate.value === value);
  if (!choice) throw new Error(`Missing ${nodeId} choice ${value}`);
  return choice.goTo;
}

describe('scanner wizard authored graph', () => {
  it('has an authored scanner page', () => {
    expect(existsSync(scannerPage)).toBe(true);
  });

  it('has no duplicate ids or unresolved goTo targets', () => {
    const { graph } = authoredGraph();
    expect(graph.startId).toBe('start');
    expect(graph.errors).toEqual([]);
  });

  it('keeps Safari/Firefox keyboard setup and iOS away from direct connections', () => {
    const { graph, choicesByNode } = authoredGraph();
    const browser = goTo(choicesByNode, 'platform-setup', 'web');
    const keyboardOnly = goTo(choicesByNode, browser, 'other');
    const webLane = goTo(choicesByNode, keyboardOnly, 'continue');
    const iosLane = goTo(choicesByNode, 'platform-setup', 'ios');

    for (const startId of [webLane, iosLane]) {
      const reachable = reachableFrom(graph, startId);
      expect(reachable.has('conn')).toBe(false);
      expect(reachable.has('connect-app')).toBe(false);
    }
  });

  it('gives every fix node a route to support', () => {
    const { graph } = authoredGraph();
    for (const id of graph.idList.filter((nodeId) => nodeId.startsWith('fix-'))) {
      expect(reachableFrom(graph, id), `${id} cannot reach support`).toContain('support');
    }
  });
});
