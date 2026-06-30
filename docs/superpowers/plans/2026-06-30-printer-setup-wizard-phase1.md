# Printer Setup Wizard — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the printer-setup-wizard *engine* and *framework* — a prose-free React state machine plus the MDX authoring contract — and ship one complete local-printing reference path end-to-end, so the wizard works and is testable before the long-tail content is filled in.

**Architecture:** All branching *logic* lives in pure, unit-tested modules under `src/components/PrinterWizard/` (`validity`, `buildGraph`, `reducer`, `urlState`, `summary`). All user-visible *prose + images* are authored as translatable MDX on a new versioned doc, `versioned_docs/version-1.x/hardware/printer-setup-wizard.mdx`, which composes prose-free node components (`WizardQuestion`, `WizardChoice`, `WizardStep`, `WizardGate`, `WizardFix`, `WizardInvalid`, `WizardFigure`, `WizardTerminal`). Nodes self-gate on the engine's `currentId` via React context; the engine renders only the active node. Wizard state (currentId + answers) is mirrored to a URL-safe hash token, hydrated after mount (SSR-safe, ConsentBanner pattern).

**Tech Stack:** Docusaurus 3 (React 19), JS (no TS), CSS Modules, Vitest 4 (`globals:true`), the existing MDX→Aide translation pipeline (12 locales).

**Reference docs (read before starting):**
- Design spec: `docs/superpowers/specs/2026-06-30-printer-setup-wizard-design.md` (esp. §5 translation rules, §6 architecture, §7 graph, §10 testing, §11 risks).
- Ecosystem KB: `docs/superpowers/specs/2026-06-30-printer-wizard-ecosystem-kb.md` (content source for FMs + pre-emption).
- Existing patterns to copy: `src/components/ConsentBanner/index.js` (SSR mount-guard, CSS module), `src/components/Steps.js` + `StepCard.js` (prose-free prop/children components), `versioned_docs/version-1.x/hardware/printers.mdx` (MDX composing components, frontmatter).

**Scope (Phase 1 only):** engine + node components + one complete reference path (Step-0 → Desktop → Network → Star → setup → test-print gate → a fix loop → width/crisp gates → success + support terminal) + the `printers.mdx#troubleshooting` reference-anchor update + the vitest config change. **Out of scope (later plans):** Phase 2 cloud branch (4 providers) and Phase 3 consent-gated analytics; and *populating the remaining local branches/FMs*, which is iterative content work that repeats the Task 9 pattern.

---

## Setup (execution-time, before Task 1)

Per the global worktree rule, do all code work in an isolated worktree branched from `origin/main`. Use the `superpowers:using-git-worktrees` skill, or:

```bash
git -C /Users/kilbot/Projects/docs fetch origin
git -C /Users/kilbot/Projects/docs worktree add -b feat/printer-wizard ../docs-printer-wizard origin/main
cd ../docs-printer-wizard
corepack pnpm install --frozen-lockfile
```

All file paths below are relative to the repo root of that worktree.

---

## File structure (created/modified in this plan)

| File | Responsibility |
|------|----------------|
| `vitest.config.js` (modify) | Add `src/**/__tests__` to the test `include` glob. |
| `src/components/PrinterWizard/kinds.js` (create) | The `WizardKind` string constants + `NAV_KINDS` set. No deps. |
| `src/components/PrinterWizard/validity.js` (create) | Pure `validity(vendor, connection, platform, browser)` precedence function. |
| `src/components/PrinterWizard/buildGraph.js` (create) | Pure walk of MDX children → `{ startId, kindById, idList, edges, errors }`. React-free. |
| `src/components/PrinterWizard/reducer.js` (create) | Pure `makeReducer(config)` state machine (SELECT/BACK/RESTART/HYDRATE). |
| `src/components/PrinterWizard/urlState.js` (create) | Pure `encodeState`/`decodeState` ↔ URL-safe hash token. |
| `src/components/PrinterWizard/summary.js` (create) | Pure `summarize(state)` → support-summary plain text. |
| `src/components/PrinterWizard/context.js` (create) | React contexts: `WizardContext` (state/dispatch/graph), `ChoiceScope` (questionId for choices). |
| `src/components/PrinterWizard/nodes.js` (create) | Prose-free node components; each carries a static `.wizardKind`. |
| `src/components/PrinterWizard/index.js` (create) | `<PrinterWizard>`: builds graph, runs reducer, SSR-safe hash hydration, dev validation, progress/controls. |
| `src/components/PrinterWizard/styles.module.css` (create) | Wizard chrome; logical CSS for RTL. |
| `src/components/PrinterWizard/__tests__/*.test.js` (create) | Unit tests for the 5 pure modules + buildGraph. |
| `versioned_docs/version-1.x/hardware/printer-setup-wizard.mdx` (create) | The authored tree (Step-0 + one full path). Sidebar page. |
| `static/img/printer-wizard/*` (create) | Annotated diagnostic images (real screenshots, redacted). |
| `versioned_docs/version-1.x/hardware/printers.mdx` (modify) | Add reference anchors for the new FMs (§12.1). |
| `scripts/check-translation-completeness.js` (modify) | Add multi-word brand labels used in Phase 1 to `UNTRANSLATED_PROP_ALLOWLIST`. |

---

## Task 1: Enable Vitest for `src/`

**Files:**
- Modify: `vitest.config.js`
- Test: `src/components/PrinterWizard/__tests__/smoke.test.js` (temporary)

- [ ] **Step 1: Add a temporary smoke test that proves `src` tests are collected**

Create `src/components/PrinterWizard/__tests__/smoke.test.js`:

```js
import { describe, it, expect } from 'vitest';

describe('src test collection', () => {
  it('runs a test located under src/', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 2: Run it and confirm it is NOT collected yet**

Run: `corepack pnpm test`
Expected: the smoke test does **not** appear in the run (current `include` only globs `**/scripts/__tests__/**`). This proves the gap the spec §10 calls out.

- [ ] **Step 3: Extend the `include` glob**

Edit `vitest.config.js` to:

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: [
      '**/scripts/__tests__/**/*.test.js',
      'src/**/__tests__/**/*.test.js',
    ],
  },
});
```

- [ ] **Step 4: Run again and confirm the smoke test now runs and passes**

Run: `corepack pnpm test`
Expected: the smoke test is collected and PASSES; existing `scripts/__tests__` tests still pass.

- [ ] **Step 5: Delete the smoke test**

```bash
rm src/components/PrinterWizard/__tests__/smoke.test.js
```

- [ ] **Step 6: Commit**

```bash
git add vitest.config.js
git commit -m "test(printer-wizard): collect vitest tests under src/"
```

---

## Task 2: `validity.js` — the precedence-ordered validity matrix

**Files:**
- Create: `src/components/PrinterWizard/validity.js`
- Test: `src/components/PrinterWizard/__tests__/validity.test.js`

Spec reference: §6.5 (precedence rules 1–8). Pure, no deps.

- [ ] **Step 1: Write the failing tests**

Create `src/components/PrinterWizard/__tests__/validity.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { validity } from '../validity';

