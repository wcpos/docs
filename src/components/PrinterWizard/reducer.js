import { KIND } from './kinds';

export function initialState(config) {
  return { currentId: config.startId, answers: {}, history: [], fixCycles: 0 };
}

export function makeReducer(config) {
  const { kindById, supportId, maxFixCycles = 2 } = config;

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
        delete answers[prevId]; // clear the answer the user gave at prevId (re-answer on return)
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
