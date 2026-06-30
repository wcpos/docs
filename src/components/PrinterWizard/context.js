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
