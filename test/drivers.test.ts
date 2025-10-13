import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { MemoryDriver } from '../src/drivers/memory'
import { MemoryLRUDriver } from '../src/drivers/memory-lru'

describe('MemoryDriver', () => {
  let driver: MemoryDriver

  beforeEach(() => {
    driver = new MemoryDriver({
      stdTTL: 60,
      checkPeriod: 0,
    })
  })

  afterEach(async () => {
    await driver.flush()
    await driver.close()
  })

  describe('Core Operations', () => {
    test('should set and get a value', async () => {
      // Act
      await driver.set('key', 'value')
      const result = await driver.get('key')

      // Assert
      expect(result).toBe('value')
    })

    test('should return undefined for non-existent keys', async () => {
      // Act
      const result = await driver.get('non-existent')

      // Assert
      expect(result).toBeUndefined()
    })

    test('should check if key exists', async () => {
      // Arrange
      await driver.set('exists', 'value')

      // Act & Assert
      expect(await driver.has('exists')).toBe(true)
      expect(await driver.has('missing')).toBe(false)
    })

    test('should delete a key', async () => {
      // Arrange
      await driver.set('to-delete', 'value')

      // Act
      const count = await driver.del('to-delete')

      // Assert
      expect(count).toBe(1)
      expect(await driver.has('to-delete')).toBe(false)
    })

    test('should delete multiple keys', async () => {
      // Arrange
      await driver.set('key1', 'value1')
      await driver.set('key2', 'value2')
      await driver.set('key3', 'value3')

      // Act
      const count = await driver.del(['key1', 'key2'])

      // Assert
      expect(count).toBe(2)
      expect(await driver.has('key1')).toBe(false)
      expect(await driver.has('key2')).toBe(false)
      expect(await driver.has('key3')).toBe(true)
    })
  })

  describe('Batch Operations', () => {
    test('should mget multiple values', async () => {
      // Arrange
      await driver.set('a', 'value-a')
      await driver.set('b', 'value-b')
      await driver.set('c', 'value-c')

      // Act
      const result = await driver.mget(['a', 'b', 'missing'])

      // Assert
      expect(result).toEqual({
        a: 'value-a',
        b: 'value-b',
      })
    })

    test('should mset multiple values', async () => {
      // Arrange
      const entries = [
        { key: 'x', value: 'value-x' },
        { key: 'y', value: 'value-y' },
        { key: 'z', value: 'value-z', ttl: 300 },
      ]

      // Act
      await driver.mset(entries)

      // Assert
      expect(await driver.get('x')).toBe('value-x')
      expect(await driver.get('y')).toBe('value-y')
      expect(await driver.get('z')).toBe('value-z')
    })
  })

  describe('TTL Operations', () => {
    test('should expire keys after TTL', async () => {
      // Arrange
      await driver.set('expires', 'value', 1)

      // Act & Assert
      expect(await driver.get('expires')).toBe('value')

      await new Promise(resolve => setTimeout(resolve, 1100))
      expect(await driver.get('expires')).toBeUndefined()
    })

    test('should get TTL for a key', async () => {
      // Arrange
      await driver.set('ttl-key', 'value', 300)

      // Act
      const ttl = await driver.getTtl('ttl-key')

      // Assert
      expect(typeof ttl).toBe('number')
      expect(ttl).toBeGreaterThan(Date.now())
    })

    test('should update TTL', async () => {
      // Arrange
      await driver.set('update', 'value', 60)
      const oldTtl = await driver.getTtl('update')

      // Act
      await driver.ttl('update', 300)
      const newTtl = await driver.getTtl('update')

      // Assert
      expect(newTtl).toBeGreaterThan(oldTtl!)
    })
  })

  describe('Key Operations', () => {
    test('should get all keys', async () => {
      // Arrange
      await driver.set('key1', 'value1')
      await driver.set('key2', 'value2')
      await driver.set('key3', 'value3')

      // Act
      const keys = await driver.keys()

      // Assert
      expect(keys.sort()).toEqual(['key1', 'key2', 'key3'])
    })

    test('should get keys by pattern', async () => {
      // Arrange
      await driver.set('user:1', 'Alice')
      await driver.set('user:2', 'Bob')
      await driver.set('post:1', 'Post')

      // Act
      const keys = await driver.keys('user:*')

      // Assert
      expect(keys.sort()).toEqual(['user:1', 'user:2'])
    })
  })

  describe('Tag Operations', () => {
    test('should tag keys', async () => {
      // Arrange
      await driver.set('key1', 'value1')
      await driver.set('key2', 'value2')

      // Act
      await driver.tag!('key1', ['tag1', 'tag2'])
      await driver.tag!('key2', ['tag1'])

      // Assert
      const keys = await driver.getKeysByTag!('tag1')
      expect(keys.sort()).toEqual(['key1', 'key2'])
    })

    test('should delete by tag', async () => {
      // Arrange
      await driver.set('a', 'value-a')
      await driver.set('b', 'value-b')
      await driver.set('c', 'value-c')

      await driver.tag!('a', ['delete-me'])
      await driver.tag!('b', ['delete-me'])

      // Act
      const count = await driver.deleteByTag!('delete-me')

      // Assert
      expect(count).toBe(2)
      expect(await driver.has('a')).toBe(false)
      expect(await driver.has('b')).toBe(false)
      expect(await driver.has('c')).toBe(true)
    })
  })

  describe('Statistics', () => {
    test('should track statistics', async () => {
      // Arrange
      await driver.set('key1', 'value1')
      await driver.set('key2', 'value2')
      await driver.get('key1')
      await driver.get('missing')

      // Act
      const stats = await driver.getStats()

      // Assert
      expect(stats.keys).toBe(2)
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(1)
    })
  })

  describe('Prefix Support', () => {
    test('should support key prefix', async () => {
      // Arrange
      const prefixDriver = new MemoryDriver({ prefix: 'test' })

      // Act
      await prefixDriver.set('key', 'value')
      const keys = await prefixDriver.keys()

      // Assert
      expect(keys).toEqual(['key'])
      expect(await prefixDriver.get('key')).toBe('value')

      await prefixDriver.close()
    })
  })

  describe('Clone Behavior', () => {
    test('should clone values by default', async () => {
      // Arrange
      const obj = { count: 1 }
      await driver.set('obj', obj)

      // Act
      const retrieved = await driver.get<{ count: number }>('obj')
      if (retrieved) {
        retrieved.count = 2
      }

      // Assert
      const cached = await driver.get<{ count: number }>('obj')
      expect(cached?.count).toBe(1) // Should be unchanged
    })

    test('should not clone when useClones is false', async () => {
      // Arrange
      const noCloneDriver = new MemoryDriver({ useClones: false })
      const obj = { count: 1 }
      await noCloneDriver.set('obj', obj)

      // Act
      const retrieved = await noCloneDriver.get<{ count: number }>('obj')
      if (retrieved) {
        retrieved.count = 2
      }

      // Assert
      const cached = await noCloneDriver.get<{ count: number }>('obj')
      expect(cached?.count).toBe(2) // Should be changed

      await noCloneDriver.close()
    })
  })
})

