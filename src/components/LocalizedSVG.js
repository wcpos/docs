import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

// Preload all SVGs using require.context
const svgMap = require.context('@site/static/svgs', true, /\.svg$/).keys().reduce((map, path) => {
  const [_, locale, name] = path.match(/\.\/([^/]+)\/([^/]+)\.svg$/) || [];
  if (locale && name) {
    if (!map[locale]) map[locale] = {};
    map[locale][name] = path;
  }
  return map;
}, {});

const LocalizedSvg = ({ svgName }) => {
  const { i18n } = useDocusaurusContext();
  const localeSvgMap = svgMap[i18n.currentLocale];

  if (!localeSvgMap || !localeSvgMap[svgName]) {
    return <div>SVG not found</div>;
  }

  // Resolve the path dynamically
  const svgPath = localeSvgMap[svgName];

  return (
    <img
      src={require(`@site/static/svgs${svgPath.slice(1)}`).default} // Remove the "./" from the path
      alt={svgName}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
};

export default LocalizedSvg;
