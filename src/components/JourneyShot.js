/* eslint-disable react/prop-types -- the repo's components declare no PropTypes (see PinnedShot). */
import React from 'react';
import PinnedShot from './PinnedShot';
import { journeyShotProps } from './journey-shot-props';

/**
 * A journey capture with its pins, read from the capture manifest that sits
 * beside the captures; pins are never baked into the image or typed by hand.
 * The numbered legend is the component's children, a markdown list whose
 * numbers follow the manifest's pin order. Props: manifest, device, step, alt,
 * and optional colorScheme, scale, offsets and maxWidth (the close-up's width
 * in px); the capture's colorScheme goes on to PinnedShot for the pins' ring.
 */
export default function JourneyShot({
  manifest,
  alt,
  maxWidth,
  children,
  ...capture
}) {
  const { src, pins, colorScheme } = journeyShotProps(manifest, capture);
  return (
    <PinnedShot
      src={src}
      alt={alt}
      pins={pins}
      colorScheme={colorScheme}
      maxWidth={maxWidth}
    >
      {children}
    </PinnedShot>
  );
}
