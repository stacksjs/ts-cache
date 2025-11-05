#!/usr/bin/env bun
import process from 'node:process'
import { CLI } from '@stacksjs/clapp'
import { version } from '../package.json'
import { config } from '../src/config'
import { createCache } from '../src/manager'

const cli = new CLI('cache')

// ============================================================
// Cache Operations
// ============================================================

cli
  .command('get <key>', 'Get a value from the cache')
  .option('--driver <driver>', 'Cache driver to use (memory, memory-lru, redis)', { default: 'memory' })
  .option('--prefix <prefix>', 'Key prefix', { default: '' })
  .option('--json', 'Output as JSON')
  .example('cache get user:123')
  .example('cache get user:123 --driver redis')
  .example('cache get user:123 --json')
  .action(async (key: string, options?: { driver?: string, prefix?: string, json?: boolean }) => {
    try {
      const cache = createCache({
        driver: options?.driver as any || config.driver,
        prefix: options?.prefix || config.prefix,
      })

      const value = await cache.get(key)

      if (options?.json) {
        console.log(JSON.stringify({ key, value, found: value !== undefined }, null, 2))
      }
      else {
        if (value !== undefined) {
          console.log(`✓ Found: ${key}`)
          console.log(typeof value === 'object' ? JSON.stringify(value, null, 2) : value)
        }
        else {
          console.log(`✗ Not found: ${key}`)
          process.exit(1)
        }
      }

      await cache.close()
    }
    catch (error) {
      console.error('Error getting value:', error)
      process.exit(1)
    }
  })

cli
  .command('set <key> <value>', 'Set a value in the cache')
  .option('--driver <driver>', 'Cache driver to use', { default: 'memory' })
  .option('--prefix <prefix>', 'Key prefix', { default: '' })
  .option('--ttl <seconds>', 'Time to live in seconds', { default: '0' })
  .option('--json', 'Parse value as JSON')
  .example('cache set user:123 "John Doe"')
  .example('cache set user:123 \'{"name":"John"}\' --json')
  .example('cache set session:abc xyz123 --ttl 3600')
  .action(async (key: string, value: string, options?: { driver?: string, prefix?: string, ttl?: string, json?: boolean }) => {
    try {
      const cache = createCache({
        driver: options?.driver as any || config.driver,
        prefix: options?.prefix || config.prefix,
      })

      const parsedValue = options?.json ? JSON.parse(value) : value
      const ttl = options?.ttl ? Number.parseInt(options.ttl, 10) : undefined

      await cache.set(key, parsedValue, ttl)

      console.log(`✓ Set: ${key}`)
      if (ttl) {
        console.log(`  TTL: ${ttl} seconds`)
      }

      await cache.close()
    }
    catch (error) {
      console.error('Error setting value:', error)
      process.exit(1)
    }
  })

cli
  .command('del <keys...>', 'Delete one or more keys from the cache')
  .option('--driver <driver>', 'Cache driver to use', { default: 'memory' })
  .option('--prefix <prefix>', 'Key prefix', { default: '' })
  .example('cache del user:123')
  .example('cache del user:123 user:456 session:abc')
  .action(async (keys: string[], options?: { driver?: string, prefix?: string }) => {
    try {
      const cache = createCache({
        driver: options?.driver as any || config.driver,
        prefix: options?.prefix || config.prefix,
      })

      const count = await cache.del(keys)

      console.log(`✓ Deleted ${count} key(s)`)

      await cache.close()
    }
    catch (error) {
      console.error('Error deleting keys:', error)
      process.exit(1)
    }
  })

cli
  .command('has <key>', 'Check if a key exists in the cache')
  .option('--driver <driver>', 'Cache driver to use', { default: 'memory' })
  .option('--prefix <prefix>', 'Key prefix', { default: '' })
  .example('cache has user:123')
  .action(async (key: string, options?: { driver?: string, prefix?: string }) => {
    try {
      const cache = createCache({
        driver: options?.driver as any || config.driver,
        prefix: options?.prefix || config.prefix,
      })

      const exists = await cache.has(key)

      await cache.close()

      if (exists) {
        console.log(`✓ Key exists: ${key}`)
        process.exit(0)
      }
      else {
        console.log(`✗ Key does not exist: ${key}`)
        process.exit(1)
      }
    }
    catch (error) {
      console.error('Error checking key:', error)
      process.exit(1)
    }
  })

