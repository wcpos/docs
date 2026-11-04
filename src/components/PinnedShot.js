import React from 'react';

/**
 * A screenshot with numbered pins. The numbered legend that explains the pins
 * is a markdown ordered list on the page (wrapped in `.pinned-legend`), never a
 * prop here, so the translation pipeline sees its text.
 *
 * `pins` is a list of [x, y] percentages of the image's own width and height,
 * so the pins stay on their elements at any rendered width. A plain `img` is
 * used on purpose: IdealImage swaps in a placeholder of a different box, which
 * moves the pins.
 */
export default function PinnedShot({ src, alt, pins }) {
  return (
    <figure className="pinned-shot">
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
  );
}