describe('validity precedence', () => {
  it('iOS + USB is invalid regardless of vendor', () => {
    expect(validity('epson', 'usb', 'ios')).toEqual({ status: 'invalid', reasonKey: 'ios-usb' });
    expect(validity('generic', 'usb', 'ios')).toEqual({ status: 'invalid', reasonKey: 'ios-usb' });
  });

  it('web + network + generic is invalid (no raw TCP)', () => {
    expect(validity('generic', 'network', 'web', 'chrome')).toEqual({ status: 'invalid', reasonKey: 'web-generic-network' });
  });

  it('web + BT/USB on Safari/Firefox is invalid', () => {
    expect(validity('epson', 'usb', 'web', 'safari')).toEqual({ status: 'invalid', reasonKey: 'web-btusb-browser' });
    expect(validity('star', 'bluetooth', 'web', 'firefox')).toEqual({ status: 'invalid', reasonKey: 'web-btusb-browser' });
  });

  it('web + USB + generic in Chrome/Edge is uncertain (WebUSB), not a hard wall', () => {
    expect(validity('generic', 'usb', 'web', 'chrome').status).toBe('uncertain');
    expect(validity('generic', 'usb', 'web', 'edge').status).toBe('uncertain');
  });

  it('web + BT + generic is invalid', () => {
    expect(validity('generic', 'bluetooth', 'web', 'chrome')).toEqual({ status: 'invalid', reasonKey: 'web-generic-bt' });
  });

  it('mobile + BT/USB + generic is invalid', () => {
    expect(validity('generic', 'bluetooth', 'android')).toEqual({ status: 'invalid', reasonKey: 'mobile-generic-btusb' });
    expect(validity('generic', 'usb', 'android')).toEqual({ status: 'invalid', reasonKey: 'mobile-generic-btusb' });
  });

  it('desktop + BT/USB + generic is invalid', () => {
    expect(validity('generic', 'usb', 'desktop')).toEqual({ status: 'invalid', reasonKey: 'desktop-generic-btusb' });
  });

  it('common happy paths are valid', () => {
    expect(validity('star', 'network', 'desktop').status).toBe('valid');
    expect(validity('epson', 'network', 'web', 'chrome').status).toBe('valid');
    expect(validity('star', 'bluetooth', 'ios').status).toBe('valid');
    expect(validity('generic', 'network', 'desktop').status).toBe('valid');
  });

  it('desktop epson/star BT/USB is valid but flagged version-dependent', () => {
    const r = validity('epson', 'usb', 'desktop');
    expect(r.status).toBe('valid');
    expect(r.note).toBe('version-dependent');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `corepack pnpm test src/components/PrinterWizard/__tests__/validity.test.js`
Expected: FAIL — `validity` not exported.

- [ ] **Step 3: Implement `validity.js`**

Create `src/components/PrinterWizard/validity.js`:

```js
// Pure, deterministic printer-combination validity. Precedence: first match wins.
// See design spec §6.5.

export function validity(vendor, connection, platform, browser) {
  // 1. iOS has no general USB peripheral support.
  if (platform === 'ios' && connection === 'usb') {
    return { status: 'invalid', reasonKey: 'ios-usb' };
  }
  // 2. Web BT/USB need a Chromium browser. (USB-Generic exception handled at rule 5.)
  if (platform === 'web' && (connection === 'bluetooth' || connection === 'usb')
      && browser !== 'chrome' && browser !== 'edge') {
    return { status: 'invalid', reasonKey: 'web-btusb-browser' };
  }
  // 3. Browsers can't open raw TCP to a Generic network printer.
  if (platform === 'web' && connection === 'network' && vendor === 'generic') {
    return { status: 'invalid', reasonKey: 'web-generic-network' };
  }
  // 4. Web Bluetooth path supports Epson/Star only.
  if (platform === 'web' && connection === 'bluetooth' && vendor === 'generic') {
    return { status: 'invalid', reasonKey: 'web-generic-bt' };
  }
  // 5. Generic USB via WebUSB in Chrome/Edge: real evidence shows it can work — uncertain, verify.
  if (platform === 'web' && connection === 'usb' && vendor === 'generic'
      && (browser === 'chrome' || browser === 'edge')) {
    return { status: 'uncertain', note: 'webusb-generic' };
  }
  // 6. Mobile BT/USB use Epson/Star native SDKs; Generic is network-only.
  if ((platform === 'ios' || platform === 'android')
      && (connection === 'bluetooth' || connection === 'usb') && vendor === 'generic') {
    return { status: 'invalid', reasonKey: 'mobile-generic-btusb' };
  }
  // 7. Desktop Generic is network-only (raw TCP 9100).
  if (platform === 'desktop' && (connection === 'bluetooth' || connection === 'usb') && vendor === 'generic') {
    return { status: 'invalid', reasonKey: 'desktop-generic-btusb' };
  }
  // 8. Otherwise valid; desktop Epson/Star BT/USB is version-dependent.
  if (platform === 'desktop' && (connection === 'bluetooth' || connection === 'usb')) {
    return { status: 'valid', note: 'version-dependent' };
  }
  return { status: 'valid' };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `corepack pnpm test src/components/PrinterWizard/__tests__/validity.test.js`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/components/PrinterWizard/validity.js src/components/PrinterWizard/__tests__/validity.test.js
git commit -m "feat(printer-wizard): precedence-ordered validity matrix"
```

---

## Task 3: `kinds.js` + `buildGraph.js` — the node registry

**Files:**
- Create: `src/components/PrinterWizard/kinds.js`
- Create: `src/components/PrinterWizard/buildGraph.js`
- Test: `src/components/PrinterWizard/__tests__/buildGraph.test.js`

Spec reference: §6.2 (Contract B), §6.4. `buildGraph` is React-free: it walks a children tree (real React elements *or* plain test objects), recognising nodes by a static `wizardKind` on `child.type`, and returns navigation metadata + authoring-error detection.

- [ ] **Step 1: Create `kinds.js`**

```js
// Static node-kind tags. Components in nodes.js attach these via `.wizardKind`.
export const KIND = {
  QUESTION: 'question',
  CHOICE: 'choice',
  STEP: 'step',
  GATE: 'gate',
  FIX: 'fix',
  INVALID: 'invalid',
  FIGURE: 'figure',
  TERMINAL: 'terminal',
};

// Nodes the engine can navigate to (have an `id` that can be the current node).
export const NAV_KINDS = [KIND.QUESTION, KIND.STEP, KIND.FIX, KIND.INVALID, KIND.TERMINAL];
```

- [ ] **Step 2: Write the failing tests**

Create `src/components/PrinterWizard/__tests__/buildGraph.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { buildGraph } from '../buildGraph';
import { KIND } from '../kinds';

// Helper: fake a node element the way React would shape it.
const node = (kind, props = {}, children = []) => ({
  type: { wizardKind: kind },
  props: { ...props, children },
});
const choice = (value, goTo, label = value) => node(KIND.CHOICE, { value, goTo, label });

describe('buildGraph', () => {
  it('registers navigable nodes by id and records the first as startId', () => {
    const children = [
      node(KIND.QUESTION, { id: 'platform' }, [choice('desktop', 'conn')]),
      node(KIND.STEP, { id: 'conn' }, []),
    ];
    const g = buildGraph(children);
    expect(g.startId).toBe('platform');
    expect(g.idList).toEqual(['platform', 'conn']);
    expect(g.kindById).toEqual({ platform: KIND.QUESTION, conn: KIND.STEP });
    expect(g.errors).toEqual([]);
  });

  it('descends through opaque wrapper elements (themed <p>, fragments) to find nested nodes', () => {
    const children = [
      node(KIND.STEP, { id: 'step1' }, [
        { type: 'p', props: { children: 'some prose' } }, // opaque themed element
        node(KIND.GATE, { id: 'g1' }, [choice('yes', 'done'), choice('no', 'fix1')]),
      ]),
      node(KIND.FIX, { id: 'fix1' }, []),
      node(KIND.TERMINAL, { id: 'done', kind: 'success' }, []),
    ];
    const g = buildGraph(children);
    expect(g.kindById.fix1).toBe(KIND.FIX);
    expect(g.kindById.g1).toBe(KIND.GATE);
    // edges collected from every choice's goTo
    expect(g.edges).toEqual(
      expect.arrayContaining([
        { from: 'platform-or-unknown', to: 'done' },
      ].map(() => expect.objectContaining({ to: 'done' }))),
    );
  });

  it('flags duplicate navigable ids', () => {
    const children = [node(KIND.STEP, { id: 'dup' }), node(KIND.FIX, { id: 'dup' })];
    const g = buildGraph(children);
    expect(g.errors).toContainEqual({ type: 'duplicate-id', id: 'dup' });
  });

  it('flags a choice whose goTo points at a missing node', () => {
    const children = [
      node(KIND.QUESTION, { id: 'q' }, [choice('a', 'nowhere')]),
    ];
    const g = buildGraph(children);
    expect(g.errors).toContainEqual({ type: 'missing-target', from: 'q', to: 'nowhere' });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `corepack pnpm test src/components/PrinterWizard/__tests__/buildGraph.test.js`
Expected: FAIL — `buildGraph` not exported.

- [ ] **Step 4: Implement `buildGraph.js`**

```js
import { KIND, NAV_KINDS } from './kinds';

// Normalise React children (single, nested arrays, falsy) into a flat array.
function flatten(children, out = []) {
  if (children == null || children === false || children === true) return out;
  if (Array.isArray(children)) {
    for (const c of children) flatten(c, out);
    return out;
  }
  out.push(children);
  return out;
}

function kindOf(el) {
  return el && typeof el === 'object' && el.type && typeof el.type === 'object'
    ? el.type.wizardKind
    : undefined;
}

// Walk the tree: register navigable nodes by id, collect choice edges, descend through
// everything else (opaque themed elements, fragments, gates) to find nested nodes.
function walk(children, ctx) {
  for (const el of flatten(children)) {
    if (!el || typeof el !== 'object') continue;
    const kind = kindOf(el);
    const id = el.props && el.props.id;

    if (kind && NAV_KINDS.includes(kind)) {
      if (id != null) {
        if (ctx.kindById[id] !== undefined) ctx.errors.push({ type: 'duplicate-id', id });
        else { ctx.kindById[id] = kind; ctx.idList.push(id); if (ctx.startId == null) ctx.startId = id; }
      }
      ctx.currentNavId = id; // for edge attribution
    }
    if (kind === KIND.GATE && id != null) {
      ctx.kindById[id] = kind; // gates are recorded but not navigable
    }
    if (kind === KIND.CHOICE && el.props && el.props.goTo) {
      ctx.edges.push({ from: ctx.currentNavId, to: el.props.goTo });
    }
    // Recurse into children regardless of kind (descend through opaque wrappers/fragments).
    if (el.props && el.props.children != null) {
      walk(el.props.children, ctx);
    }
  }
}

export function buildGraph(children) {
  const ctx = { startId: null, kindById: {}, idList: [], edges: [], errors: [], currentNavId: null };
  walk(children, ctx);
  // Validate every edge target exists as a navigable node.
  for (const e of ctx.edges) {
    if (!ctx.idList.includes(e.to)) ctx.errors.push({ type: 'missing-target', from: e.from, to: e.to });
  }
  return { startId: ctx.startId, kindById: ctx.kindById, idList: ctx.idList, edges: ctx.edges, errors: ctx.errors };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `corepack pnpm test src/components/PrinterWizard/__tests__/buildGraph.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/PrinterWizard/kinds.js src/components/PrinterWizard/buildGraph.js src/components/PrinterWizard/__tests__/buildGraph.test.js
git commit -m "feat(printer-wizard): node-kind tags and graph builder"
```

---

## Task 4: `reducer.js` — the state machine with global escalation

**Files:**
- Create: `src/components/PrinterWizard/reducer.js`
- Test: `src/components/PrinterWizard/__tests__/reducer.test.js`

Spec reference: §6.4. `makeReducer(config)` returns a pure reducer. Escalation is a **global** fix-cycle budget (not per-gate), so multi-gate loops still terminate.

- [ ] **Step 1: Write the failing tests**

Create `src/components/PrinterWizard/__tests__/reducer.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { makeReducer, initialState } from '../reducer';
import { KIND } from '../kinds';

const config = {
  startId: 'q1',
  supportId: 'support',
  maxFixCycles: 3,
  kindById: {
    q1: KIND.QUESTION, step: KIND.STEP, fix1: KIND.FIX, fix2: KIND.FIX, fix3: KIND.FIX,
    support: KIND.TERMINAL,
  },
};
const reducer = makeReducer(config);

const select = (questionId, value, goTo) => ({ type: 'SELECT', questionId, value, goTo });

describe('reducer', () => {
  it('initial state starts at startId', () => {
    expect(initialState(config)).toEqual({ currentId: 'q1', answers: {}, history: [], fixCycles: 0 });
  });

  it('SELECT records the answer, advances, and pushes history', () => {
    const s = reducer(initialState(config), select('q1', 'desktop', 'step'));
    expect(s.currentId).toBe('step');
    expect(s.answers).toEqual({ q1: 'desktop' });
    expect(s.history).toEqual(['q1']);
  });

  it('entering a fix increments fixCycles', () => {
    let s = reducer(initialState(config), select('g', 'no', 'fix1'));
    expect(s.fixCycles).toBe(1);
    expect(s.currentId).toBe('fix1');
  });

  it('escalates to support after the budget across DIFFERENT gates/fixes', () => {
    let s = initialState(config);
    s = reducer(s, select('g', 'no', 'fix1')); // cycle 1
    s = reducer(s, select('g', 'no', 'fix2')); // cycle 2
    s = reducer(s, select('g', 'no', 'fix3')); // cycle 3 -> budget reached, redirect
    expect(s.currentId).toBe('support');
  });

  it('BACK pops history, restores currentId, clears that answer, and decrements fixCycles when leaving a fix', () => {
    let s = initialState(config);
    s = reducer(s, select('q1', 'desktop', 'step'));      // q1 -> step
    s = reducer(s, select('step', 'bad', 'fix1'));        // step -> fix1 (fixCycles 1)
    expect(s.fixCycles).toBe(1);
    s = reducer(s, { type: 'BACK' });                      // back to step
    expect(s.currentId).toBe('step');
    expect(s.fixCycles).toBe(0);
    expect(s.answers.step).toBeUndefined();                // answer cleared so showWhen recomputes
  });

  it('RESTART resets to the start node', () => {
    let s = reducer(initialState(config), select('q1', 'desktop', 'step'));
    s = reducer(s, { type: 'RESTART' });
    expect(s).toEqual({ currentId: 'q1', answers: {}, history: [], fixCycles: 0 });
  });

  it('HYDRATE sets currentId + answers from a payload', () => {
    const s = reducer(initialState(config), { type: 'HYDRATE', payload: { currentId: 'step', answers: { q1: 'web' } } });
    expect(s).toEqual({ currentId: 'step', answers: { q1: 'web' }, history: [], fixCycles: 0 });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `corepack pnpm test src/components/PrinterWizard/__tests__/reducer.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `reducer.js`**

```js
import { KIND } from './kinds';

export function initialState(config) {
  return { currentId: config.startId, answers: {}, history: [], fixCycles: 0 };
}

export function makeReducer(config) {
  const { kindById, supportId, maxFixCycles = 3 } = config;

  return function reducer(state, action) {
    switch (action.type) {
      case 'SELECT': {
        const { questionId, value, goTo } = action;
        const answers = questionId != null ? { ...state.answers, [questionId]: value } : state.answers;
        const history = [...state.history, state.currentId];
        let fixCycles = state.fixCycles;
        if (kindById[goTo] === KIND.FIX) fixCycles += 1;
        // Global escalation budget: once exceeded, force the support terminal.
        if (fixCycles > maxFixCycles && supportId) {
          return { currentId: supportId, answers, history, fixCycles };
        }
        return { currentId: goTo, answers, history, fixCycles };
      }
      case 'BACK': {
        if (state.history.length === 0) return state;
        const history = state.history.slice(0, -1);
        const prevId = state.history[state.history.length - 1];
        const answers = { ...state.answers };
        delete answers[state.currentId]; // clear the answer recorded at the node we are leaving
        const fixCycles = kindById[state.currentId] === KIND.FIX
          ? Math.max(0, state.fixCycles - 1)
          : state.fixCycles;
        return { currentId: prevId, answers, history, fixCycles };
      }
      case 'RESTART':
        return initialState(config);
      case 'HYDRATE':
        return { currentId: action.payload.currentId, answers: { ...action.payload.answers }, history: [], fixCycles: 0 };
      default:
        return state;
    }
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `corepack pnpm test src/components/PrinterWizard/__tests__/reducer.test.js`
Expected: PASS.

> Note: the budget triggers on the 4th fix entry (`fixCycles > maxFixCycles`). The test reaches `support` on the 3rd because the spec's intent is "after a few fixes"; adjust `maxFixCycles` to taste. If you want escalation exactly on the 3rd, set `maxFixCycles: 2`. Update the test and config together to keep them consistent.

- [ ] **Step 5: Reconcile the budget constant with the test**

Set `maxFixCycles: 2` in the test `config` so "3rd fix → support" holds, OR change the assertion to a 4th fix. Pick one and make test + default agree. Re-run Step 4.

- [ ] **Step 6: Commit**

```bash
git add src/components/PrinterWizard/reducer.js src/components/PrinterWizard/__tests__/reducer.test.js
git commit -m "feat(printer-wizard): reducer with global fix-cycle escalation"
```

---

## Task 5: `urlState.js` — SSR-safe, URL-safe hash token

**Files:**
- Create: `src/components/PrinterWizard/urlState.js`
- Test: `src/components/PrinterWizard/__tests__/urlState.test.js`

Spec reference: §6.6. Compact, URL-safe, opaque-ish token; no `window` access (pure string functions).

- [ ] **Step 1: Write the failing tests**

```js
import { describe, it, expect } from 'vitest';
import { encodeState, decodeState } from '../urlState';

describe('urlState', () => {
  it('round-trips currentId + answers', () => {
    const st = { currentId: 'web-network-star', answers: { platform: 'web', connection: 'network', vendor: 'star', scheme: 'https' } };
    const token = encodeState(st);
    expect(typeof token).toBe('string');
    expect(token).not.toMatch(/[ &=#]/); // URL-safe: no raw separators that break the locale switcher
    expect(decodeState(token)).toEqual(st);
  });

  it('returns null for garbage / empty', () => {
    expect(decodeState('')).toBeNull();
    expect(decodeState('%%%not-valid')).toBeNull();
  });

  it('tolerates a leading # and the wiz= prefix being stripped by the caller', () => {
    const token = encodeState({ currentId: 'start', answers: {} });
    expect(decodeState(token)).toEqual({ currentId: 'start', answers: {} });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `corepack pnpm test src/components/PrinterWizard/__tests__/urlState.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement `urlState.js`**

```js
// Compact, URL-safe encoding of {currentId, answers}. Values are short slugs
// (web, network, star, https…), so '~' and '.' are safe separators.
// Final encodeURIComponent guards against any stray characters.

export function encodeState(state) {
  const parts = [`n.${state.currentId}`];
  for (const [k, v] of Object.entries(state.answers || {})) {
    parts.push(`${k}.${v}`);
  }
  return encodeURIComponent(parts.join('~'));
}

export function decodeState(token) {
  if (!token) return null;
  let raw;
  try {
    raw = decodeURIComponent(token);
  } catch {
    return null;
  }
  const parts = raw.split('~').filter(Boolean);
  if (parts.length === 0) return null;
  let currentId = null;
  const answers = {};
  for (const p of parts) {
    const dot = p.indexOf('.');
    if (dot === -1) return null;
    const key = p.slice(0, dot);
    const val = p.slice(dot + 1);
    if (key === 'n') currentId = val;
    else answers[key] = val;
  }
  if (currentId == null) return null;
  return { currentId, answers };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `corepack pnpm test src/components/PrinterWizard/__tests__/urlState.test.js`
Expected: PASS.

> Note: `%%%not-valid` decodes via `decodeURIComponent` throwing → returns null. Confirm the "garbage" assertion passes; if `decodeURIComponent` does not throw on a given input, the `dot === -1` guard returns null instead.

- [ ] **Step 5: Commit**

```bash
git add src/components/PrinterWizard/urlState.js src/components/PrinterWizard/__tests__/urlState.test.js
git commit -m "feat(printer-wizard): URL-safe hash state encoding"
```

---

## Task 6: `summary.js` — the support-summary text

**Files:**
- Create: `src/components/PrinterWizard/summary.js`
- Test: `src/components/PrinterWizard/__tests__/summary.test.js`

Spec reference: §6.7. Pure: turns the collected answers into the plain-text report a user pastes into support.

- [ ] **Step 1: Write the failing tests**

```js
import { describe, it, expect } from 'vitest';
import { summarize } from '../summary';

describe('summarize', () => {
  it('renders the collected fields as labelled lines', () => {
    const text = summarize({
      currentId: 'support',
      answers: {
        platform: 'web', browser: 'chrome', scheme: 'https', version: '1.9.6',
        connection: 'network', vendor: 'star', model: 'MCP31LB',
        ip: '192.168.0.25', port: '443', width: '80mm', symptom: 'sent-success-nothing-prints',
        selftestCert: 'none', selftest9100: 'enabled', selftestDhcp: 'on',
      },
    });
    expect(text).toContain('Platform: web');
    expect(text).toContain('Version: 1.9.6');
    expect(text).toContain('Connection: network');
    expect(text).toContain('Vendor: star');
    expect(text).toContain('Self-test: cert=none, tcp9100=enabled, dhcp=on');
    expect(text).toContain('Stuck at: support');
  });

  it('omits fields that were never answered', () => {
    const text = summarize({ currentId: 'support', answers: { platform: 'desktop' } });
    expect(text).toContain('Platform: desktop');
    expect(text).not.toContain('Vendor:');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `corepack pnpm test src/components/PrinterWizard/__tests__/summary.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement `summary.js`**

```js
// Pure: build the copy-paste support summary from collected answers.
// Keep labels stable (support triage greps these).

const LINES = [
  ['Platform', (a) => a.platform],
  ['Browser', (a) => a.browser],
  ['App/plugin version', (a) => a.version],
  ['POS scheme', (a) => a.scheme],
  ['Connection', (a) => a.connection],
  ['Vendor', (a) => a.vendor],
  ['Model', (a) => a.model],
  ['IP/port', (a) => (a.ip ? `${a.ip}${a.port ? ':' + a.port : ''}` : undefined)],
  ['Paper width', (a) => a.width],
  ['Symptom', (a) => a.symptom],
];

export function summarize(state) {
  const a = state.answers || {};
  const out = ['WCPOS printer setup — support summary', '----------------------------------------'];
  for (const [label, get] of LINES) {
    const v = get(a);
    if (v != null && v !== '') out.push(`${label}: ${v}`);
  }
  if (a.selftestCert || a.selftest9100 || a.selftestDhcp) {
    out.push(`Self-test: cert=${a.selftestCert || '?'}, tcp9100=${a.selftest9100 || '?'}, dhcp=${a.selftestDhcp || '?'}`);
  }
  out.push(`Stuck at: ${state.currentId}`);
  return out.join('\n');
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `corepack pnpm test src/components/PrinterWizard/__tests__/summary.test.js`
Expected: PASS.

> Note: the test's "Platform: web" matches the label `Platform`. Keep the test labels and the `LINES` labels identical — if you rename a label, update both.

- [ ] **Step 5: Commit**

```bash
git add src/components/PrinterWizard/summary.js src/components/PrinterWizard/__tests__/summary.test.js
git commit -m "feat(printer-wizard): support-summary text builder"
```

---

## Task 7: React context + node components (`context.js`, `nodes.js`)

**Files:**
- Create: `src/components/PrinterWizard/context.js`
- Create: `src/components/PrinterWizard/nodes.js`

Prose-free node components. Each self-gates on the engine's `currentId` and carries a static `.wizardKind`. Visible text comes only from `TEXT_PROPS`-named props (`title`, `label`, `question`, `summary`, `description`, `alt`) or `children`. No tests here (covered by the build + manual run); these render UI.

- [ ] **Step 1: Create `context.js`**

```js
import React from 'react';

// Engine-wide state/dispatch/graph.
export const WizardContext = React.createContext(null);
// The id of the nearest Question/Gate, so a Choice knows which answer it sets.
export const ChoiceScope = React.createContext({ questionId: null });

export function useWizard() {
  const ctx = React.useContext(WizardContext);
  if (!ctx) throw new Error('Wizard node rendered outside <PrinterWizard>');
  return ctx;
}
```

- [ ] **Step 2: Create `nodes.js`**

```js
import React from 'react';
import { KIND } from './kinds';
import { WizardContext, ChoiceScope, useWizard } from './context';
import styles from './styles.module.css';

// Only render when this node is the active one.
function useActive(id) {
  const { state } = useWizard();
  return state.currentId === id;
}

export function WizardQuestion({ id, title, children }) {
  if (!useActive(id)) return null;
  return (
    <section className={styles.node} aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`} className={styles.prompt}>{title}</h3>
      <ChoiceScope.Provider value={{ questionId: id }}>
        <div className={styles.choices}>{children}</div>
      </ChoiceScope.Provider>
    </section>
  );
}
WizardQuestion.wizardKind = KIND.QUESTION;

export function WizardChoice({ value, goTo, label }) {
  const { dispatch } = useWizard();
  const { questionId } = React.useContext(ChoiceScope);
  return (
    <button
      type="button"
      className={styles.choice}
      onClick={() => dispatch({ type: 'SELECT', questionId, value, goTo })}
    >
      {label}
    </button>
  );
}
WizardChoice.wizardKind = KIND.CHOICE;

export function WizardStep({ id, title, children }) {
  if (!useActive(id)) return null;
  return (
    <section className={styles.node}>
      {title ? <h3 className={styles.prompt}>{title}</h3> : null}
      <div className={styles.body}>{children}</div>
    </section>
  );
}
WizardStep.wizardKind = KIND.STEP;

export function WizardGate({ id, question, children }) {
  // Gates render inside their parent Step (which is already active-gated).
  return (
    <div className={styles.gate}>
      <p className={styles.gateQuestion}>{question}</p>
      <ChoiceScope.Provider value={{ questionId: id }}>
        <div className={styles.choices}>{children}</div>
      </ChoiceScope.Provider>
    </div>
  );
}
WizardGate.wizardKind = KIND.GATE;

export function WizardFix({ id, title, children }) {
  if (!useActive(id)) return null;
  return (
    <section className={`${styles.node} ${styles.fix}`}>
      {title ? <h3 className={styles.prompt}>{title}</h3> : null}
      <div className={styles.body}>{children}</div>
    </section>
  );
}
WizardFix.wizardKind = KIND.FIX;

export function WizardInvalid({ id, title, children }) {
  if (!useActive(id)) return null;
  return (
    <section className={`${styles.node} ${styles.invalid}`} role="note">
      {title ? <h3 className={styles.prompt}>{title}</h3> : null}
      <div className={styles.body}>{children}</div>
    </section>
  );
}
WizardInvalid.wizardKind = KIND.INVALID;

export function WizardFigure({ src, alt, summary }) {
  return (
    <figure className={styles.figure}>
      <img src={src} alt={alt} loading="lazy" />
      {summary ? <figcaption className={styles.caption}>{summary}</figcaption> : null}
    </figure>
  );
}
WizardFigure.wizardKind = KIND.FIGURE;

export function WizardTerminal({ id, kind, children }) {
  const { state, summarize } = useWizard();
  if (!useActive(id)) return null;
  return (
    <section className={`${styles.node} ${styles.terminal} ${kind === 'support' ? styles.support : styles.success}`}>
      <div className={styles.body}>{children}</div>
      {kind === 'support' ? <SupportSummary summarize={summarize} state={state} /> : null}
    </section>
  );
}
WizardTerminal.wizardKind = KIND.TERMINAL;

function SupportSummary({ summarize, state }) {
  const text = summarize(state);
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => setCopied(true)).catch(() => {});
    }
  };
  return (
    <div className={styles.summary}>
      <pre className={styles.summaryText}>{text}</pre>
      <button type="button" className={styles.copyBtn} onClick={copy}>
        {copied ? 'Copied' : 'Copy support summary'}
      </button>
    </div>
  );
}
```

> Translation note: the literal UI strings here ("Copy support summary", "Copied") are component chrome, not wizard guidance — they are few and may be left English in Phase 1, or wired through the existing `code.json` later. Do NOT put wizard *guidance* prose in this file. All guidance lives in the MDX.

- [ ] **Step 3: Create a minimal `styles.module.css` so imports resolve**

```css
.node { margin: 1.5rem 0; }
.prompt { margin: 0 0 0.75rem; }
.choices { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.choice { padding: 0.5rem 1rem; border: 1px solid var(--ifm-color-emphasis-300); border-radius: 8px; background: var(--ifm-background-surface-color); cursor: pointer; }
.choice:hover { border-color: var(--ifm-color-primary); }
.body { margin-block-start: 0.5rem; }
.gate { margin-block-start: 1rem; padding-block-start: 0.75rem; border-block-start: 1px solid var(--ifm-color-emphasis-200); }
.gateQuestion { font-weight: 600; }
.fix { border-inline-start: 3px solid var(--ifm-color-warning); padding-inline-start: 1rem; }
.invalid { border-inline-start: 3px solid var(--ifm-color-danger); padding-inline-start: 1rem; }
.figure { margin: 1rem 0; }
.figure img { max-width: 100%; border: 1px solid var(--ifm-color-emphasis-200); border-radius: 6px; }
.caption { font-size: 0.85em; color: var(--ifm-color-emphasis-700); }
.terminal { padding: 1rem; border-radius: 8px; }
.success { background: var(--ifm-color-success-contrast-background); }
.support { background: var(--ifm-color-warning-contrast-background); }
.summary { margin-block-start: 1rem; }
.summaryText { white-space: pre-wrap; padding: 0.75rem; background: var(--ifm-color-emphasis-100); border-radius: 6px; }
.copyBtn { margin-block-start: 0.5rem; padding: 0.4rem 0.9rem; cursor: pointer; }
.controls { display: flex; gap: 0.5rem; margin-block-start: 1.5rem; }
```

- [ ] **Step 4: Commit**

```bash
git add src/components/PrinterWizard/context.js src/components/PrinterWizard/nodes.js src/components/PrinterWizard/styles.module.css
git commit -m "feat(printer-wizard): context + prose-free node components"
```

---

## Task 8: `<PrinterWizard>` — the engine shell

**Files:**
- Create: `src/components/PrinterWizard/index.js`

Spec reference: §6.2, §6.6. Builds the graph once (`useMemo`), runs the reducer, hydrates from the hash after mount (SSR-safe), writes state back to the hash, renders the active node (all children are mounted; nodes self-gate), and surfaces Back/Restart controls + a dev-only graph-error warning.

- [ ] **Step 1: Implement `index.js`**

```js
import React from 'react';
import { buildGraph } from './buildGraph';
import { makeReducer, initialState } from './reducer';
import { encodeState, decodeState } from './urlState';
import { summarize } from './summary';
import { KIND } from './kinds';
import { WizardContext } from './context';
import styles from './styles.module.css';

const HASH_PREFIX = '#wiz=';

export default function PrinterWizard({ children, supportId = 'support', maxFixCycles = 2 }) {
  // Build the navigation graph from the authored MDX children, once.
  const childArray = React.useMemo(() => React.Children.toArray(children), [children]);
  const graph = React.useMemo(() => buildGraph(childArray), [childArray]);

  const config = React.useMemo(
    () => ({ startId: graph.startId, kindById: graph.kindById, supportId, maxFixCycles }),
    [graph, supportId, maxFixCycles],
  );
  const reducer = React.useMemo(() => makeReducer(config), [config]);

  // SSR-safe: server + first paint render the start node. Never read location here.
  const [state, dispatch] = React.useReducer(reducer, config, initialState);

  // Dev-only: surface authoring errors (duplicate ids, dangling goTo).
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && graph.errors.length) {
      // eslint-disable-next-line no-console
      console.warn('[PrinterWizard] graph errors:', graph.errors);
    }
  }, [graph]);

  // Hydrate from the hash after mount (client only).
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = window.location.hash || '';
    if (h.startsWith(HASH_PREFIX)) {
      const decoded = decodeState(h.slice(HASH_PREFIX.length));
      if (decoded && graph.kindById[decoded.currentId]) {
        dispatch({ type: 'HYDRATE', payload: decoded });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write state back to the hash (replaceState — don't pollute history per click).
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = encodeState({ currentId: state.currentId, answers: state.answers });
    window.history.replaceState(null, '', `${HASH_PREFIX}${token}`);
  }, [state]);

  const ctx = React.useMemo(() => ({ state, dispatch, graph, summarize }), [state, graph]);

  return (
    <WizardContext.Provider value={ctx}>
      <div className={styles.wizard}>
        {children}
        <div className={styles.controls}>
          <button type="button" onClick={() => dispatch({ type: 'BACK' })} disabled={state.history.length === 0}>Back</button>
          <button type="button" onClick={() => dispatch({ type: 'RESTART' })}>Start over</button>
        </div>
      </div>
    </WizardContext.Provider>
  );
}
```

> Note: `React.Children.toArray` adds keys and flattens fragments, so `buildGraph` sees real elements with `.type.wizardKind`. `maxFixCycles` default here must match the reducer test's `config` (Task 4 Step 5) — keep them equal.

- [ ] **Step 2: Type-check by importing into a scratch MDX and starting the dev server**

Create a throwaway `versioned_docs/version-1.x/hardware/_scratch.mdx` (leading underscore — not a sidebar doc):

```mdx
import PrinterWizard from '@site/src/components/PrinterWizard';
import { WizardQuestion, WizardChoice, WizardTerminal } from '@site/src/components/PrinterWizard/nodes';

<PrinterWizard>
  <WizardQuestion id="q1" title="Pick one">
    <WizardChoice value="a" label="Go to success" goTo="done" />
  </WizardQuestion>
  <WizardTerminal id="done" kind="success">Done.</WizardTerminal>
</PrinterWizard>
```

Run: `corepack pnpm start` and open the scratch page.
Expected: the question renders; clicking "Go to success" shows "Done."; Back/Start over work; the URL hash updates; no console errors.

- [ ] **Step 3: Delete the scratch file**

```bash
rm versioned_docs/version-1.x/hardware/_scratch.mdx
```

- [ ] **Step 4: Commit**

```bash
git add src/components/PrinterWizard/index.js
git commit -m "feat(printer-wizard): engine shell with SSR-safe hash hydration"
```

---

## Task 9: Author the reference path MDX page

**Files:**
- Create: `versioned_docs/version-1.x/hardware/printer-setup-wizard.mdx`

Spec reference: §5 (i18n rules), §6.2 (authoring shape), §7. This authors Step-0 + the Desktop→Network→Star happy path with a test-print gate, one fix loop, width + crisp gates, a success terminal, and the support terminal. Every visible string is `children` prose or a `TEXT_PROPS` prop, **double-quoted**, **no `caption=`** (use `summary=`).

- [ ] **Step 1: Create the page with frontmatter + imports + the tree**

```mdx
---
title: Printer Setup Wizard
sidebar_label: Setup Wizard
sidebar_position: 0
description: "Answer a few questions and we'll walk you through connecting your receipt printer step by step — and help you fix it if the test print doesn't work."
---

import PrinterWizard from '@site/src/components/PrinterWizard';
import { WizardQuestion, WizardChoice, WizardStep, WizardGate, WizardFix, WizardInvalid, WizardFigure, WizardTerminal } from '@site/src/components/PrinterWizard/nodes';

Not sure how to connect your printer? Answer a few questions and we'll guide you. For full reference, see [Printer Setup](/hardware/printers).

<PrinterWizard>

  <WizardQuestion id="platform" title="Which app are you using WCPOS in?">
    <WizardChoice value="desktop" label="Desktop app (Windows or Mac)" goTo="connection" />
    <WizardChoice value="web" label="Web browser" goTo="connection" />
    <WizardChoice value="ios" label="iPhone or iPad" goTo="connection" />
    <WizardChoice value="android" label="Android" goTo="connection" />
  </WizardQuestion>

  <WizardQuestion id="connection" title="How does the printer connect?">
    <WizardChoice value="network" label="Network / Wi-Fi (it has an IP address)" goTo="vendor" />
    <WizardChoice value="bluetooth" label="Bluetooth" goTo="vendor" />
    <WizardChoice value="usb" label="USB cable" goTo="vendor" />
  </WizardQuestion>

  <WizardQuestion id="vendor" title="What brand is the printer?">
    <WizardChoice value="star" label="Star" goTo="star-network-setup" />
    <WizardChoice value="epson" label="Epson" goTo="star-network-setup" />
    <WizardChoice value="generic" label="Generic / other ESC/POS" goTo="star-network-setup" />
  </WizardQuestion>

  <WizardStep id="star-network-setup" title="Connect a network printer">
Go to **POS &gt; Settings &gt; Printing &gt; Add Printer**. Enter the printer's **IP address** — print a self-test to find it (hold the FEED button while powering the printer on).

We strongly recommend giving the printer a **fixed address** (a DHCP reservation on your router) so it doesn't change and break printing later.

<WizardFigure src="/img/printer-wizard/star-selftest.png" alt="Star self-test printout with the IP address and TCP port section highlighted" summary="The self-test shows the printer's current IP address and which ports are open." />

    <WizardGate id="g-testprint" question="Click Save — did the test print come out?">
      <WizardChoice value="yes" label="Yes, it printed" goTo="g-width" />
      <WizardChoice value="no" label="No, nothing printed or it errored" goTo="fix-not-printing" />
    </WizardGate>
  </WizardStep>

  <WizardFix id="fix-not-printing" title="When the test print doesn't come out">
First, the quick checks: is there paper, is the cover closed, and is the paper loaded the right way? Thermal paper only prints on one side — if it's in upside-down the printer feeds blank. Do the scratch test: scratch the paper with a fingernail; the side that marks is the side that must face the print head.

Then confirm the printer is reachable: open `http://<printer-ip>/` in a web browser. If you see the printer's own page, it's on the network and the problem is in the settings; if you don't, it's a network/IP problem (wrong address, or the printer isn't connected).

    <WizardGate id="g-retry-1" question="Try the test print again — did it work now?">
      <WizardChoice value="yes" label="Yes, fixed" goTo="g-width" />
      <WizardChoice value="no" label="Still not printing" goTo="support" />
    </WizardGate>
  </WizardFix>

  <WizardStep id="g-width" title="Check the width">
Look at the test print. There's a numbered **column ruler** across the top.

<WizardFigure src="/img/printer-wizard/column-ruler.png" alt="Receipt test print showing a numbered column ruler that ends flush with the right edge" summary="The ruler should reach the right edge without wrapping to a second line." />

    <WizardGate id="g-width-gate" question="Does the ruler end flush with the right edge, without wrapping?">
      <WizardChoice value="yes" label="Yes, it lines up" goTo="g-crisp" />
      <WizardChoice value="no" label="No, it wraps or is cut off" goTo="fix-width" />
    </WizardGate>
  </WizardStep>

  <WizardFix id="fix-width" title="Fix the paper width">
The **Printer text width** setting doesn't match your paper. In **Advanced Settings**, set it to match: **58mm = 32 characters**, **80mm = 42**, or **80mm wide = 48**. Most 80mm printers are 42.

    <WizardGate id="g-retry-width" question="Re-print and check the ruler — does it line up now?">
      <WizardChoice value="yes" label="Yes" goTo="g-crisp" />
      <WizardChoice value="no" label="Still wrong" goTo="support" />
    </WizardGate>
  </WizardStep>

  <WizardStep id="g-crisp" title="Check the print quality">
Look at the text quality on the receipt.

<WizardFigure src="/img/printer-wizard/crisp-vs-blurry.png" alt="Two receipts side by side: crisp ESC/POS text on the left, soft blurry print-dialog text on the right" summary="Crisp, sharp text (left) means ESC/POS is working. Soft, photocopy-like text (right) means it's printing through the system print dialog." />

    <WizardGate id="g-crisp-gate" question="Is the text crisp and sharp?">
      <WizardChoice value="yes" label="Yes, it's clear" goTo="done" />
      <WizardChoice value="no" label="No, it's blurry / faint" goTo="fix-crisp" />
    </WizardGate>
  </WizardStep>

  <WizardFix id="fix-crisp" title="Blurry text means the wrong print path">
Soft, photocopy-like text means the receipt is going through the **system print dialog** instead of being sent as **ESC/POS** commands. Route the thermal receipt template to your thermal printer profile (not the system dialog) under **POS &gt; Settings &gt; Printing &gt; Receipt templates**.

    <WizardGate id="g-retry-crisp" question="Re-print — is it crisp now?">
      <WizardChoice value="yes" label="Yes" goTo="done" />
      <WizardChoice value="no" label="Still blurry" goTo="support" />
    </WizardGate>
  </WizardStep>

  <WizardTerminal id="done" kind="success" title="You're set up!">
Your printer is connected and printing correctly. To make sure the address never changes, give it a **DHCP reservation** on your router. If you use more than one template, see [print routing](/hardware/printers#print-routing).
  </WizardTerminal>

  <WizardTerminal id="support" kind="support" title="Let's get you help">
We couldn't get it working from here. Copy the summary below and send it to support — it tells us exactly what you've already tried, so we can help fast.
  </WizardTerminal>

</PrinterWizard>
```

> Authoring rules enforced here: every visible string is `children` or a double-quoted `TEXT_PROPS` prop (`title`, `label`, `question`, `alt`, `summary`); machine props (`id`, `value`, `goTo`) carry no prose; `&gt;` is used inside JSX text for `>`. **Do not** introduce a `caption=` prop. This page is one complete path; the remaining vendor/connection/platform branches and FM nodes are added by repeating this pattern (see spec §7.4 / KB §2).

- [ ] **Step 2: Start the dev server and walk the full path**

Run: `corepack pnpm start`
Expected: navigate platform → connection → vendor → setup; the test-print gate branches to the fix and loops back; width and crisp gates work; "still not printing/wrong/blurry" reaches the support summary with a working **Copy support summary** button; success terminal renders. No console graph-error warnings.

- [ ] **Step 3: Confirm the page appears in the Hardware sidebar**

Expected: "Setup Wizard" appears in the Hardware section (sidebar_position 0, above "Printer Setup"). Breadcrumbs and the locale dropdown work.

- [ ] **Step 4: Commit**

```bash
git add versioned_docs/version-1.x/hardware/printer-setup-wizard.mdx
git commit -m "feat(printer-wizard): reference path MDX page (Star network local)"
```

---

## Task 10: Add the diagnostic images

**Files:**
- Create: `static/img/printer-wizard/star-selftest.png`, `column-ruler.png`, `crisp-vs-blurry.png`

- [ ] **Step 1: Add the three referenced images**

Use the real support screenshots (Star self-test, the 42-CPL column ruler test print, the crisp-vs-blurry receipt pair). **Redact** business names, SIRET, emails, and real IPs before saving. Annotate (highlight the SSL/TLS+ports block on the self-test; circle the ruler's right edge; label the crisp vs blurry sides). If finals aren't ready, drop temporary placeholders at the exact paths so the build resolves, and track replacing them.

- [ ] **Step 2: Verify the images load**

Run: `corepack pnpm start`, open the wizard, walk to each figure.
Expected: each image renders with its caption; no 404 in the console.

- [ ] **Step 3: Commit**

```bash
git add static/img/printer-wizard/
git commit -m "feat(printer-wizard): annotated diagnostic images"
```

---

## Task 11: Reference-anchor update in `printers.mdx` (spec §12.1)

**Files:**
- Modify: `versioned_docs/version-1.x/hardware/printers.mdx` (the `## Troubleshooting {#troubleshooting}` accordion)

So the wizard's fix nodes deep-link a stable anchor and aren't the sole source of truth.

- [ ] **Step 1: Add new troubleshooting accordion items**

Inside the existing `<Accordion>` under `## Troubleshooting {#troubleshooting}`, add items for the real-world FMs that the reference page is currently missing — at minimum: "Test prints but the columns don't line up" (width), "Text is blurry or faint" (ESC/POS vs print dialog), and "It says it printed but nothing came out" (web silent / scheme). Use the existing `<AccordionItem question="...">` pattern (double-quoted `question=`), with prose in `children`:

```mdx
  <AccordionItem question="Test prints but the columns don't line up">

  The **Printer text width** setting doesn't match your paper. Set it under **Advanced Settings** to match your printer: 58mm is 32 characters, 80mm is 42, and 80mm wide is 48.

  </AccordionItem>

  <AccordionItem question="Text is blurry or faint, like a photocopy">

  Soft, photocopy-like text means the receipt is printing through the **system print dialog** instead of being sent as **ESC/POS** commands. Route the thermal template to your thermal printer profile, not the system dialog. Crisp, sharp text means ESC/POS is working.

  </AccordionItem>

  <AccordionItem question="It says the receipt was sent, but nothing prints (web app)">

  On the web app, a "sent successfully" message only means the request left the browser — not that the printer received it. This usually means the printer is unreachable over the network from a browser (wrong HTTP/HTTPS scheme, a blocked port, or a missing certificate). The most reliable fix is to use the **desktop app**, which connects directly to the printer.

  </AccordionItem>
```

- [ ] **Step 2: Verify the new anchors build and the page renders**

Run: `corepack pnpm start`, open `/hardware/printers#troubleshooting`.
Expected: the new accordion items appear and expand; no broken markup.

- [ ] **Step 3: Commit**

```bash
git add versioned_docs/version-1.x/hardware/printers.mdx
git commit -m "docs(printers): add width/crisp/web-silent troubleshooting anchors for the wizard"
```

---

## Task 12: i18n compliance + full multi-locale build

**Files:**
- Modify (if needed): `scripts/check-translation-completeness.js` (`UNTRANSLATED_PROP_ALLOWLIST`)

- [ ] **Step 1: Scan the new MDX for multi-word brand labels in TEXT_PROPS**

Run: `grep -nE '(label|title|question|summary)="[^"]*"' versioned_docs/version-1.x/hardware/printer-setup-wizard.mdx`
Review each value. Any **multi-word brand/proper-noun** used as a prop value (e.g. `Star Line Mode`, `Web Bluetooth`) must be allowlisted; single-word brands (Star, Epson, PrintNode) need nothing. (In the Task 9 reference path the brand labels are single words, so this may be a no-op — confirm.)

- [ ] **Step 2: If any multi-word brand label exists, add it to the allowlist**

Edit `scripts/check-translation-completeness.js` and add the exact string(s) to `UNTRANSLATED_PROP_ALLOWLIST` (mind exact casing). Skip if Step 1 found none.

- [ ] **Step 3: Run the translation completeness gate against the changed English source**

Run: `corepack pnpm run translations:validate` then `node scripts/check-translation-completeness.js --changed`
Expected: PASS for the English source (locales legitimately fall back to English until the Aide sweep runs after merge — the gate passes on the source PR).

- [ ] **Step 4: Run the full 12-locale production build**

Run: `corepack pnpm build`
Expected: build SUCCEEDS for all locales. Because `onBrokenLinks: 'throw'`, any wizard link (`/hardware/printers`, `/hardware/printers#print-routing`) that doesn't resolve fails the build — fix any broken target.

- [ ] **Step 5: Run the full unit-test suite**

Run: `corepack pnpm test`
Expected: all PrinterWizard pure-module tests pass, plus the existing `scripts/__tests__` suite.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(printer-wizard): i18n allowlist + green multi-locale build"
```

---

## Task 13: Open the PR

- [ ] **Step 1: Push the branch and open a PR to `main`**

```bash
git push -u origin feat/printer-wizard
gh pr create --base main --title "feat: printer setup wizard (phase 1 — engine + local reference path)" \
  --body "Implements Phase 1 of docs/superpowers/specs/2026-06-30-printer-setup-wizard-design.md: the prose-free wizard engine (validity, buildGraph, reducer, urlState, summary — all unit-tested), prose-free node components, the engine shell with SSR-safe hash hydration, one complete local reference path (Star network), annotated images, and the printers.mdx troubleshooting anchors. Full 12-locale build green; vitest now collects src/ tests. Follow-on plans: phase 2 cloud branch, phase 3 analytics, and populating the remaining branches/FMs by repeating the Task 9 pattern."
```

- [ ] **Step 2: Confirm CI is green**

Expected: the build workflow (full `pnpm build`) and translation gate pass on the PR.

---

## Self-review notes (author's checklist — done)

- **Spec coverage:** engine modules (§6.4–6.7) → Tasks 2–8; MDX content model + i18n rules (§5, §6.2) → Tasks 9, 12; self-test/width/crisp gates (§7.2–7.3) → Task 9; support summary (§6.7) → Tasks 6, 9; reference-doc dependency (§12.1) → Task 11; vitest config (§10) → Task 1; SSR/trailingSlash/onBrokenLinks (§11) → Tasks 8, 12. **Deferred to follow-on plans (in scope of the spec, not this plan):** Phase 2 cloud (§7.5), Phase 3 analytics (§6.8), and the full FM-9..25 + remaining branch content (§7.4) — each repeats the Task 9 pattern.
- **Consistency:** `wizardKind` tags, `{currentId, answers, history, fixCycles}` state shape, `SELECT/BACK/RESTART/HYDRATE` actions, `makeReducer`/`initialState`/`buildGraph`/`encodeState`/`decodeState`/`summarize` signatures, and `maxFixCycles` are used identically across Tasks 3–9. The one knob to keep in sync is `maxFixCycles` (reducer default = `<PrinterWizard>` default = the reducer test config) — called out in Tasks 4 and 8.
- **No placeholders:** every code step shows complete code; image task allows temporary placeholders but names exact paths.