cli
  .command('keys [pattern]', 'List all keys in the cache')
  .option('--driver <driver>', 'Cache driver to use', { default: 'memory' })
  .option('--prefix <prefix>', 'Key prefix', { default: '' })
  .option('--json', 'Output as JSON')
  .example('cache keys')
  .example('cache keys "user:*"')
  .example('cache keys --json')
  .action(async (pattern?: string, options?: { driver?: string, prefix?: string, json?: boolean }) => {
    try {
      const cache = createCache({
        driver: options?.driver as any || config.driver,
        prefix: options?.prefix || config.prefix,
      })

      const keys = await cache.keys(pattern)

      if (options?.json) {
        console.log(JSON.stringify({ keys, count: keys.length }, null, 2))
      }
      else {
        console.log(`Found ${keys.length} key(s):`)
        keys.forEach(key => console.log(`  - ${key}`))
      }

      await cache.close()
    }
    catch (error) {
      console.error('Error listing keys:', error)
      process.exit(1)
    }
  })

cli
  .command('flush', 'Clear all keys from the cache')
  .option('--driver <driver>', 'Cache driver to use', { default: 'memory' })
  .option('--prefix <prefix>', 'Key prefix', { default: '' })
  .option('--force', 'Skip confirmation prompt')
  .example('cache flush')
  .example('cache flush --force')
  .action(async (options?: { driver?: string, prefix?: string, force?: boolean }) => {
    try {
      if (!options?.force) {
        console.log('⚠️  This will delete all cached data!')
        console.log('Use --force to skip this confirmation.')
        process.exit(1)
      }

      const cache = createCache({
        driver: options?.driver as any || config.driver,
        prefix: options?.prefix || config.prefix,
      })

      await cache.flush()

      console.log('✓ Cache flushed successfully')

      await cache.close()
    }
    catch (error) {
      console.error('Error flushing cache:', error)
      process.exit(1)
    }
  })

cli
  .command('ttl <key>', 'Get the TTL (time to live) of a key')
  .option('--driver <driver>', 'Cache driver to use', { default: 'memory' })
  .option('--prefix <prefix>', 'Key prefix', { default: '' })
  .option('--json', 'Output as JSON')
  .example('cache ttl user:123')
  .action(async (key: string, options?: { driver?: string, prefix?: string, json?: boolean }) => {
    try {
      const cache = createCache({
        driver: options?.driver as any || config.driver,
        prefix: options?.prefix || config.prefix,
      })

      const ttl = await cache.getTtl(key)

      if (options?.json) {
        console.log(JSON.stringify({ key, ttl, expires: ttl ? new Date(ttl).toISOString() : null }, null, 2))
      }
      else {
        if (ttl === undefined) {
          console.log(`✗ Key not found: ${key}`)
          process.exit(1)
        }
        else if (ttl === 0) {
          console.log(`Key: ${key}`)
          console.log('TTL: ∞ (never expires)')
        }
        else {
          const now = Date.now()
          const remaining = Math.max(0, Math.floor((ttl - now) / 1000))
          console.log(`Key: ${key}`)
          console.log(`TTL: ${remaining} seconds`)
          console.log(`Expires: ${new Date(ttl).toISOString()}`)
        }
      }

      await cache.close()
    }
    catch (error) {
      console.error('Error getting TTL:', error)
      process.exit(1)
    }
  })

// ============================================================
// Statistics & Monitoring
// ============================================================

