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

// Gates are NOT self-gated on currentId: they always render inside an already-active
// WizardStep/WizardFix, so gating again would double-hide them. Author gates only inside steps/fixes.
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
