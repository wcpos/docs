/**
 * Lights pin N and legend entry N together (class `is-linked`) while either is
 * hovered or an entry's link has focus. The legend is markdown on the page, the
 * figure's next sibling `.pinned-legend`, so this toggles DOM classes instead of
 * React state. Returns a cleanup that removes the listeners and the light.
 */
export function linkPinsToLegend(figure) {
  const legend = figure && figure.nextElementSibling;
  const list =
    legend && legend.classList.contains('pinned-legend')
      ? legend.querySelector('ol')
      : null;
  if (!list) return () => {};

  const pins = () => [...figure.querySelectorAll('.pinned-shot__pin')];
  const entries = () => [...list.children].filter((el) => el.tagName === 'LI');
  let lit = [];
  const clear = () => {
    lit.forEach((el) => el.classList.remove('is-linked'));
    lit = [];
  };

  // Walk up from the event target to the pin or entry that holds it.
  const indexIn = (items, el) => {
    for (; el; el = el.parentElement) {
      if (items.includes(el)) return items.indexOf(el);
    }
    return -1;
  };

  const enter = (items) => (event) => {
    const index = indexIn(items(), event.target);
    if (index === -1) return;
    clear();
    lit = [pins()[index], entries()[index]].filter(Boolean);
    lit.forEach((el) => el.classList.add('is-linked'));
  };
  const leave = (items) => (event) => {
    const index = indexIn(items(), event.target);
    // Moving within the same pin or entry keeps it lit.
    if (index !== -1 && index !== indexIn(items(), event.relatedTarget))
      clear();
  };

  const listeners = [
    [figure, 'mouseover', enter(pins)],
    [figure, 'mouseout', leave(pins)],
    [legend, 'mouseover', enter(entries)],
    [legend, 'mouseout', leave(entries)],
    [legend, 'focusin', enter(entries)],
    [legend, 'focusout', leave(entries)],
  ];
  listeners.forEach(([el, type, fn]) => el.addEventListener(type, fn));
  return () => {
    listeners.forEach(([el, type, fn]) => el.removeEventListener(type, fn));
    clear();
  };
}
