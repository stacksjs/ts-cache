import type { HeadConfig } from 'vitepress'
import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import { withPwa } from '@vite-pwa/vitepress'
import { defineConfig } from 'vitepress'

import viteConfig from './vite.config'

// https://vitepress.dev/reference/site-config

const analyticsHead: HeadConfig[] = [
  [
    'script',
    {
      'src': 'https://cdn.usefathom.com/script.js',
      'data-site': 'NPZSNVWC',
      'defer': '',
    },
  ],
]

const nav = [
  {
    text: 'Resources',
    items: [
      { text: 'EU VAT Rules', link: 'https://taxation-customs.ec.europa.eu/vat_en' },
      { text: 'VIES Service', link: 'https://ec.europa.eu/taxation_customs/vies/' },
      { text: 'Contributing', link: 'https://github.com/stacksjs/ts-vat/blob/main/.github/CONTRIBUTING.md' },
      { text: 'License', link: '/license' },
    ],
  },
]

const sidebar = {
  '/': [
    {
      text: 'Getting Started',
      items: [
        { text: 'Introduction', link: '/intro' },
        { text: 'Installation', link: '/install' },
        { text: 'Usage Guide', link: '/usage' },
      ],
    },
    {
      text: 'Features',
      items: [
        { text: 'VAT Calculation', link: '/features/vat-calculation' },
        { text: 'VAT Number Validation', link: '/features/vat-validation' },
        { text: 'Special Cases', link: '/features/special-cases' },
        { text: 'Advanced Features', link: '/features/advanced-features' },
      ],
    },
    {
      text: 'API Reference',
      items: [
        { text: 'VatCalculator', link: '/api' },
      ],
    },
  ],
}

const description = 'A TypeScript library for EU VAT calculations and validations, supporting VIES service integration, special territories, and B2B transactions.'
const title = 'ts-vat | EU VAT Calculator for TypeScript'

export default withPwa(
  defineConfig({
    lang: 'en-US',
    title: 'ts-vat',
    description,
    metaChunk: true,
    cleanUrls: true,
    lastUpdated: true,

    head: [
      ['link', { rel: 'icon', href: '/favicon.ico' }],
      ['meta', { name: 'theme-color', content: '#3eaf7c' }],
      ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
      ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
      ['meta', { name: 'keywords', content: 'vat calculator, eu vat, typescript, vat validation, vies service, b2b vat, vat rates, tax calculation, eu moss, digital services vat, cross-border vat' }],

      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:locale', content: 'en' }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],

      ['meta', { property: 'og:site_name', content: 'ts-vat' }],
      ['meta', { property: 'og:image', content: './images/og-image.png' }],
      ['meta', { property: 'og:url', content: 'https://ts-vat.netlify.app/' }],
      ...analyticsHead,
    ],

    themeConfig: {
      search: {
        provider: 'local',
      },
      logo: {
        light: './images/logo-transparent.svg',
        dark: './images/logo-white-transparent.svg',
      },

      nav,
      sidebar,

      editLink: {
        pattern: 'https://github.com/chrisbreuer/ts-vat/edit/main/docs/:path',
        text: 'Edit this page on GitHub',
      },

      footer: {
        message: 'Released under the MIT License.',
        copyright: `Copyright © ${new Date().getFullYear()} Chris Breuer`,
      },

      socialLinks: [
        { icon: 'github', link: 'https://github.com/chrisbreuer/ts-vat' },
        { icon: 'twitter', link: 'https://twitter.com/stacksjs' },
        { icon: 'bluesky', link: 'https://bsky.app/profile/chrisbreuer.dev' },
        { icon: 'discord', link: 'https://discord.gg/stacksjs' },
      ],

      // algolia: services.algolia,

      // carbonAds: {
      //   code: '',
      //   placement: '',
      // },
    },

    pwa: {
      name: 'ts-vat Documentation',
      short_name: 'ts-vat Docs',
      theme_color: '#3eaf7c',
      icons: [
        {
          src: '/icons/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icons/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },

    markdown: {
      theme: {
        light: 'github-light',
        dark: 'github-dark',
      },

      codeTransformers: [
        transformerTwoslash(),
      ],

      lineNumbers: true,
      toc: { level: [2, 3] },
    },

    vite: viteConfig,
  }),
)
