import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { Cache } from '../src/cache'

describe('ts-cache', () => {
  // Basic cache instance for tests
  let cache: Cache

  beforeEach(() => {
    // Create a fresh cache for each test
    cache = new Cache({
      stdTTL: 60, // 60 seconds default TTL
      checkPeriod: 0, // Disable auto cleanup for tests
    })
  })

  afterEach(() => {
    // Clean up after each test
    cache.flushAll()
  })

  describe('Core Operations', () => {
    test('should set and get a value', () => {
      // Arrange
      const key = 'test-key'
      const value = 'test-value'

      // Act
      cache.set(key, value)
      const result = cache.get(key)

      // Assert
      expect(result).toBe(value)
    })

    test('should set and get a value with a number key', () => {
      // Arrange
      const key = 123
      const value = 'test-value'

      // Act
      cache.set(key, value)
      const result = cache.get(key)

      // Assert
      expect(result).toBe(value)
    })

    test('should support generic type parameters', () => {
      // Arrange
      interface User {
        id: number
        name: string
      }

      const user: User = { id: 1, name: 'John' }

      // Act
      cache.set<User>('user', user)
      const result = cache.get<User>('user')

      // Assert
      expect(result).toEqual(user)
      if (result) {
        // TypeScript should recognize this as a User
        expect(result.id).toBe(1)
        expect(result.name).toBe('John')
      }
    })

    test('should return undefined for non-existent keys', () => {
      // Act
      const result = cache.get('non-existent')

      // Assert
      expect(result).toBeUndefined()
    })

    test('should check if a key exists', () => {
      // Arrange
      cache.set('exists', 'value')

      // Act & Assert
      expect(cache.has('exists')).toBe(true)
      expect(cache.has('does-not-exist')).toBe(false)
    })

    test('should delete a key', () => {
      // Arrange
      cache.set('to-delete', 'value')
      expect(cache.has('to-delete')).toBe(true)

      // Act
      const result = cache.del('to-delete')

      // Assert
      // Actual implementation returns the number of deleted keys (1) not a boolean
      expect(result).toBe(1)
      expect(cache.has('to-delete')).toBe(false)
    })

    test('should take a value', () => {
      // Arrange
      cache.set('to-take', 'value')

      // Act
      const result = cache.take('to-take')

      // Assert
      expect(result).toBe('value')
      expect(cache.has('to-take')).toBe(false)
    })

    test('should reset the cache', () => {
      // Arrange
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      expect(cache.keys().length).toBe(2)

      // Act
      cache.flushAll()

      // Assert
      expect(cache.keys().length).toBe(0)
    })

    test('should return all keys', () => {
      // Arrange
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')

      // Act
      const keys = cache.keys()

      // Assert
      expect(keys).toEqual(['key1', 'key2', 'key3'])
    })
  })

  describe('TTL Operations', () => {
    test('should respect TTL when getting values', async () => {
      // Arrange
      cache.set('expires-fast', 'value', 1) // 1 second TTL

      // Act & Assert - Type assertion to handle type mismatch
      expect(cache.get('expires-fast') as string).toBe('value')

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Value should be expired now
      expect(cache.get('expires-fast')).toBeUndefined()
    })

    test('should support infinite TTL with 0', async () => {
      // Arrange
      cache.set('never-expires', 'value', 0)

      // Act & Assert - Type assertion to handle type mismatch
      expect(cache.get('never-expires') as string).toBe('value')

      // Wait some time
      await new Promise(resolve => setTimeout(resolve, 100))

      // Value should still be there
      expect(cache.get('never-expires') as string).toBe('value')
    })

    test('should get TTL for a key', () => {
      // Arrange
      cache.set('ttl-key', 'value', 300)

      // Act
      // Actual implementation returns a boolean, not a number
      const ttl = cache.getTtl('ttl-key')

      // Assert
      // Based on actual behavior, this is a timestamp not seconds remaining
      // We need to ensure it's a future timestamp (milliseconds)
      expect(typeof ttl).toBe('number')
      expect(ttl).toBeGreaterThan(Date.now())
    })

    test('should update TTL for a key', () => {
      // Arrange
      cache.set('update-ttl', 'value', 60)

      // Act
      const result = cache.ttl('update-ttl', 300)
      const newTtl = cache.getTtl('update-ttl')

      // Assert
      expect(result).toBe(true)
      expect(typeof newTtl).toBe('number')
      expect(newTtl).toBeGreaterThan(Date.now())
    })

    test('should get expiry timestamp', () => {
      // Arrange
      const now = Date.now()
      cache.set('timestamp', 'value', 300)

      // Act
      const timestamp = cache.getTtl('timestamp')

      // Assert
      // Timestamp is in milliseconds not seconds
      expect(typeof timestamp).toBe('number')
      expect(timestamp).toBeGreaterThan(now)
      expect(timestamp).toBeLessThan(now + 310000) // Allow 310 seconds in ms
    })
  })

  describe('Batch Operations', () => {
    test('should set multiple values at once', () => {
      // Arrange
      const items = [
        { key: 'batch1', val: 'value1' },
        { key: 'batch2', val: 'value2' },
        { key: 'batch3', val: 'value3', ttl: 300 },
      ]

      // Act
      const result = cache.mset(items)

      // Assert
      expect(result).toBe(true)
      // Type assertions for value types
      expect(cache.get('batch1') as string).toBe('value1')
      expect(cache.get('batch2') as string).toBe('value2')
      expect(cache.get('batch3') as string).toBe('value3')

      // Check the custom TTL was applied
      const ttl = cache.getTtl('batch3')
      expect(typeof ttl).toBe('number')
      expect(ttl).toBeGreaterThan(Date.now())
    })

    test('should get multiple values at once', () => {
      // Arrange
      cache.set('multi1', 'value1')
      cache.set('multi2', 'value2')
      cache.set('multi3', 'value3')

      // Act
      const result = cache.mget(['multi1', 'multi2', 'non-existent'])

      // Assert
      expect(result).toEqual({
        multi1: 'value1',
        multi2: 'value2',
      })
      expect(result['non-existent']).toBeUndefined()
    })

    test('should delete multiple keys at once', () => {
      // Arrange
      cache.set('del1', 'value1')
      cache.set('del2', 'value2')
      cache.set('keep', 'value3')

      // Act
      const result = cache.del(['del1', 'del2'])

      // Assert
      // Actual implementation returns count of deleted keys (2) not a boolean
      expect(result).toBe(2)
      expect(cache.has('del1')).toBe(false)
      expect(cache.has('del2')).toBe(false)
      expect(cache.has('keep')).toBe(true)
    })
  })

  describe('Fetch Operations', () => {
    test('should fetch with a direct value', () => {
      // Act
      const result = cache.fetch('fetch-key', 'default-value')

      // Assert
      expect(result).toBe('default-value')
      // Type assertion to handle type mismatch
      expect(cache.get('fetch-key') as string).toBe('default-value')
    })

    test('should fetch with a function', () => {
      // Arrange
      const computeFn = () => 'computed-value'

      // Act
      const result = cache.fetch('fetch-fn', computeFn)

      // Assert
      expect(result).toBe('computed-value')
      // Type assertion to handle type mismatch
      expect(cache.get('fetch-fn') as string).toBe('computed-value')
    })

    test('should not compute function if key exists', () => {
      // Arrange
      cache.set('existing', 'existing-value')
      const computeFn = mock(() => 'should-not-be-called')

      // Act
      const result = cache.fetch('existing', computeFn)

      // Assert
      expect(result).toBe('existing-value')
      expect(computeFn).not.toHaveBeenCalled()
    })

    test('should fetch with TTL and value', () => {
      // Act
      cache.fetch('fetch-ttl', 10, 'ttl-value')
      const ttl = cache.getTtl('fetch-ttl')

      // Assert
      // Type assertion to handle type mismatch
      expect(cache.get('fetch-ttl') as string).toBe('ttl-value')
      // Based on implementation, ttl is a timestamp not seconds
      expect(typeof ttl).toBe('number')
      expect(ttl).toBeGreaterThan(Date.now())
    })

    test('should fetch with TTL and function', () => {
      // Arrange
      const computeFn = () => 'computed-with-ttl'

      // Act
      cache.fetch('fetch-fn-ttl', 10, computeFn)
      const ttl = cache.getTtl('fetch-fn-ttl')

      // Assert
      // Type assertion to handle type mismatch
      expect(cache.get('fetch-fn-ttl') as string).toBe('computed-with-ttl')
      // Based on implementation, ttl is a timestamp not seconds
      expect(typeof ttl).toBe('number')
      expect(ttl).toBeGreaterThan(Date.now())
    })
  })

  describe('Configuration Options', () => {
    test('should respect maxKeys option', () => {
      // Arrange
      const limitedCache = new Cache({ maxKeys: 2 })

      // Act
      limitedCache.set('key1', 'value1')
      limitedCache.set('key2', 'value2')

      // Assert
      expect(limitedCache.keys().length).toBe(2)

      // This should fail because we reached max keys
      let error: any
      try {
        limitedCache.set('key3', 'value3')
      }
      catch (e) {
        error = e
      }

      expect(error).toBeDefined()
      expect(error.errorcode).toBe('ECACHEFULL')
    })

    test('should respect forceString option', () => {
      // Arrange
      const stringCache = new Cache({ forceString: true })
      const obj = { name: 'test' }

      // Act
      stringCache.set('obj', obj)
      const result = stringCache.get('obj')

      // Assert
      expect(typeof result).toBe('string')
      expect(result).toBe(JSON.stringify(obj))
    })

    test('should respect useClones option', () => {
      // Arrange
      const noCloneCache = new Cache({ useClones: false })
      const obj = { count: 1 }

      // Act
      noCloneCache.set('obj', obj)
      // Type assertion to get correct type
      const result = noCloneCache.get('obj') as { count: number }

      // Modify the retrieved object
      if (result) {
        result.count = 2
      }

      // Assert
      // The cached value should also be changed because we're not cloning
      // Type assertion for correct comparison
      expect(noCloneCache.get('obj') as { count: number }).toEqual({ count: 2 })
    })
  })

  describe('Statistics', () => {
    test('should track hits and misses', () => {
      // Arrange
      cache.set('stat-key', 'value')

      // Act - 2 hits, 1 miss
      cache.get('stat-key')
      cache.get('stat-key')
      cache.get('non-existent')

      const stats = cache.getStats()

      // Assert
      expect(stats.hits).toBe(2)
      expect(stats.misses).toBe(1)
    })

    test('should track key count', () => {
      // Arrange
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')

      // Act
      const stats = cache.getStats()

      // Assert
      expect(stats.keys).toBe(2)
    })

    test('should estimate memory size', () => {
      // Arrange
      cache.set('string', 'small value')
      cache.set('obj', { name: 'test', value: 123 })

      // Act
      const stats = cache.getStats()

      // Assert
      expect(stats.ksize).toBeGreaterThan(0) // Key size
      expect(stats.vsize).toBeGreaterThan(0) // Value size
    })

    test('should reset statistics', () => {
      // Arrange
      cache.set('key', 'value')
      cache.get('key')
      cache.get('missing')
      expect(cache.getStats().hits).toBe(1)
      expect(cache.getStats().misses).toBe(1)

      // Act
      cache.flushStats()
      const stats = cache.getStats()

      // Assert
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
    })
  })

  describe('Events', () => {
    test('should emit set event', () => {
      // Arrange
      const spy = mock(() => {})
      cache.on('set', spy)

      // Act
      cache.set('event-key', 'event-value')

      // Assert
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith('event-key', 'event-value')
    })

    test('should emit del event', () => {
      // Arrange
      cache.set('event-del', 'value')
      const spy = mock(() => {})
      cache.on('del', spy)

      // Act
      cache.del('event-del')

      // Assert
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith('event-del', 'value')
    })

    test('should emit expired event', async () => {
      // Arrange
      const spy = mock(() => {})
      cache.on('expired', spy)

      // Act
      cache.set('expires', 'value', 0.1) // 100ms TTL

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 200))

      // Trigger cleanup by trying to get the value
      cache.get('expires')

      // Assert
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith('expires', 'value')
    })

    test('should emit flush event', () => {
      // Arrange
      const spy = mock(() => {})
      cache.on('flush', spy)

      // Act
      cache.flushAll()

      // Assert
      expect(spy).toHaveBeenCalledTimes(1)
    })

    test('should emit flush-stats event', () => {
      // Arrange
      const spy = mock(() => {})
      cache.on('flush_stats', spy)

      // Act
      cache.flushStats()

      // Assert
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    test('should throw on invalid key type', () => {
      // Act & Assert
      expect(() => {
        // @ts-expect-error - Testing runtime behavior with invalid type
        cache.set(null, 'value')
      }).toThrow()
    })

    test('should throw when cache is full', () => {
      // Arrange
      const smallCache = new Cache({ maxKeys: 1 })
      smallCache.set('only', 'value')

      // Act & Assert
      expect(() => {
        smallCache.set('one-too-many', 'value')
      }).toThrow()
    })

    test('should include error code in error object', () => {
      // Arrange
      const smallCache = new Cache({ maxKeys: 1 })
      smallCache.set('only', 'value')

      // Act
      try {
        smallCache.set('overflow', 'value')
        expect(true).toBe(false) // Should not reach here
      }
      catch (error: any) {
        // Assert
        expect(error.errorcode).toBe('ECACHEFULL')
      }
    })
  })

  describe('Complex Value Handling', () => {
    test('should handle complex objects', () => {
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
        date: new Date(),
        fn() { return 'test' },
      }

      // Act
      cache.set('complex', complex)
      const result = cache.get('complex')

      // Assert
      expect(result).toEqual(complex)
    })

    test('should handle arrays', () => {
      // Arrange
      const array = [1, 'string', { obj: true }, ['nested', 'array']]

      // Act
      cache.set('array', array)
      const result = cache.get('array')

      // Assert
      expect(result).toEqual(array)
    })

    test('should handle functions', () => {
      // Arrange
      function testFn(a: number, b: number) {
        return a + b
      }

      // Act
      cache.set('function', testFn)
      const result = cache.get<typeof testFn>('function')

      // Assert
      expect(typeof result).toBe('function')
      expect(result?.(1, 2)).toBe(3)
    })

    test('should handle null and undefined', () => {
      // Act
      cache.set('null-key', null)
      cache.set('undefined-key', undefined)

      // Assert
      expect(cache.get('null-key')).toBeNull()
      // Based on actual behavior, undefined values are stored as null
      expect(cache.get('undefined-key')).toBeNull()
    })
  })
})
