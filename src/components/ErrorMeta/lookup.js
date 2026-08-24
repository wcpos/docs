/**
 * Pure lookup of an error code's facts in the data-only manifest.
 *
 * Deliberately takes the catalogue as an argument and imports nothing — no
 * React, CSS, alias, or JSON import — so it is trivially unit-testable under
 * vitest's node environment. The .mdx-facing component (./index.js) binds the
 * real manifest; tests pass their own.
 *
 * @param {string} code   the error code, e.g. "AUTH331"
 * @param {{codes: Record<string, object>}} source  the facts manifest
 * @returns the manifest facts for `code` merged with the code itself, or null.
 */
export function lookupError(code, source) {
  const entry = source && source.codes && source.codes[code];
  if (!entry) return null;
  return { code, ...entry };
}
