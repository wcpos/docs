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
