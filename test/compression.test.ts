import { describe, expect, test } from 'bun:test'
import { Buffer } from 'node:buffer'
import {
  BrotliCompressor,
  createCompressor,
  GzipCompressor,
  NoCompressor,
  SmartCompressor,
} from '../src/compression'

describe('Compression', () => {
  describe('GzipCompressor', () => {
    test('should compress string data', () => {
      // Arrange
      const compressor = new GzipCompressor()
      const data = 'test data to compress'

      // Act
      const compressed = compressor.compress(data)

      // Assert
      expect(Buffer.isBuffer(compressed)).toBe(true)
      expect(compressed.length).toBeGreaterThan(0)
      expect(compressed.length).toBeLessThan(data.length + 50) // Some overhead allowed
    })

    test('should compress Buffer data', () => {
      // Arrange
      const compressor = new GzipCompressor()
      const data = Buffer.from('test data to compress')

      // Act
      const compressed = compressor.compress(data)

      // Assert
      expect(Buffer.isBuffer(compressed)).toBe(true)
      expect(compressed.length).toBeGreaterThan(0)
    })

    test('should decompress to original string', () => {
      // Arrange
      const compressor = new GzipCompressor()
      const original = 'test data to compress and decompress'

      // Act
      const compressed = compressor.compress(original)
      const decompressed = compressor.decompress(compressed)

      // Assert
      expect(decompressed).toBe(original)
    })

    test('should handle large data', () => {
      // Arrange
      const compressor = new GzipCompressor()
      const largeData = 'x'.repeat(10000)

      // Act
      const compressed = compressor.compress(largeData)
      const decompressed = compressor.decompress(compressed)

      // Assert
      expect(compressed.length).toBeLessThan(largeData.length)
      expect(decompressed).toBe(largeData)
    })

    test('should respect compression level', () => {
      // Arrange
      const lowLevel = new GzipCompressor(1)
      const highLevel = new GzipCompressor(9)
      const data = 'test data '.repeat(100)

      // Act
      const compressedLow = lowLevel.compress(data)
      const compressedHigh = highLevel.compress(data)

      // Assert
      expect(compressedHigh.length).toBeLessThanOrEqual(compressedLow.length)
    })

    test('should throw on invalid compression level', () => {
      // Act & Assert
      expect(() => new GzipCompressor(-1)).toThrow()
      expect(() => new GzipCompressor(10)).toThrow()
    })
  })

  describe('BrotliCompressor', () => {
    test('should compress string data', () => {
      // Arrange
      const compressor = new BrotliCompressor()
      const data = 'test data to compress with brotli'

      // Act
      const compressed = compressor.compress(data)

      // Assert
      expect(Buffer.isBuffer(compressed)).toBe(true)
      expect(compressed.length).toBeGreaterThan(0)
    })

    test('should compress Buffer data', () => {
      // Arrange
      const compressor = new BrotliCompressor()
      const data = Buffer.from('test data to compress with brotli')

      // Act
      const compressed = compressor.compress(data)

      // Assert
      expect(Buffer.isBuffer(compressed)).toBe(true)
      expect(compressed.length).toBeGreaterThan(0)
    })

    test('should decompress to original string', () => {
      // Arrange
      const compressor = new BrotliCompressor()
      const original = 'test brotli compression and decompression'

      // Act
      const compressed = compressor.compress(original)
      const decompressed = compressor.decompress(compressed)

      // Assert
      expect(decompressed).toBe(original)
    })

    test('should handle large data', () => {
      // Arrange
      const compressor = new BrotliCompressor()
      const largeData = 'brotli test '.repeat(1000)

      // Act
      const compressed = compressor.compress(largeData)
      const decompressed = compressor.decompress(compressed)

      // Assert
      expect(compressed.length).toBeLessThan(largeData.length)
      expect(decompressed).toBe(largeData)
    })

    test('should respect quality level', () => {
      // Arrange
      const lowQuality = new BrotliCompressor(1)
      const highQuality = new BrotliCompressor(11)
      const data = 'brotli quality test '.repeat(100)

      // Act
      const compressedLow = lowQuality.compress(data)
      const compressedHigh = highQuality.compress(data)

      // Assert
      // Higher quality should produce better compression
      expect(compressedHigh.length).toBeLessThanOrEqual(compressedLow.length)
    })

    test('should throw on invalid quality', () => {
      // Act & Assert
      expect(() => new BrotliCompressor(-1)).toThrow()
      expect(() => new BrotliCompressor(12)).toThrow()
    })
  })

  describe('NoCompressor', () => {
    test('should pass through string data', () => {
      // Arrange
      const compressor = new NoCompressor()
      const data = 'no compression test'

      // Act
      const result = compressor.compress(data)

      // Assert
      expect(Buffer.isBuffer(result)).toBe(true)
      expect(result.toString()).toBe(data)
    })

    test('should pass through Buffer data', () => {
      // Arrange
      const compressor = new NoCompressor()
      const data = Buffer.from('no compression buffer test')

      // Act
      const result = compressor.compress(data)

      // Assert
      expect(result).toEqual(data)
    })

    test('should decompress to original string', () => {
      // Arrange
      const compressor = new NoCompressor()
      const original = 'test no compression'

      // Act
      const compressed = compressor.compress(original)
      const decompressed = compressor.decompress(compressed)

      // Assert
      expect(decompressed).toBe(original)
    })
  })

  describe('SmartCompressor', () => {
    test('should not compress small data', () => {
      // Arrange
      const compressor = new SmartCompressor(new GzipCompressor(), 100)
      const smallData = 'small'

      // Act
      const result = compressor.compress(smallData)

      // Assert
      // Check marker byte (0 = uncompressed)
      expect(result[0]).toBe(0)
    })

    test('should compress large data', () => {
      // Arrange
      const compressor = new SmartCompressor(new GzipCompressor(), 100)
      const largeData = 'large data '.repeat(100)

      // Act
      const result = compressor.compress(largeData)

      // Assert
      // Check marker byte (1 = compressed)
      expect(result[0]).toBe(1)
      expect(result.length).toBeLessThan(largeData.length)
    })

    test('should decompress compressed data', () => {
      // Arrange
      const compressor = new SmartCompressor(new GzipCompressor(), 100)
      const original = 'smart compression test '.repeat(100)

      // Act
      const compressed = compressor.compress(original)
      const decompressed = compressor.decompress(compressed)

      // Assert
      expect(decompressed).toBe(original)
    })

    test('should decompress uncompressed data', () => {
      // Arrange
      const compressor = new SmartCompressor(new GzipCompressor(), 100)
      const original = 'tiny'

      // Act
      const compressed = compressor.compress(original)
      const decompressed = compressor.decompress(compressed)

      // Assert
      expect(decompressed).toBe(original)
    })

    test('should respect threshold', () => {
      // Arrange
      const lowThreshold = new SmartCompressor(new GzipCompressor(), 10)
      const highThreshold = new SmartCompressor(new GzipCompressor(), 1000)
      const data = 'test '.repeat(50) // ~250 bytes

      // Act
      const compressedLow = lowThreshold.compress(data)
      const compressedHigh = highThreshold.compress(data)

      // Assert
      expect(compressedLow[0]).toBe(1) // Should compress (above threshold)
      expect(compressedHigh[0]).toBe(0) // Should not compress (below threshold)
    })

    test('should not use compression if it increases size', () => {
      // Arrange
      const compressor = new SmartCompressor(new GzipCompressor(), 10)
      // Random data is typically hard to compress
      const randomData = Math.random().toString(36).substring(2, 15)

      // Act
      const result = compressor.compress(randomData)

      // Assert
      // Should either not compress or compress efficiently
      expect(result.length).toBeLessThanOrEqual(randomData.length + 50) // Some overhead is ok
    })

    test('should handle round-trip with mixed data', () => {
      // Arrange
      const compressor = new SmartCompressor(new GzipCompressor(), 100)
      const small = 'small'
      const large = 'large data '.repeat(200)

      // Act & Assert - small data
      const compressedSmall = compressor.compress(small)
      expect(compressor.decompress(compressedSmall)).toBe(small)

      // Act & Assert - large data
      const compressedLarge = compressor.compress(large)
      expect(compressor.decompress(compressedLarge)).toBe(large)
    })
  })

  describe('createCompressor factory', () => {
    test('should create GzipCompressor by default', () => {
      // Act
      const compressor = createCompressor()

      // Assert
      expect(compressor).toBeInstanceOf(GzipCompressor)
    })

    test('should create GzipCompressor with options', () => {
      // Act
      const compressor = createCompressor('gzip', { level: 5 })
      const data = 'test '.repeat(100)
      const compressed = compressor.compress(data)

      // Assert
      expect(compressor).toBeInstanceOf(GzipCompressor)
      expect(compressed.length).toBeLessThan(data.length)
    })

    test('should create BrotliCompressor', () => {
      // Act
      const compressor = createCompressor('brotli')

      // Assert
      expect(compressor).toBeInstanceOf(BrotliCompressor)
    })

    test('should create BrotliCompressor with options', () => {
      // Act
      const compressor = createCompressor('brotli', { quality: 8 })
      const data = 'test '.repeat(100)
      const compressed = compressor.compress(data)

      // Assert
      expect(compressor).toBeInstanceOf(BrotliCompressor)
      expect(compressed.length).toBeLessThan(data.length)
    })

    test('should create NoCompressor', () => {
      // Act
      const compressor = createCompressor('none')

      // Assert
      expect(compressor).toBeInstanceOf(NoCompressor)
    })

    test('should create SmartCompressor with gzip', () => {
      // Act
      const compressor = createCompressor('smart', { level: 6, threshold: 500 })

      // Assert
      expect(compressor).toBeInstanceOf(SmartCompressor)
    })

    test('should create SmartCompressor with brotli', () => {
      // Act
      const compressor = createCompressor('smart', { quality: 6, threshold: 500 })

      // Assert
      expect(compressor).toBeInstanceOf(SmartCompressor)
    })
  })

  describe('Compression Comparison', () => {
    test('should compare compression ratios', () => {
      // Arrange
      const gzip = new GzipCompressor()
      const brotli = new BrotliCompressor()
      const data = 'compression comparison test '.repeat(200)

      // Act
      const gzipCompressed = gzip.compress(data)
      const brotliCompressed = brotli.compress(data)

      // Assert - Both should compress significantly
      expect(gzipCompressed.length).toBeLessThan(data.length)
      expect(brotliCompressed.length).toBeLessThan(data.length)

      // Brotli typically compresses better or similar to gzip
      expect(brotliCompressed.length).toBeLessThanOrEqual(gzipCompressed.length * 1.1)
    })

    test('should handle incompressible data', () => {
      // Arrange
      const gzip = new GzipCompressor()
      const brotli = new BrotliCompressor()
      // Random binary-like data
      const random = Array.from({ length: 100 }, () => Math.floor(Math.random() * 256))
      const data = Buffer.from(random)

      // Act
      const gzipCompressed = gzip.compress(data)
      const brotliCompressed = brotli.compress(data)

      // Assert - Should still work, even if not much compression
      expect(Buffer.isBuffer(gzipCompressed)).toBe(true)
      expect(Buffer.isBuffer(brotliCompressed)).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    test('should handle empty string', () => {
      // Arrange
      const compressor = new GzipCompressor()
      const empty = ''

      // Act
      const compressed = compressor.compress(empty)
      const decompressed = compressor.decompress(compressed)

      // Assert
      expect(decompressed).toBe(empty)
    })

    test('should handle single character', () => {
      // Arrange
      const compressor = new GzipCompressor()
      const single = 'x'

      // Act
      const compressed = compressor.compress(single)
      const decompressed = compressor.decompress(compressed)

      // Assert
      expect(decompressed).toBe(single)
    })

    test('should handle unicode characters', () => {
      // Arrange
      const compressor = new GzipCompressor()
      const unicode = '你好世界 🌍 Hello'

      // Act
      const compressed = compressor.compress(unicode)
      const decompressed = compressor.decompress(compressed)

      // Assert
      expect(decompressed).toBe(unicode)
    })

    test('should handle special characters', () => {
      // Arrange
      const compressor = new BrotliCompressor()
      const special = '!@#$%^&*()_+-=[]{}|;:",.<>?/~`'

      // Act
      const compressed = compressor.compress(special)
      const decompressed = compressor.decompress(compressed)

      // Assert
      expect(decompressed).toBe(special)
    })

    test('should handle repeated patterns', () => {
      // Arrange
      const compressor = new GzipCompressor()
      const repeated = 'aaaaaaaaaa'.repeat(100)

      // Act
      const compressed = compressor.compress(repeated)
      const decompressed = compressor.decompress(compressed)

      // Assert
      expect(compressed.length).toBeLessThan(repeated.length / 10) // Should compress very well
      expect(decompressed).toBe(repeated)
    })
  })
})
