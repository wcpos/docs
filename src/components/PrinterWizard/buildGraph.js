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
