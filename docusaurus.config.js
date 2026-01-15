const {themes} = require('prism-react-renderer');

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'WCPOS - Point of Sale for WooCommerce',
  tagline: '',
  url: 'https://docs.wcpos.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  favicon: 'img/favicon.ico',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
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
      title: 'WCPOS',
      logo: {
        alt: 'WCPOS Logo',
        src: 'img/square-icon-512x512.png',
        href: 'https://wcpos.com'
      },
      items: [
        {
          type: 'doc',
          docId: 'getting-started/index',
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
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/wcpos',
            },
            {
              label: 'WCPOS',
              href: 'https://wcpos.com',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} WCPOS.`,
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
    locales: ['en', 'es', 'fr', 'de', 'ja', 'pt-BR', 'ko', 'it', 'ar', 'hi-IN', 'zh-CN'],
    localeConfigs: {
      en: {
        htmlLang: 'en-GB',
      },
      ar: {
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
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          // Introduction → Getting Started
          { from: '/introduction', to: '/' },

          // Installation folder
          { from: '/installation/minimum-requirements', to: '/getting-started/installation' },
          { from: '/installation/woocommerce-pos-pro', to: '/getting-started/pro-license' },
          { from: '/installation/previous-versions', to: '/getting-started/previous-versions' },

          // Products folder (moved to POS)
          { from: '/products/search-filtering', to: '/pos/product-panel/search-filtering' },
          { from: '/products/barcode-scanning', to: '/pos/product-panel/barcode-scanning' },

          // Cart folder (moved to POS)
          { from: '/cart', to: '/pos/cart' },
          { from: '/cart/order-actions', to: '/pos/cart/order-actions' },

          // Settings restructure
          { from: '/settings/pos', to: '/settings' },
          { from: '/settings/pos/store', to: '/settings/store' },
          { from: '/settings/pos/store/general-settings', to: '/settings/store/general' },
          { from: '/settings/pos/store/tax-settings', to: '/settings/store/tax' },
          { from: '/settings/pos/store/barcode-settings', to: '/settings/store/barcode' },
          { from: '/settings/pos/store/hotkey-settings', to: '/settings/store/hotkeys' },
          { from: '/settings/pos/store/theme-settings', to: '/settings/store/theme' },
          { from: '/settings/pos/section', to: '/settings' },
          { from: '/settings/pos/section/pos-products-settings', to: '/pos/product-panel' },
          { from: '/settings/pos/section/pos-cart-settings', to: '/pos/cart' },
          { from: '/settings/pos/section/products-settings', to: '/products' },
          { from: '/settings/pos/section/orders-settings', to: '/orders' },
          { from: '/settings/pos/section/customers-settings', to: '/customers' },
          { from: '/settings/pos/section/reports-settings', to: '/reports' },

          // Troubleshooting → Support
          { from: '/troubleshooting/critical-error', to: '/support/troubleshooting/critical-error' },
          { from: '/troubleshooting/response-error', to: '/support/troubleshooting/response-error' },
        ],
      },
    ],
  ],
};
