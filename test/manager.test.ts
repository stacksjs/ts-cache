import type { CacheManager } from '../src/manager'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { createCache } from '../src/manager'

describe('CacheManager', () => {
  let cache: CacheManager

  beforeEach(() => {
    cache = createCache({
      driver: 'memory',
      stdTTL: 60,
      checkPeriod: 0,
    })
  })

  afterEach(async () => {
    await cache.flush()
    await cache.close()
  })

  describe('Core Operations', () => {
    test('should set and get a value', async () => {
      // Arrange
      const key = 'test-key'
      const value = 'test-value'

      // Act
      await cache.set(key, value)
      const result = await cache.get(key)

      // Assert
      expect(result).toBe(value)
    })

    test('should return undefined for non-existent keys', async () => {
      // Act
      const result = await cache.get('non-existent')

      // Assert
      expect(result).toBeUndefined()
    })

    test('should check if a key exists', async () => {
      // Arrange
      await cache.set('exists', 'value')

      // Act & Assert
      expect(await cache.has('exists')).toBe(true)
      expect(await cache.has('does-not-exist')).toBe(false)
    })

    test('should delete a key', async () => {
      // Arrange
      await cache.set('to-delete', 'value')
      expect(await cache.has('to-delete')).toBe(true)

      // Act
      const result = await cache.del('to-delete')

      // Assert
      expect(result).toBe(1)
      expect(await cache.has('to-delete')).toBe(false)
    })

    test('should take a value atomically', async () => {
      // Arrange
      await cache.set('to-take', 'value')

      // Act
      const result = await cache.take('to-take')

      // Assert
      expect(result).toBe('value')
      expect(await cache.has('to-take')).toBe(false)
    })

    test('should flush all cache data', async () => {
      // Arrange
      await cache.set('key1', 'value1')
      await cache.set('key2', 'value2')
      const keysBefore = await cache.keys()
      expect(keysBefore.length).toBe(2)

      // Act
      await cache.flush()

      // Assert
      const keysAfter = await cache.keys()
      expect(keysAfter.length).toBe(0)
    })

    test('should get all keys', async () => {
      // Arrange
      await cache.set('key1', 'value1')
      await cache.set('key2', 'value2')
      await cache.set('key3', 'value3')

      // Act
      const keys = await cache.keys()

      // Assert
      expect(keys.sort()).toEqual(['key1', 'key2', 'key3'])
    })
  })

  describe('TTL Operations', () => {
    test('should respect TTL when getting values', async () => {
      // Arrange
      await cache.set('expires-fast', 'value', 1) // 1 second TTL

      // Act & Assert
      expect(await cache.get('expires-fast')).toBe('value')

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Value should be expired now
      expect(await cache.get('expires-fast')).toBeUndefined()
    })

    test('should get TTL for a key', async () => {
      // Arrange
      await cache.set('ttl-key', 'value', 300)

      // Act
      const ttl = await cache.getTtl('ttl-key')

      // Assert
      expect(typeof ttl).toBe('number')
      expect(ttl).toBeGreaterThan(Date.now())
    })

    test('should update TTL for a key', async () => {
      // Arrange
      await cache.set('update-ttl', 'value', 60)

      // Act
      const result = await cache.ttl('update-ttl', 300)
      const newTtl = await cache.getTtl('update-ttl')

      // Assert
      expect(result).toBe(true)
      expect(typeof newTtl).toBe('number')
      expect(newTtl).toBeGreaterThan(Date.now())
    })
  })

  describe('Batch Operations', () => {
    test('should set multiple values at once', async () => {
      // Arrange
      const entries = [
        { key: 'batch1', value: 'value1' },
        { key: 'batch2', value: 'value2' },
        { key: 'batch3', value: 'value3', ttl: 300 },
      ]

      // Act
      const result = await cache.mset(entries)

      // Assert
      expect(result).toBe(true)
      expect(await cache.get('batch1')).toBe('value1')
      expect(await cache.get('batch2')).toBe('value2')
      expect(await cache.get('batch3')).toBe('value3')
    })

    test('should get multiple values at once', async () => {
      // Arrange
      await cache.set('multi1', 'value1')
      await cache.set('multi2', 'value2')
      await cache.set('multi3', 'value3')

      // Act
      const result = await cache.mget(['multi1', 'multi2', 'non-existent'])

      // Assert
      expect(result).toEqual({
        multi1: 'value1',
        multi2: 'value2',
      })
      expect(result['non-existent']).toBeUndefined()
    })

    test('should delete multiple keys at once', async () => {
      // Arrange
      await cache.set('del1', 'value1')
      await cache.set('del2', 'value2')
      await cache.set('keep', 'value3')

      // Act
      const result = await cache.del(['del1', 'del2'])

      // Assert
      expect(result).toBe(2)
      expect(await cache.has('del1')).toBe(false)
      expect(await cache.has('del2')).toBe(false)
      expect(await cache.has('keep')).toBe(true)
    })
  })

  describe('Fetch Operations', () => {
    test('should fetch and cache a computed value', async () => {
      // Arrange
      let computeCount = 0
      const fetcher = () => {
        computeCount++
        return 'computed-value'
      }

      // Act
      const result1 = await cache.fetch('fetch-key', fetcher)
      const result2 = await cache.fetch('fetch-key', fetcher)

      // Assert
      expect(result1).toBe('computed-value')
      expect(result2).toBe('computed-value')
      expect(computeCount).toBe(1) // Should only compute once
    })

    test('should remember a value with TTL', async () => {
      // Arrange
      const fetcher = () => 'remembered-value'

      // Act
      const result = await cache.remember('remember-key', 300, fetcher)

      // Assert
      expect(result).toBe('remembered-value')
      expect(await cache.get('remember-key')).toBe('remembered-value')
    })

    test('should remember a value forever', async () => {
      // Arrange
      const fetcher = () => 'forever-value'

      // Act
      const result = await cache.rememberForever('forever-key', fetcher)

      // Assert
      expect(result).toBe('forever-value')
      expect(await cache.get('forever-key')).toBe('forever-value')
    })
  })

  describe('Statistics', () => {
    test('should get cache statistics', async () => {
      // Arrange
      await cache.set('key1', 'value1')
      await cache.set('key2', 'value2')

      // Act
      const stats = await cache.getStats()

      // Assert
      expect(stats.keys).toBeGreaterThanOrEqual(2)
      expect(typeof stats.hits).toBe('number')
      expect(typeof stats.misses).toBe('number')
    })
  })

  describe('Namespace Operations', () => {
    test('should create a namespaced cache instance', async () => {
      // Arrange
      const nsCache = cache.namespace('test-namespace')

      // Act
      await nsCache.set('key1', 'value1')
      await cache.set('key1', 'global-value')

      // Assert
      expect(await nsCache.get('key1')).toBe('value1')
      expect(await cache.get('key1')).toBe('global-value')
    })

    test('should isolate namespace keys', async () => {
      // Arrange
      const ns1 = cache.namespace('ns1')
      const ns2 = cache.namespace('ns2')

      // Act
      await ns1.set('shared', 'ns1-value')
      await ns2.set('shared', 'ns2-value')

      // Assert
      expect(await ns1.get('shared')).toBe('ns1-value')
      expect(await ns2.get('shared')).toBe('ns2-value')
    })

    test('should flush only namespaced keys', async () => {
      // Arrange
      const ns = cache.namespace('to-flush')
      await ns.set('key1', 'value1')
      await cache.set('global', 'global-value')

      // Act
      await ns.flush()

      // Assert
      expect(await ns.get('key1')).toBeUndefined()
      expect(await cache.get('global')).toBe('global-value')
    })
  })

  describe('Tag Operations', () => {
    test('should tag cache entries', async () => {
      // Arrange
      await cache.set('user:1', { name: 'Alice' })
      await cache.set('user:2', { name: 'Bob' })

      // Act
      await cache.tag('user:1', ['users', 'premium'])
      await cache.tag('user:2', ['users'])

      const userKeys = await cache.getKeysByTag('users')
      const premiumKeys = await cache.getKeysByTag('premium')

      // Assert
      expect(userKeys.sort()).toEqual(['user:1', 'user:2'])
      expect(premiumKeys).toEqual(['user:1'])
    })

    test('should delete keys by tag', async () => {
      // Arrange
      await cache.set('post:1', 'content1')
      await cache.set('post:2', 'content2')
      await cache.set('user:1', 'Alice')

      await cache.tag('post:1', ['posts'])
      await cache.tag('post:2', ['posts'])
      await cache.tag('user:1', ['users'])

      // Act
      const deleted = await cache.deleteByTag('posts')

      // Assert
      expect(deleted).toBe(2)
      expect(await cache.get('post:1')).toBeUndefined()
      expect(await cache.get('post:2')).toBeUndefined()
      expect(await cache.get('user:1')).toBe('Alice')
    })
  })

  describe('Events', () => {
    test('should emit set event', async () => {
      // Arrange
      let eventKey: string | undefined
      let eventValue: any
      cache.on('set', (key, value) => {
        eventKey = key.toString()
        eventValue = value
      })

      // Act
      await cache.set('event-key', 'event-value')

      // Assert
      expect(eventKey).toBe('event-key')
      expect(eventValue).toBe('event-value')
    })

    test('should emit del event', async () => {
      // Arrange
      await cache.set('to-delete', 'value')
      let eventKey: string | undefined
      cache.on('del', (key) => {
        eventKey = Array.isArray(key) ? key[0].toString() : key.toString()
      })

      // Act
      await cache.del('to-delete')

      // Assert
      expect(eventKey).toBe('to-delete')
    })

    test('should emit flush event', async () => {
      // Arrange
      let flushed = false
      cache.on('flush', () => {
        flushed = true
      })

      // Act
      await cache.flush()

      // Assert
      expect(flushed).toBe(true)
    })
  })

  describe('Driver Selection', () => {
    test('should create memory driver by default', () => {
      // Arrange & Act
      const memCache = createCache()

      // Assert
      expect(memCache.getDriver()).toBeDefined()
    })

    test('should create memory driver when specified', () => {
      // Arrange & Act
      const memCache = createCache({ driver: 'memory' })

      // Assert
      expect(memCache.getDriver()).toBeDefined()
    })

    test('should support custom driver', async () => {
      // Arrange
      const mockDriver = {
        get: async () => 'mock-value',
        set: async () => true,
        del: async () => 1,
        has: async () => true,
        keys: async () => ['key1'],
        mget: async () => ({ key1: 'value1' }),
        mset: async () => true,
        getTtl: async () => Date.now() + 1000,
        ttl: async () => true,
        flush: async () => {},
        getStats: async () => ({ hits: 0, misses: 0, keys: 0, ksize: 0, vsize: 0 }),
        close: async () => {},
      }

      // Act
      const customCache = createCache({ customDriver: mockDriver })
      const value = await customCache.get('any-key')

      // Assert
      expect(value).toBe('mock-value')
    })
  })

  describe('Complex Value Handling', () => {
    test('should handle complex objects', async () => {
      // Arrange
      const complex = {
        name: 'Complex Object',
        nested: {
          level1: {
            level2: {
              array: [1, 2, 3],
              value: true,
            },
          },
        },
        date: new Date().toISOString(),
      }

      // Act
      await cache.set('complex', complex)
      const result = await cache.get('complex')

      // Assert
      expect(result).toEqual(complex)
    })

    test('should handle arrays', async () => {
      // Arrange
      const array = [1, 'string', { obj: true }, ['nested', 'array']]

      // Act
      await cache.set('array', array)
      const result = await cache.get('array')

      // Assert
      expect(result).toEqual(array)
    })

    test('should handle null values', async () => {
      // Act
      await cache.set('null-key', null)

      // Assert
      expect(await cache.get('null-key')).toBeNull()
    })

    test('should support generic type parameters', async () => {
      // Arrange
      interface User {
        id: number
        name: string
        email: string
      }

      const user: User = { id: 1, name: 'John', email: 'john@example.com' }

      // Act
      await cache.set<User>('user', user)
      const result = await cache.get<User>('user')

      // Assert
      expect(result).toEqual(user)
      if (result) {
        expect(result.id).toBe(1)
        expect(result.name).toBe('John')
        expect(result.email).toBe('john@example.com')
      }
    })
  })
})
