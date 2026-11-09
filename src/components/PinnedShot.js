import React, { useEffect, useRef } from 'react';
import { linkPinsToLegend } from './pin-legend-link';

/**
 * A screenshot with numbered pins and its numbered legend, framed as one unit.
 * The legend is the component's markdown children (a plain ordered list), so
 * the translation pipeline sees its text; with no children the shot stands
 * alone.
 *
 * `pins` is a list of [x, y] percentages of the image's own width and height,
 * so the pins stay on their elements at any rendered width. A plain `img` is
 * used on purpose: IdealImage swaps in a placeholder of a different box, which
 * moves the pins.
 *
 * `colorScheme` is the capture's own scheme: the pins' ring takes it, not the
 * page theme, so a light capture on a dark page keeps a white ring.
 * `maxWidth` (px) caps the unit and centres it, for a close-up; it replaces
 * the page's wrapper div.
 */
export default function PinnedShot({
  src,
  alt,
  pins,
  colorScheme = 'light',
  maxWidth,
  children,
}) {
  const unitRef = useRef(null);
  useEffect(() => linkPinsToLegend(unitRef.current), []);

  const className = `pinned-unit${maxWidth ? ' pinned-unit--closeup' : ''}${
    children ? '' : ' pinned-unit--bare'
  }`;
  return (
    <div
      className={className}
      style={maxWidth ? { maxWidth } : undefined}
      ref={unitRef}
    >
      <figure className={`pinned-shot pinned-shot--${colorScheme}`}>
        <img src={src} alt={alt} loading="lazy" />
        {pins.map(([x, y], index) => (
          <span
            key={index}
            className="pinned-shot__pin"
            style={{ left: `${x}%`, top: `${y}%` }}
            aria-hidden="true"
          >
            {index + 1}
          </span>
        ))}
      </figure>
      {children ? <div className="pinned-legend">{children}</div> : null}
    </div>
  );
}