cli
  .command('stats', 'Show cache statistics')
  .option('--driver <driver>', 'Cache driver to use', { default: 'memory' })
  .option('--prefix <prefix>', 'Key prefix', { default: '' })
  .option('--json', 'Output as JSON')
  .example('cache stats')
  .example('cache stats --json')
  .action(async (options?: { driver?: string, prefix?: string, json?: boolean }) => {
    try {
      const cache = createCache({
        driver: options?.driver as any || config.driver,
        prefix: options?.prefix || config.prefix,
      })

      const stats = await cache.getStats()

      if (options?.json) {
        console.log(JSON.stringify(stats, null, 2))
      }
      else {
        console.log('Cache Statistics:')
        console.log(`  Hits:   ${stats.hits}`)
        console.log(`  Misses: ${stats.misses}`)
        console.log(`  Keys:   ${stats.keys}`)
        console.log(`  Key Size:   ${(stats.ksize / 1024).toFixed(2)} KB`)
        console.log(`  Value Size: ${(stats.vsize / 1024).toFixed(2)} KB`)

        const total = stats.hits + stats.misses
        if (total > 0) {
          const hitRate = (stats.hits / total * 100).toFixed(2)
          console.log(`  Hit Rate: ${hitRate}%`)
        }
      }

      await cache.close()
    }
    catch (error) {
      console.error('Error getting stats:', error)
      process.exit(1)
    }
  })

// ============================================================
// Configuration & Debug
// ============================================================

cli
  .command('config', 'Show current cache configuration')
  .option('--json', 'Output as JSON')
  .example('cache config')
  .action((options?: { json?: boolean }) => {
    if (options?.json) {
      console.log(JSON.stringify(config, null, 2))
    }
    else {
      console.log('Current Configuration:')
      console.log(`  Driver: ${config.driver}`)
      console.log(`  Prefix: ${config.prefix || '(none)'}`)
      console.log(`  TTL: ${config.stdTTL === 0 ? '∞' : `${config.stdTTL}s`}`)
      console.log(`  Max Keys: ${config.maxKeys === -1 ? '∞' : config.maxKeys}`)
      console.log(`  Use Clones: ${config.useClones}`)
      console.log(`  Check Period: ${config.checkPeriod}s`)
      console.log(`  Compression: ${config.compression?.algorithm || 'none'}`)
      console.log(`  Serializer: ${config.serializer}`)
      console.log(`  Verbose: ${config.verbose}`)
    }
  })

cli
  .command('info', 'Show cache library information')
  .example('cache info')
  .action(() => {
    console.log(`ts-cache v${version}`)
    console.log()
    console.log('A powerful, TypeScript-first caching library for Bun & Node.js')
    console.log()
    console.log('Features:')
    console.log('  • Multiple drivers (Memory, Memory-LRU, Redis)')
    console.log('  • Compression (gzip, brotli, smart)')
    console.log('  • Serialization (JSON, MessagePack)')
    console.log('  • Caching patterns (cache-aside, read-through, write-through, etc.)')
    console.log('  • Middleware system')
    console.log('  • Multi-level caching')
    console.log('  • Event hooks')
    console.log('  • TTL strategies (fixed, sliding, probabilistic)')
    console.log()
    console.log('Documentation: https://github.com/stacksjs/ts-cache')
  })

cli
  .command('test', 'Test cache connectivity')
  .option('--driver <driver>', 'Cache driver to use', { default: 'memory' })
  .example('cache test')
  .example('cache test --driver redis')
  .action(async (options?: { driver?: string }) => {
    try {
      console.log(`Testing ${options?.driver || 'memory'} cache...`)

      const cache = createCache({
        driver: options?.driver as any || config.driver,
      })

      // Test write
      const testKey = `test:${Date.now()}`
      const testValue = { test: true, timestamp: Date.now() }

      console.log(`  Writing test key: ${testKey}`)
      await cache.set(testKey, testValue, 60)

      // Test read
      console.log(`  Reading test key...`)
      const retrieved = await cache.get(testKey)

      if (JSON.stringify(retrieved) === JSON.stringify(testValue)) {
        console.log('  ✓ Read successful')
      }
      else {
        throw new Error('Value mismatch')
      }

      // Test delete
      console.log(`  Deleting test key...`)
      await cache.del(testKey)

      const deleted = await cache.get(testKey)
      if (deleted === undefined) {
        console.log('  ✓ Delete successful')
      }
      else {
        throw new Error('Key still exists after delete')
      }

      console.log()
      console.log('✓ All tests passed!')

      await cache.close()
    }
    catch (error) {
      console.error('✗ Test failed:', error)
      process.exit(1)
    }
  })

cli.version(version)
cli.help()
cli.parse()
