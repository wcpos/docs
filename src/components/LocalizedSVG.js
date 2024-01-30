import React, { useState, useEffect } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const LocalizedSvg = ({ svgName }) => {
  const { i18n } = useDocusaurusContext();
  const [svgUrl, setSvgUrl] = useState('');

  useEffect(() => {
    async function fetchSvg() {
      try {
        const svgModule = await import(`@site/static/svgs/${i18n.currentLocale}/${svgName}.svg`);
        setSvgUrl(() => svgModule.default);
      } catch (error) {
        console.error('Could not load the SVG: ', error);
      }
    }

    fetchSvg();
  }, [i18n.currentLocale, svgName]);

  if (!svgUrl) {
    return <div>Loading...</div>;
  }

  return <img src={svgUrl} alt={`${svgName}`} style={{ maxWidth: '100%', height: 'auto' }} />;
};

export default LocalizedSvg;
