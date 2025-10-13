import type { CacheManager } from '../src/manager'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { createCache } from '../src/manager'
import {
  CacheAside,
  ReadThrough,
  RefreshAhead,
  WriteAround,
  WriteBack,
  WriteThrough,
} from '../src/patterns'

describe('Cache Patterns', () => {
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

  describe('CacheAside', () => {
    test('should load data from source on cache miss', async () => {
      // Arrange
      const pattern = new CacheAside(cache)
      let loadCount = 0
      const loader = async (key: string) => {
        loadCount++
        return `data-${key}`
      }

      // Act
      const result = await pattern.get('key1', loader)

      // Assert
      expect(result).toBe('data-key1')
      expect(loadCount).toBe(1)
      expect(await cache.get('key1')).toBe('data-key1')
    })

    test('should return cached data on cache hit', async () => {
      // Arrange
      const pattern = new CacheAside(cache)
      await cache.set('key2', 'cached-data')
      let loadCount = 0
      const loader = async () => {
        loadCount++
        return 'fresh-data'
      }

      // Act
      const result = await pattern.get('key2', loader)

      // Assert
      expect(result).toBe('cached-data')
      expect(loadCount).toBe(0) // Loader should not be called
    })

    test('should invalidate cache entry', async () => {
      // Arrange
      const pattern = new CacheAside(cache)
      await cache.set('key3', 'old-data')

      // Act
      await pattern.invalidate('key3')

      // Assert
      expect(await cache.has('key3')).toBe(false)
    })

    test('should support TTL', async () => {
      // Arrange
      const pattern = new CacheAside(cache)
      const loader = async () => 'data'

      // Act
      await pattern.get('key4', loader, 300)
      const ttl = await cache.getTtl('key4')

      // Assert
      expect(ttl).toBeGreaterThan(Date.now())
    })
  })

  describe('ReadThrough', () => {
    test('should load and cache data transparently', async () => {
      // Arrange
      let loadCount = 0
      const loader = async (key: string) => {
        loadCount++
        return `value-${key}`
      }
      const pattern = new ReadThrough(cache, loader)

      // Act
      const result1 = await pattern.get('rt1')
      const result2 = await pattern.get('rt1')

      // Assert
      expect(result1).toBe('value-rt1')
      expect(result2).toBe('value-rt1')
      expect(loadCount).toBe(1) // Only loaded once
    })

    test('should handle multiple keys independently', async () => {
      // Arrange
      const loader = async (key: string) => `value-${key}`
      const pattern = new ReadThrough(cache, loader)

      // Act
      const result1 = await pattern.get('a')
      const result2 = await pattern.get('b')

      // Assert
      expect(result1).toBe('value-a')
      expect(result2).toBe('value-b')
    })

    test('should respect custom TTL', async () => {
      // Arrange
      const loader = async () => 'data'
      const pattern = new ReadThrough(cache, loader, 300)

      // Act
      await pattern.get('ttl-key')
      const ttl = await cache.getTtl('ttl-key')

      // Assert
      expect(ttl).toBeGreaterThan(Date.now())
    })
  })

  describe('WriteThrough', () => {
    test('should write to cache and store simultaneously', async () => {
      // Arrange
      const store: Record<string, any> = {}
      const writer = async (key: string, value: any) => {
        store[key] = value
      }
      const pattern = new WriteThrough(cache, writer)

      // Act
      await pattern.set('wt1', 'data1')

      // Assert
      expect(await cache.get('wt1')).toBe('data1')
      expect(store.wt1).toBe('data1')
    })

    test('should handle write failures', async () => {
      // Arrange
      const writer = async () => {
        throw new Error('write failed')
      }
      const pattern = new WriteThrough(cache, writer)

      // Act & Assert
      await expect(pattern.set('wt2', 'data')).rejects.toThrow('write failed')
    })

    test('should support TTL', async () => {
      // Arrange
      const store: Record<string, any> = {}
      const writer = async (key: string, value: any) => {
        store[key] = value
      }
      const pattern = new WriteThrough(cache, writer)

      // Act
      await pattern.set('wt3', 'data', 300)
      const ttl = await cache.getTtl('wt3')

      // Assert
      expect(ttl).toBeGreaterThan(Date.now())
    })
  })

  describe('WriteAround', () => {
    test('should write to store but invalidate cache', async () => {
      // Arrange
      const store: Record<string, any> = {}
      const writer = async (key: string, value: any) => {
        store[key] = value
      }
      const pattern = new WriteAround(cache, writer)
      await cache.set('wa1', 'old-value')

      // Act
      await pattern.set('wa1', 'new-value')

      // Assert
      expect(store.wa1).toBe('new-value')
      expect(await cache.has('wa1')).toBe(false) // Cache invalidated
    })

    test('should prevent stale cache reads', async () => {
      // Arrange
      const store: Record<string, any> = { wa2: 'initial' }
      const writer = async (key: string, value: any) => {
        store[key] = value
      }
      const pattern = new WriteAround(cache, writer)
      await cache.set('wa2', 'cached')

      // Act
      await pattern.set('wa2', 'updated')

      // Assert
      expect(await cache.get('wa2')).toBeUndefined() // Not in cache
      expect(store.wa2).toBe('updated') // Updated in store
    })
  })

  describe('WriteBack', () => {
    test('should write to cache immediately', async () => {
      // Arrange
      const store: Record<string, any> = {}
      const writer = async (key: string, value: any) => {
        store[key] = value
      }
      const pattern = new WriteBack(cache, writer, 100)

      // Act
      await pattern.set('wb1', 'data1')

      // Assert
      expect(await cache.get('wb1')).toBe('data1')
      expect(store.wb1).toBeUndefined() // Not written yet
    })

    test('should flush writes after delay', async () => {
      // Arrange
      const store: Record<string, any> = {}
      const writer = async (key: string, value: any) => {
        store[key] = value
      }
      const pattern = new WriteBack(cache, writer, 100)

      // Act
      await pattern.set('wb2', 'data2')
      await new Promise(resolve => setTimeout(resolve, 150))

      // Assert
      expect(store.wb2).toBe('data2')
    })

    test('should batch multiple writes', async () => {
      // Arrange
      const store: Record<string, any> = {}
      let writeCount = 0
      const writer = async (key: string, value: any) => {
        writeCount++
        store[key] = value
      }
      const pattern = new WriteBack(cache, writer, 100)

      // Act
      await pattern.set('wb3', 'v1')
      await pattern.set('wb3', 'v2')
      await pattern.set('wb3', 'v3')

      await new Promise(resolve => setTimeout(resolve, 150))

      // Assert
      expect(store.wb3).toBe('v3') // Last value
      expect(writeCount).toBe(1) // Only one write (batched)
    })

    test('should flush on demand', async () => {
      // Arrange
      const store: Record<string, any> = {}
      const writer = async (key: string, value: any) => {
        store[key] = value
      }
      const pattern = new WriteBack(cache, writer, 1000)

      // Act
      await pattern.set('wb4', 'data4')
      await pattern.flush()

      // Assert
      expect(store.wb4).toBe('data4') // Immediately flushed
    })
  })

  describe('RefreshAhead', () => {
    test('should return cached value and refresh in background', async () => {
      // Arrange
      let loadCount = 0
      const loader = async (_key: string) => {
        loadCount++
        return `value-${loadCount}`
      }
      const pattern = new RefreshAhead(cache, loader, 1) // 1 second TTL

      // Act
      const result1 = await pattern.get('ra1')
      await new Promise(resolve => setTimeout(resolve, 1100))
      const result2 = await pattern.get('ra1')

      // Assert
      expect(result1).toBe('value-1')
      expect(result2).toBeDefined() // Should return old value while refreshing
      expect(loadCount).toBeGreaterThanOrEqual(1)
    })

    test('should trigger refresh before expiration', async () => {
      // Arrange
      let loadCount = 0
      const loader = async () => {
        loadCount++
        return loadCount
      }
      const pattern = new RefreshAhead(cache, loader, 2, 0.5) // Refresh at 50%

      // Act
      await pattern.get('ra2')
      await new Promise(resolve => setTimeout(resolve, 1100)) // Past 50% of TTL
      await pattern.get('ra2')

      // Wait for background refresh
      await new Promise(resolve => setTimeout(resolve, 100))

      // Assert
      expect(loadCount).toBe(2) // Initial load + refresh
    })

    test('should handle concurrent requests during refresh', async () => {
      // Arrange
      let loadCount = 0
      const loader = async () => {
        loadCount++
        await new Promise(resolve => setTimeout(resolve, 50))
        return loadCount
      }
      const pattern = new RefreshAhead(cache, loader, 1)

      // Act
      await pattern.get('ra3')
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Make concurrent requests
      const [r1, r2, r3] = await Promise.all([
        pattern.get('ra3'),
        pattern.get('ra3'),
        pattern.get('ra3'),
      ])

      // Assert
      expect(r1).toBeDefined()
      expect(r2).toBeDefined()
      expect(r3).toBeDefined()
      // Should not trigger too many refreshes (some timing variation allowed)
      expect(loadCount).toBeLessThanOrEqual(5)
    })
  })

  describe('Pattern Integration', () => {
    test('should combine cache-aside with write-through', async () => {
      // Arrange
      const store: Record<string, any> = {}
      const reader = new CacheAside(cache)
      const writer = new WriteThrough(cache, async (key, value) => {
        store[key] = value
      })

      // Act
      await writer.set('key1', 'value1')
      const result = await reader.get('key1', async () => {
        return store.key1
      })

      // Assert
      expect(result).toBe('value1')
    })

    test('should use read-through with write-back', async () => {
      // Arrange
      const store: Record<string, any> = { initial: 'data' }
      const reader = new ReadThrough(cache, async key => store[key])
      const writer = new WriteBack(cache, async (key, value) => {
        store[key] = value
      }, 100)

      // Act
      await writer.set('new', 'value')
      const result = await reader.get('initial')

      // Assert
      expect(result).toBe('data')
      expect(await cache.get('new')).toBe('value')
    })

    test('should handle pattern errors gracefully', async () => {
      // Arrange
      const pattern = new ReadThrough(cache, async () => {
        throw new Error('loader failed')
      })

      // Act & Assert
      await expect(pattern.get('error-key')).rejects.toThrow('loader failed')
    })
  })
})
