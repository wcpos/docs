/* eslint-disable react/prop-types -- the repo's components declare no PropTypes (see PinnedShot). */
import React from 'react';
import PinnedShot from './PinnedShot';
import { journeyShotProps } from './journey-shot-props';

/**
 * A journey capture with its pins, read from the capture manifest that sits
 * beside the captures; pins are never baked into the image or typed by hand.
 * As with PinnedShot, the numbered legend stays a markdown list on the page,
 * and its numbers follow the manifest's pin order. Props: manifest, device,
 * step, alt, and optional colorScheme and scale.
 */
export default function JourneyShot({ manifest, alt, ...capture }) {
  const { src, pins } = journeyShotProps(manifest, capture);
  return <PinnedShot src={src} alt={alt} pins={pins} />;
}
