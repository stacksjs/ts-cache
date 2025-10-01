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
      'data-site': 'MOCMFEQW',
      'defer': '',
    },
  ],
]

const nav = [
  { text: 'News', link: 'https://stacksjs.org/news' },
  {
    text: 'Changelog',
    link: 'https://github.com/stacksjs/ts-cache/blob/main/CHANGELOG.md',
  },
  {
    text: 'Resources',
    items: [
      { text: 'Team', link: '/team' },
      { text: 'Sponsors', link: '/sponsors' },
      { text: 'Partners', link: '/partners' },
      { text: 'Postcardware', link: '/postcardware' },
      { text: 'Stargazers', link: '/stargazers' },
      { text: 'License', link: '/license' },
      {
        items: [
          {
            text: 'Awesome Stacks',
            link: 'https://github.com/stacksjs/awesome-stacks',
          },
          {
            text: 'Contributing',
            link: 'https://github.com/stacksjs/stacks/blob/main/.github/CONTRIBUTING.md',
          },
        ],
      },
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
        { text: 'Core Features', link: '/features/core-caching' },
        { text: 'Memory & Performance', link: '/features/memory-performance' },
        { text: 'Advanced Features', link: '/features/advanced-features' },
        { text: 'Use Cases', link: '/features/use-cases' },
      ],
    },
    {
      text: 'API Reference',
      items: [
        { text: 'Cache', link: '/api' },
      ],
    },
  ],
}

const description = 'A flexible, efficient, and type-safe caching solution for TypeScript and JavaScript applications.'
const title = 'ts-cache | TypeScript Caching Library'

export default withPwa(
  defineConfig({
    lang: 'en-US',
    title: 'ts-cache',
    description,
    metaChunk: true,
    cleanUrls: true,
    lastUpdated: true,

    head: [
      ['link', { rel: 'icon', href: '/favicon.ico' }],
      ['meta', { name: 'theme-color', content: '#0A0ABC' }],
      ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
      ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
      ['meta', { name: 'keywords', content: 'typescript, cache, key-value storage, ttl, type-safe, memory management, memoization, node.js, bun, browser' }],

      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:locale', content: 'en' }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],

      ['meta', { property: 'og:site_name', content: 'ts-cache' }],
      ['meta', { property: 'og:image', content: './images/og-image.png' }],
      ['meta', { property: 'og:url', content: 'https://ts-cache.netlify.app/' }],
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
        pattern: 'https://github.com/stacksjs/ts-cache/edit/main/docs/:path',
        text: 'Edit this page on GitHub',
      },

      footer: {
        message: 'Released under the MIT License.',
        copyright: `Copyright © ${new Date().getFullYear()} Chris Breuer`,
      },

      socialLinks: [
        { icon: 'github', link: 'https://github.com/stacksjs/ts-cache' },
        { icon: 'twitter', link: 'https://twitter.com/stacksjs' },
        { icon: 'bluesky', link: 'https://bsky.app/profile/stacksjs.dev' },
        { icon: 'discord', link: 'https://discord.gg/stacksjs' },
      ],

      // algolia: services.algolia,

      // carbonAds: {
      //   code: '',
      //   placement: '',
      // },
    },

    pwa: {
      registerType: 'autoUpdate',
      manifest: {
        name: 'ts-cache Documentation',
        short_name: 'ts-cache Docs',
        theme_color: '#0A0ABC',
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
    },

    markdown: {
      theme: {
        light: 'github-light',
        dark: 'github-dark',
      },

      codeTransformers: [
        transformerTwoslash(),
      ],

      // lineNumbers: true,
      toc: { level: [2, 3] },
    },

    vite: viteConfig,
  }),
)
