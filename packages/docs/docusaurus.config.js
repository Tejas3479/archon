// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Archon Documentation',
  tagline: 'Secure, Self-Healing Enterprise Enclaves',
  favicon: 'img/favicon.ico',
  url: 'https://docs.archon.me',
  baseUrl: '/',
  organizationName: 'archon',
  projectName: 'archon',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: '/', // Serve the docs at the site's root
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: '🛡️ Archon Docs',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Guides',
          },
        ],
      },
      footer: {
        style: 'dark',
        copyright: `Copyright © ${new Date().getFullYear()} Archon Systems, Inc.`,
      },
    }),
};

module.exports = config;
