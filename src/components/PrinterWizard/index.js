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
