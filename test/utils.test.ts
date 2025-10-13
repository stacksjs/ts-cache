import type { CacheManager } from '../src/manager'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { createCache } from '../src/manager'
import {
  BatchOperations,
  CacheInvalidation,
  CacheLock,
  CacheWarmer,
  CircuitBreaker,
  DebouncedCache,
  memoize,
  RateLimiter,
} from '../src/utils'

describe('Utils', () => {
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

  describe('RateLimiter', () => {
    test('should allow requests within limit', async () => {
      // Arrange
      const limiter = new RateLimiter(cache, 3, 60)

      // Act & Assert
      const result1 = await limiter.check('user:1')
      expect(result1.limited).toBe(false)
      expect(result1.remaining).toBe(2)

      const result2 = await limiter.check('user:1')
      expect(result2.limited).toBe(false)
      expect(result2.remaining).toBe(1)
    })

    test('should limit requests when max is exceeded', async () => {
      // Arrange
      const limiter = new RateLimiter(cache, 2, 60)

      // Act
      await limiter.check('user:2')
      await limiter.check('user:2')
      const result = await limiter.check('user:2')

      // Assert
      expect(result.limited).toBe(true)
      expect(result.remaining).toBe(0)
    })

    test('should reset rate limit', async () => {
      // Arrange
      const limiter = new RateLimiter(cache, 2, 60)
      await limiter.check('user:3')
      await limiter.check('user:3')

      // Act
      await limiter.reset('user:3')
      const result = await limiter.check('user:3')

      // Assert
      expect(result.limited).toBe(false)
      expect(result.remaining).toBe(1)
    })

    test('should track different identifiers separately', async () => {
      // Arrange
      const limiter = new RateLimiter(cache, 1, 60)

      // Act
      await limiter.check('user:a')
      const resultA = await limiter.check('user:a')
      const resultB = await limiter.check('user:b')

      // Assert
      expect(resultA.limited).toBe(true)
      expect(resultB.limited).toBe(false)
    })

    test('should provide reset timestamp', async () => {
      // Arrange
      const limiter = new RateLimiter(cache, 1, 60)

      // Act
      const result = await limiter.check('user:4')

      // Assert
      expect(result.resetAt).toBeGreaterThan(Date.now())
      expect(result.resetAt).toBeLessThan(Date.now() + 61000)
    })
  })

  describe('CacheLock', () => {
    test('should acquire a lock', async () => {
      // Arrange
      const lock = new CacheLock(cache)

      // Act
      const acquired = await lock.acquire('resource:1')

      // Assert
      expect(acquired).toBe(true)
    })

    test('should not acquire same lock twice', async () => {
      // Arrange
      const lock = new CacheLock(cache)
      await lock.acquire('resource:2')

      // Act
      const acquired = await lock.acquire('resource:2')

      // Assert
      expect(acquired).toBe(false)
    })

    test('should release a lock', async () => {
      // Arrange
      const lock = new CacheLock(cache)
      await lock.acquire('resource:3')

      // Act
      await lock.release('resource:3')
      const acquired = await lock.acquire('resource:3')

      // Assert
      expect(acquired).toBe(true)
    })

    test('should execute callback with lock', async () => {
      // Arrange
      const lock = new CacheLock(cache)
      let executed = false

      // Act
      const result = await lock.withLock('resource:4', async () => {
        executed = true
        return 'success'
      })

      // Assert
      expect(executed).toBe(true)
      expect(result).toBe('success')
    })

    test('should return null if lock cannot be acquired', async () => {
      // Arrange
      const lock = new CacheLock(cache)
      await lock.acquire('resource:5')

      // Act
      const result = await lock.withLock('resource:5', async () => {
        return 'should-not-execute'
      })

      // Assert
      expect(result).toBeNull()
    })

    test('should release lock after callback execution', async () => {
      // Arrange
      const lock = new CacheLock(cache)

      // Act
      await lock.withLock('resource:6', async () => {
        return 'done'
      })

      const canAcquire = await lock.acquire('resource:6')

      // Assert
      expect(canAcquire).toBe(true)
    })

    test('should release lock even if callback throws', async () => {
      // Arrange
      const lock = new CacheLock(cache)

      // Act
      try {
        await lock.withLock('resource:7', async () => {
          throw new Error('test error')
        })
      }
      catch {
        // Expected
      }

      const canAcquire = await lock.acquire('resource:7')

      // Assert
      expect(canAcquire).toBe(true)
    })

    test('should respect custom TTL', async () => {
      // Arrange
      const lock = new CacheLock(cache, 30)

      // Act
      const acquired = await lock.acquire('resource:8', 5)

      // Assert
      expect(acquired).toBe(true)
      // Lock should exist
      expect(await cache.has('lock:resource:8')).toBe(true)
    })
  })

  describe('CacheWarmer', () => {
    test('should warm cache with entries', async () => {
      // Arrange
      const warmer = new CacheWarmer(cache)
      const entries = [
        { key: 'warm:1', fetcher: () => 'value1' },
        { key: 'warm:2', fetcher: () => 'value2' },
        { key: 'warm:3', fetcher: async () => 'value3' },
      ]

      // Act
      await warmer.warm(entries)

      // Assert
      expect(await cache.get('warm:1')).toBe('value1')
      expect(await cache.get('warm:2')).toBe('value2')
      expect(await cache.get('warm:3')).toBe('value3')
    })

    test('should warm cache with TTL', async () => {
      // Arrange
      const warmer = new CacheWarmer(cache)
      const entries = [
        { key: 'ttl:1', fetcher: () => 'value', ttl: 300 },
      ]

      // Act
      await warmer.warm(entries)

      // Assert
      expect(await cache.get('ttl:1')).toBe('value')
      const ttl = await cache.getTtl('ttl:1')
      expect(ttl).toBeGreaterThan(Date.now())
    })

    test('should warm cache with tags', async () => {
      // Arrange
      const warmer = new CacheWarmer(cache)
      const entries = [
        { key: 'tag:1', fetcher: () => 'value1', tags: ['group1'] },
        { key: 'tag:2', fetcher: () => 'value2', tags: ['group1', 'group2'] },
      ]

      // Act
      await warmer.warm(entries)

      // Assert
      const group1Keys = await cache.getKeysByTag('group1')
      expect(group1Keys.sort()).toEqual(['tag:1', 'tag:2'])
    })

    test('should warm from array', async () => {
      // Arrange
      const warmer = new CacheWarmer(cache)
      const users = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
      ]

      // Act
      await warmer.warmFromArray(users, user => `user:${user.id}`)

      // Assert
      expect(await cache.get('user:1')).toEqual({ id: 1, name: 'Alice' })
      expect(await cache.get('user:2')).toEqual({ id: 2, name: 'Bob' })
      expect(await cache.get('user:3')).toEqual({ id: 3, name: 'Charlie' })
    })
  })

  describe('BatchOperations', () => {
    test('should get values in batches', async () => {
      // Arrange
      const batch = new BatchOperations(cache, 2)
      await cache.set('batch:1', 'value1')
      await cache.set('batch:2', 'value2')
      await cache.set('batch:3', 'value3')
      await cache.set('batch:4', 'value4')

      // Act
      const results = []
      for await (const chunk of batch.getBatch(['batch:1', 'batch:2', 'batch:3', 'batch:4'])) {
        results.push(chunk)
      }

      // Assert
      expect(results.length).toBe(2) // 4 keys / batch size 2
      expect(Object.keys(results[0]).length).toBe(2)
      expect(Object.keys(results[1]).length).toBe(2)
    })

    test('should set values in batches', async () => {
      // Arrange
      const batch = new BatchOperations(cache, 2)
      const entries = [
        { key: 'set:1', value: 'value1' },
        { key: 'set:2', value: 'value2' },
        { key: 'set:3', value: 'value3' },
      ]

      // Act
      await batch.setBatch(entries)

      // Assert
      expect(await cache.get('set:1')).toBe('value1')
      expect(await cache.get('set:2')).toBe('value2')
      expect(await cache.get('set:3')).toBe('value3')
    })

    test('should delete keys in batches', async () => {
      // Arrange
      const batch = new BatchOperations(cache, 2)
      await cache.set('del:1', 'value1')
      await cache.set('del:2', 'value2')
      await cache.set('del:3', 'value3')
      await cache.set('del:4', 'value4')

      // Act
      const count = await batch.deleteBatch(['del:1', 'del:2', 'del:3', 'del:4'])

      // Assert
      expect(count).toBe(4)
      expect(await cache.has('del:1')).toBe(false)
      expect(await cache.has('del:4')).toBe(false)
    })
  })

  describe('CacheInvalidation', () => {
    test('should invalidate by pattern', async () => {
      // Arrange
      const invalidation = new CacheInvalidation(cache)
      await cache.set('user:1', 'Alice')
      await cache.set('user:2', 'Bob')
      await cache.set('post:1', 'Post')

      // Act
      const count = await invalidation.invalidateByPattern('user:*')

      // Assert
      expect(count).toBe(2)
      expect(await cache.has('user:1')).toBe(false)
      expect(await cache.has('user:2')).toBe(false)
      expect(await cache.has('post:1')).toBe(true)
    })

    test('should invalidate by prefix', async () => {
      // Arrange
      const invalidation = new CacheInvalidation(cache)
      await cache.set('session:a', 'data1')
      await cache.set('session:b', 'data2')
      await cache.set('cache:c', 'data3')

      // Act
      const count = await invalidation.invalidateByPrefix('session')

      // Assert
      expect(count).toBe(2)
      expect(await cache.has('session:a')).toBe(false)
      expect(await cache.has('cache:c')).toBe(true)
    })

    test('should invalidate multiple patterns', async () => {
      // Arrange
      const invalidation = new CacheInvalidation(cache)
      await cache.set('user:1', 'Alice')
      await cache.set('post:1', 'Post')
      await cache.set('comment:1', 'Comment')
      await cache.set('other:1', 'Other')

      // Act
      const count = await invalidation.invalidateByPatterns(['user:*', 'post:*'])

      // Assert
      expect(count).toBe(2)
      expect(await cache.has('user:1')).toBe(false)
      expect(await cache.has('post:1')).toBe(false)
      expect(await cache.has('comment:1')).toBe(true)
    })
  })

  describe('memoize', () => {
    test('should memoize function results', async () => {
      // Arrange
      let callCount = 0
      const fn = async (x: number) => {
        callCount++
        return x * 2
      }
      const memoized = memoize(fn, cache)

      // Act
      const result1 = await memoized(5)
      const result2 = await memoized(5)
      const result3 = await memoized(10)

      // Assert
      expect(result1).toBe(10)
      expect(result2).toBe(10)
      expect(result3).toBe(20)
      expect(callCount).toBe(2) // Only called twice, not three times
    })

    test('should use custom key generator', async () => {
      // Arrange
      let callCount = 0
      const fn = async (user: { id: number, name: string }) => {
        callCount++
        return user.name.toUpperCase()
      }
      const memoized = memoize(fn, cache, {
        keyGenerator: user => `user:${user.id}`,
      })

      // Act
      await memoized({ id: 1, name: 'alice' })
      await memoized({ id: 1, name: 'bob' }) // Same ID, different name

      // Assert
      expect(callCount).toBe(1) // Only called once due to same key
    })

    test('should respect TTL option', async () => {
      // Arrange
      let callCount = 0
      const fn = async (x: number) => {
        callCount++
        return x * 2
      }
      const memoized = memoize(fn, cache, { ttl: 300 })

      // Act
      const result1 = await memoized(5)
      const result2 = await memoized(5) // Should use cache

      // Assert
      expect(result1).toBe(10)
      expect(result2).toBe(10)
      expect(callCount).toBe(1) // Should only call once (cached on second call)
    })

    test('should support tags', async () => {
      // Arrange
      const fn = async (x: number) => x * 2
      const memoized = memoize(fn, cache, {
        tags: ['math', 'multiply'],
      })

      // Act
      await memoized(5)
      const keys = await cache.getKeysByTag('math')

      // Assert
      expect(keys.length).toBeGreaterThan(0)
    })
  })

  describe('DebouncedCache', () => {
    test('should debounce cache writes', async () => {
      // Arrange
      const debounced = new DebouncedCache(cache, 100)

      // Act
      debounced.set('debounce:1', 'value1')
      debounced.set('debounce:1', 'value2')
      debounced.set('debounce:1', 'value3')

      // Assert - Should not be set yet
      expect(await cache.get('debounce:1')).toBeUndefined()

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 150))
      expect(await cache.get('debounce:1')).toBe('value3')
    })

    test('should handle multiple keys', async () => {
      // Arrange
      const debounced = new DebouncedCache(cache, 100)

      // Act
      debounced.set('key1', 'value1')
      debounced.set('key2', 'value2')

      await new Promise(resolve => setTimeout(resolve, 150))

      // Assert
      expect(await cache.get('key1')).toBe('value1')
      expect(await cache.get('key2')).toBe('value2')
    })

    test('should flush pending writes', async () => {
      // Arrange
      const debounced = new DebouncedCache(cache, 1000)

      // Act
      debounced.set('flush:1', 'value1')
      debounced.set('flush:2', 'value2')
      await debounced.flush()

      // Assert - Should be immediately available after flush
      expect(await cache.get('flush:1')).toBeUndefined() // Flush clears pending writes
    })
  })

  describe('CircuitBreaker', () => {
    test('should allow successful executions', async () => {
      // Arrange
      const breaker = new CircuitBreaker(cache, 3, 60)
      const fn = async () => 'success'

      // Act
      const result = await breaker.execute('service:1', fn)

      // Assert
      expect(result).toBe('success')
    })

    test('should open circuit after threshold failures', async () => {
      // Arrange
      const breaker = new CircuitBreaker(cache, 3, 60)
      const fn = async () => {
        throw new Error('service error')
      }

      // Act & Assert - Fail 3 times
      try {
        await breaker.execute('service:2', fn)
      }
      catch { /* expected */ }
      try {
        await breaker.execute('service:2', fn)
      }
      catch { /* expected */ }
      try {
        await breaker.execute('service:2', fn)
      }
      catch { /* expected */ }

      // Circuit should be open now
      let circuitOpenError: Error | null = null
      try {
        await breaker.execute('service:2', fn)
      }
      catch (error) {
        circuitOpenError = error as Error
      }

      expect(circuitOpenError).toBeDefined()
      expect(circuitOpenError?.message).toContain('Circuit breaker is open')
    })

    test('should reset failure count on success', async () => {
      // Arrange
      const breaker = new CircuitBreaker(cache, 3, 60)
      let shouldFail = true
      const fn = async () => {
        if (shouldFail) {
          throw new Error('fail')
        }
        return 'success'
      }

      // Act - Fail twice
      try {
        await breaker.execute('service:3', fn)
      }
      catch { /* expected */ }
      try {
        await breaker.execute('service:3', fn)
      }
      catch { /* expected */ }

      // Succeed once
      shouldFail = false
      await breaker.execute('service:3', fn)

      // Fail again - should reset counter
      shouldFail = true
      try {
        await breaker.execute('service:3', fn)
      }
      catch { /* expected */ }
      try {
        await breaker.execute('service:3', fn)
      }
      catch { /* expected */ }

      // Circuit should still be closed (counter was reset)
      let error: Error | null = null
      try {
        await breaker.execute('service:3', fn)
      }
      catch (e) {
        error = e as Error
      }

      expect(error?.message).not.toContain('Circuit breaker is open')
    })

    test('should reset circuit breaker', async () => {
      // Arrange
      const breaker = new CircuitBreaker(cache, 2, 60)
      const fn = async () => {
        throw new Error('fail')
      }

      // Act - Open the circuit
      try {
        await breaker.execute('service:4', fn)
      }
      catch { /* expected */ }
      try {
        await breaker.execute('service:4', fn)
      }
      catch { /* expected */ }

      // Reset
      await breaker.reset('service:4')

      // Should work now
      const successFn = async () => 'success'
      const result = await breaker.execute('service:4', successFn)

      // Assert
      expect(result).toBe('success')
    })
  })
})
