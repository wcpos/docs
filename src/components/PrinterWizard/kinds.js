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