describe('MemoryLRUDriver', () => {
  let driver: MemoryLRUDriver

  beforeEach(() => {
    driver = new MemoryLRUDriver({
      maxKeys: 3,
      stdTTL: 60,
    })
  })

  afterEach(async () => {
    await driver.flush()
    await driver.close()
  })

  describe('LRU Eviction', () => {
    test('should evict least recently used key when max is reached', async () => {
      // Arrange
      await driver.set('key1', 'value1')
      await driver.set('key2', 'value2')
      await driver.set('key3', 'value3')

      // Act - Access key1 to make it recently used
      await driver.get('key1')

      // Add a new key, should evict key2 (least recently used)
      await driver.set('key4', 'value4')

      // Assert
      expect(await driver.has('key1')).toBe(true)
      expect(await driver.has('key2')).toBe(false) // Evicted
      expect(await driver.has('key3')).toBe(true)
      expect(await driver.has('key4')).toBe(true)
    })

    test('should update access order on get', async () => {
      // Arrange
      await driver.set('a', 'value-a')
      await driver.set('b', 'value-b')
      await driver.set('c', 'value-c')

      // Act - Access 'a' to make it most recently used
      await driver.get('a')
      await driver.get('b')

      // Add new key, should evict 'c'
      await driver.set('d', 'value-d')

      // Assert
      expect(await driver.has('a')).toBe(true)
      expect(await driver.has('b')).toBe(true)
      expect(await driver.has('c')).toBe(false) // Evicted
      expect(await driver.has('d')).toBe(true)
    })

    test('should update access order on set', async () => {
      // Arrange
      await driver.set('x', 'value1')
      await driver.set('y', 'value2')
      await driver.set('z', 'value3')

      // Act - Update 'x' to make it most recently used
      await driver.set('x', 'updated')

      // Add new key, should evict 'y'
      await driver.set('w', 'value4')

      // Assert
      expect(await driver.has('x')).toBe(true)
      expect(await driver.has('y')).toBe(false) // Evicted
      expect(await driver.has('z')).toBe(true)
      expect(await driver.has('w')).toBe(true)
    })
  })

  describe('Core Operations', () => {
    test('should work with basic get/set operations', async () => {
      // Act
      await driver.set('key', 'value')
      const result = await driver.get('key')

      // Assert
      expect(result).toBe('value')
    })

    test('should handle batch operations', async () => {
      // Act
      await driver.mset([
        { key: 'a', value: 'value-a' },
        { key: 'b', value: 'value-b' },
      ])

      const result = await driver.mget(['a', 'b'])

      // Assert
      expect(result).toEqual({
        a: 'value-a',
        b: 'value-b',
      })
    })
  })

  describe('Statistics', () => {
    test('should track LRU statistics', async () => {
      // Arrange
      await driver.set('key1', 'value1')
      await driver.set('key2', 'value2')
      await driver.get('key1')

      // Act
      const stats = await driver.getStats()

      // Assert
      expect(stats.keys).toBeGreaterThanOrEqual(2)
      expect(stats.hits).toBeGreaterThanOrEqual(1)
    })
  })
})
