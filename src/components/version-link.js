// Prefix a site-absolute link with the base path of a non-latest docs version,
// so a card on such a page stays inside that version. Pure, for the tests.
export function versionedTo(to, version) {
  if (typeof to !== 'string' || !to.startsWith('/') || to.startsWith('//')) {
    return to;
  }
  if (!version || version.isLast) {
    return to;
  }
  const base = version.path.replace(/\/+$/, '');
  if (to === base || to.startsWith(base + '/')) {
    return to;
  }
  return base + to;
}
