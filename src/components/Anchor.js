/* eslint-disable react/prop-types -- The id is supplied by MDX jump targets. */
import React from 'react';
import useBrokenLinks from '@docusaurus/useBrokenLinks';

// Docusaurus registers only heading and Link ids, so bare <a id>/<span id>
// jump targets in MDX are reported as broken anchors even though they work.
// Register the id while rendering the same empty span target.
export default function Anchor({ id }) {
  useBrokenLinks().collectAnchor(id);
  return <span id={id} />;
}
