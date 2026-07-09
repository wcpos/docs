const {themes} = require('prism-react-renderer');
const {
  canonicalizeDescriptionQuoting,
} = require('./scripts/validate-frontmatter');

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'WCPOS - Point of Sale for WooCommerce',
  clientModules: [
    require.resolve('./src/fontawesome.js'),
    require.resolve('./src/analytics/posthog.js'),
  ],
  tagline: '',
  url: 'https://docs.wcpos.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  favicon: 'img/favicon.ico',
  markdown: {
    mermaid: true,
    async parseFrontMatter(params) {
      const fileContent = canonicalizeDescriptionQuoting(params.fileContent).content;
      return params.defaultParseFrontMatter({...params, fileContent});
    },
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],
  organizationName: 'wcpos', // Usually your GitHub org/user name.
  projectName: 'docs', // Usually your repo name.
  themeConfig: {
     /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    docs: {
      sidebar: {
        hideable: false,
        autoCollapseCategories: true,
      },
    },
    // First visit follows the visitor's OS light/dark preference (and live-updates
    // if they change it), unless they've picked a theme explicitly in the footer.
    // The footer "System" button resets to this OS-following behaviour.
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'WCPOS',
      logo: {
        alt: 'WCPOS Logo',
        // The exact speech-bubble mark from the wcpos.com header (inline SVG there)
        src: 'img/wcpos-logo.svg',
        href: 'https://wcpos.com',
        // Same-tab: the marketing site and docs read as one site (not external)
        target: '_self',
      },
      items: [
        // Mirror the wcpos.com header order exactly so both sites read as one
        // nav: Downloads · Pro · Documentation · Support · Roadmap. target:_self
        // keeps the marketing links in the same tab — they're primary nav, not
        // external links. "Documentation" is the local docs (the marketing site
        // links it out to docs.wcpos.com; here it's the current site).
        {
          href: 'https://wcpos.com/downloads',
          target: '_self',
          position: 'left',
          label: 'Downloads',
        },
        {
          href: 'https://wcpos.com/pro',
          target: '_self',
          position: 'left',
          label: 'Pro',
          className: 'navbar-link-pro',
        },
        {
          type: 'doc',
          docId: 'getting-started/index',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://wcpos.com/support',
          target: '_self',
          position: 'left',
          label: 'Support',
        },
        {
          href: 'https://wcpos.com/roadmap',
          target: '_self',
          position: 'left',
          label: 'Roadmap',
        },
        {
          type: 'docsVersionDropdown',
          position: 'right',
          // dropdownItemsAfter: [{ to: '/versions', label: 'All versions' }],
          dropdownActiveClassDisabled: true,
        },
        {
          type: 'search',
          position: 'right',
        },
        // The language switcher, theme toggle and GitHub link now live in the
        // footer (see src/theme/Footer/Layout), mirroring wcpos.com.
      ],
    },
    // Mirrors the wcpos.com footer (theme-aware; columns match the marketing site)
    footer: {
      style: 'light',
      links: [
        {
          title: 'Product',
          items: [
            // wcpos.com marketing pages stay in the same tab (target:_self);
            // subdomains/app links (Live Demo etc.) remain new-tab.
            {
              label: 'Downloads',
              href: 'https://wcpos.com/downloads',
              target: '_self',
            },
            {
              label: 'WCPOS Pro',
              href: 'https://wcpos.com/pro',
              target: '_self',
            },
            {
              label: 'Roadmap',
              href: 'https://wcpos.com/roadmap',
              target: '_self',
            },
            {
              label: 'Live Demo',
              href: 'https://demo.wcpos.com/pos',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://wcpos.com/discord',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/wcpos',
            },
            {
              label: 'WordPress.org',
              href: 'https://wordpress.org/plugins/woocommerce-pos/',
            },
            {
              label: 'Help us translate',
              href: 'https://github.com/wcpos/docs/issues/new?assignees=&labels=i18n&template=translation_request.yml&language=',
            },
          ],
        },
        {
          title: 'Support',
          items: [
            {
              label: 'Get Started',
              to: '/',
            },
            {
              label: 'Support',
              href: 'https://wcpos.com/support',
              target: '_self',
            },
            {
              label: 'Status',
              href: 'https://status.wcpos.com/',
            },
            {
              label: 'WordPress Forum',
              href: 'https://wordpress.org/support/plugin/woocommerce-pos/',
            },
          ],
        },
        {
          title: 'Company',
          items: [
            {
              label: 'About',
              href: 'https://wcpos.com/about-us',
              target: '_self',
            },
            {
              label: 'Privacy',
              href: 'https://wcpos.com/privacy',
              target: '_self',
            },
            {
              label: 'Terms',
              href: 'https://wcpos.com/terms',
              target: '_self',
            },
            {
              label: 'Refunds',
              href: 'https://wcpos.com/refunds',
              target: '_self',
            },
          ],
        },
        {
          title: 'Download',
          items: [
            {
              label: 'WordPress Plugin',
              href: 'https://wordpress.org/plugins/woocommerce-pos/',
            },
            {
              label: 'WCPOS for macOS',
              href: 'https://updates.wcpos.com/v1/electron/download/darwin-arm64',
            },
            {
              label: 'WCPOS for Windows',
              href: 'https://updates.wcpos.com/v1/electron/download/win32-x64',
            },
            {
              label: 'WCPOS for Linux',
              href: 'https://updates.wcpos.com/v1/electron/download/linux-x64',
            },
            {
              label: 'WCPOS for iOS & iPad',
              href: 'https://testflight.apple.com/join/JGBdVRrW',
            },
            {
              label: 'WCPOS for Android',
              href: 'https://play.google.com/apps/testing/com.wcpos.main',
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} WCPOS`,
    },
    mermaid: {
      theme: {light: 'neutral', dark: 'dark'},
    },
    prism: {
      theme: themes.github,
      // oneDark sits better on the near-black slate background than dracula's purple
      darkTheme: themes.oneDark,
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

      // Enable click analytics
      insights: true,

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
        // Analytics: PostHog (self-hosted) via ./src/analytics/posthog.js,
        // replacing Google Analytics. See plans/2026-06-16-posthog-docs-analytics.md.
      },
    ],
  ],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr', 'de', 'nl', 'ja', 'pt-BR', 'ko', 'it', 'ar', 'hi-IN', 'zh-CN'],
    localeConfigs: {
      en: {
        htmlLang: 'en-GB',
        path: 'en',
        label: 'English',
      },
      nl: {
        label: 'Nederlands',
      },
      ar: {
        direction: 'rtl',
      },
    },
  },
  plugins: [
    function silenceKnownWebpackWarnings() {
      return {
        name: 'silence-known-webpack-warnings',
        configureWebpack() {
          return {
            ignoreWarnings: [
              (warning) =>
                warning.module?.resource?.includes('vscode-languageserver-types/lib/umd/main.js') &&
                warning.message?.includes('Critical dependency: require function is used'),
            ],
          };
        },
      };
    },
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
    // Make the docs machine-readable for AI agents / LLMs.
    // Generates, per locale, during `build`:
    //   /llms.txt        - hierarchical index linking to the markdown sources
    //   /llms-full.txt   - the entire docs corpus in a single file
    //   /<route>.md      - a clean Markdown version of every page
    // Works off the rendered HTML, so it always matches what is actually
    // published (version 1.x at the root) and resolves MDX/partials/icons.
    [
      '@signalwire/docusaurus-plugin-llms-txt',
      {
        siteTitle: 'WCPOS Documentation',
        siteDescription:
          'WCPOS is a free, open-source Point of Sale (POS) application for WooCommerce. It turns any WooCommerce-powered online store into a fully-featured retail POS system.',
        depth: 2,
        enableDescriptions: true,
        content: {
          enableMarkdownFiles: true,
          enableLlmsFullTxt: true,
          includeDocs: true,
          // Only the current version (1.x, served at the root). Older versions
          // (e.g. /0.4.x/) would add stale, contradictory answers for agents.
          includeVersionedDocs: false,
          includePages: false,
          includeBlog: false,
          // Drop the Algolia search page and any older version paths.
          excludeRoutes: ['/search', '/search/**', '/0.4.x/**'],
        },
        // Preserve the curated outbound links from the previous hand-written
        // static/llms.txt so agents still see the key entry points.
        optionalLinks: [
          {title: 'WCPOS Website', url: 'https://wcpos.com', description: 'Product website and downloads'},
          {title: 'GitHub', url: 'https://github.com/wcpos', description: 'Source code and issue tracker'},
          {title: 'Discord', url: 'https://wcpos.com/discord', description: 'Community support chat'},
          {title: 'WordPress.org plugin', url: 'https://wordpress.org/plugins/woocommerce-pos/', description: 'Free version on the WordPress plugin directory'},
          {title: 'WCPOS Pro', url: 'https://wcpos.com/pro', description: 'Pro features and licensing'},
        ],
      },
    ],
    // Human-facing affordance: a "Copy page" button with one-click
    // "Open in ChatGPT / Claude / Perplexity / Gemini" actions on every doc page.
    [
      'docusaurus-plugin-copy-page-button',
      {
        enabledActions: ['copy', 'view', 'chatgpt', 'claude', 'perplexity', 'gemini'],
      },
    ],
  ],
};
