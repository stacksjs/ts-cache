import type { BunPressConfig } from '@stacksjs/bunpress'

const config: BunPressConfig = {
  title: 'ts-cache',
  description: 'High-performance, type-safe caching library for TypeScript',
  url: 'https://ts-cache.stacksjs.org',
  nav: [
    { text: 'Guide', link: '/guide/getting-started' },
    { text: 'API', link: '/guide/api' },
    { text: 'GitHub', link: 'https://github.com/stacksjs/ts-cache' },
  ],

  sidebar: [
    {
      text: 'Introduction',
      items: [
        { text: 'Overview', link: '/' },
        { text: 'Getting Started', link: '/guide/getting-started' },
      ],
    },
    {
      text: 'Core Features',
      items: [
        { text: 'API Reference', link: '/guide/api' },
        { text: 'TTL Management', link: '/guide/ttl' },
      ],
    },
    {
      text: 'Features',
      items: [
        { text: 'Cache Stores', link: '/features/stores' },
        { text: 'Cache Tags', link: '/features/tags' },
        { text: 'Atomic Operations', link: '/features/atomic' },
        { text: 'Event Hooks', link: '/features/events' },
      ],
    },
    {
      text: 'Advanced',
      items: [
        { text: 'Multi-Store Setup', link: '/advanced/multi-store' },
        { text: 'Cache Warming', link: '/advanced/warming' },
        { text: 'Distributed Caching', link: '/advanced/distributed' },
        { text: 'Performance Tuning', link: '/advanced/performance' },
      ],
    },
  ],

  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/stacksjs/ts-cache' },
    ],
  },
}

export default config
