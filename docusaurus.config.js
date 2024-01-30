const {themes} = require('prism-react-renderer');

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'WooCommerce POS',
  tagline: '',
  url: 'https://docs.wcpos.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'wcpos', // Usually your GitHub org/user name.
  projectName: 'docs', // Usually your repo name.
  themeConfig: {
     /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    docs: {
      sidebar: {
        // hideable: true,
        // autoCollapseCategories: true,
      },
    },
    navbar: {
      title: 'WooCommerce POS',
      logo: {
        alt: 'WooCommerce POS Logo',
        src: 'img/square-icon-512x512.png',
        href: 'https://wcpos.com'
      },
      items: [
        {
          type: 'doc',
          docId: 'introduction',
          position: 'left',
          label: 'Docs',
        },
        {
          type: 'localeDropdown',
          position: 'right',
          dropdownItemsAfter: [
            {
              to: 'https://github.com/wcpos/docs/issues/new?assignees=&labels=i18n&template=translation_request.yml&language=',
              label: 'Help us translate',
            },
          ],
        },
        {
          type: 'docsVersionDropdown',
          position: 'right',
          // dropdownItemsAfter: [{ to: '/versions', label: 'All versions' }],
          dropdownActiveClassDisabled: true,
        },
        {
          href: 'https://github.com/wcpos/docs',
          // label: 'GitHub',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
        {
          type: 'search',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Get Started',
              to: '/',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'WordPress.org',
              href: 'https://wordpress.org/plugins/woocommerce-pos/',
            },
            {
              label: 'Discord',
              href: 'https://wcpos.com/discord',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/wcpos',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/wcpos',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} WooCommerce POS. Built with Docusaurus.`,
    },
    prism: {
      theme: themes.github,
      darkTheme: themes.dracula,
      additionalLanguages: ['php'],
    },
    algolia: {
      // The application ID provided by Algolia
      appId: '9UQMJOIS5T',

      // Public API key: it is safe to commit it
      apiKey: '1739d8f0c7ec0af3167dd5af39d180d6',

      indexName: 'wcpos',

      // Optional: see doc section below
      contextualSearch: true,

      // Optional: Specify domains where the navigation should occur through window.location instead on history.push. Useful when our Algolia config crawls multiple documentation sites and we want to navigate with window.location.href to them.
      // externalUrlRegex: 'external\\.com|domain\\.com',

      // Optional: Replace parts of the item URLs from Algolia. Useful when using the same search index for multiple deployments using a different baseUrl. You can use regexp or string in the `from` param. For example: localhost:3000 vs myCompany.com/docs
      // replaceSearchResultPathname: {
      //   from: '/docs/', // or as RegExp: /\/docs\//
      //   to: '/',
      // },

      // Optional: Algolia search parameters
      // searchParameters: {},

      // Optional: path for search page that enabled by default (`false` to disable it)
      // searchPagePath: false,

      //... other Algolia params
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
       /** @type {import('@docusaurus/preset-classic').Options} */
      {
        docs: {
          breadcrumbs: true,
          routeBasePath: '/',
          lastVersion: '1.x',
          includeCurrentVersion: false,
          // versions: {
          //   '1.0.x': {
          //     label: '1.0.x',
          //     path: '1.0.x',
          //   },
          // },
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/wcpos/docs/edit/main/',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        gtag: {
          trackingID: 'G-08SJ28P1E5',
        }
      },
    ],
  ],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr', 'hi-IN', 'zh-CN'],
    localeConfigs: {
      en: {
        htmlLang: 'en-GB',
      },
      // You can omit a locale (e.g. fr) if you don't need to override the defaults
      fa: {
        direction: 'rtl',
      },
    },
  },
  plugins: [
    [
      '@docusaurus/plugin-ideal-image',
      {
        quality: 70,
        max: 1030, // max resized image's size.
        min: 640, // min resized image's size. if original is lower, use that size.
        steps: 2, // the max number of images generated between min and max (inclusive)
        disableInDev: false,
      },
    ],
  ],
};
