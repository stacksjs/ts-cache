import { Buffer } from 'node:buffer'
import { gunzipSync, gzipSync } from 'node:zlib'

/**
 * Compression interface
 */
export interface Compressor {
  /**
   * Compress data
   */
  compress: (data: string | Buffer) => Buffer

  /**
   * Decompress data
   */
  decompress: (data: Buffer) => string | Buffer
}

/**
 * Gzip compression
 */
export class GzipCompressor implements Compressor {
  constructor(private level: number = 6) {
    if (level < 0 || level > 9) {
      throw new Error('Gzip compression level must be between 0 and 9')
    }
  }

  compress(data: string | Buffer): Buffer {
    const input = typeof data === 'string' ? Buffer.from(data) : data
    return gzipSync(input, { level: this.level })
  }

  decompress(data: Buffer): string {
    return gunzipSync(data).toString()
  }
}

/**
 * Brotli compression (Bun native)
 */
export class BrotliCompressor implements Compressor {
  constructor(private quality: number = 6) {
    if (quality < 0 || quality > 11) {
      throw new Error('Brotli quality must be between 0 and 11')
    }
  }

  compress(data: string | Buffer): Buffer {
    const input = typeof data === 'string' ? Buffer.from(data) : data
    // Use Node.js brotli (Bun doesn't have stable brotli support yet)
    // eslint-disable-next-line ts/no-require-imports
    const { brotliCompressSync, constants } = require('node:zlib')
    return brotliCompressSync(input, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: this.quality,
      },
    })
  }

  decompress(data: Buffer): string {
    // Use Node.js brotli (Bun doesn't have stable brotli support yet)
    // eslint-disable-next-line ts/no-require-imports
    const { brotliDecompressSync } = require('node:zlib')
    return brotliDecompressSync(data).toString()
  }
}

/**
 * No compression (passthrough)
 */
export class NoCompressor implements Compressor {
  compress(data: string | Buffer): Buffer {
    return typeof data === 'string' ? Buffer.from(data) : data
  }

  decompress(data: Buffer): string {
    return data.toString()
  }
}

/**
 * Smart compressor that only compresses if it reduces size
 */
export class SmartCompressor implements Compressor {
  private compressor: Compressor

  constructor(
    compressor: Compressor = new GzipCompressor(),
    private threshold: number = 1024, // Only compress if > 1KB
  ) {
    this.compressor = compressor
  }

  compress(data: string | Buffer): Buffer {
    const input = typeof data === 'string' ? Buffer.from(data) : data

    // Don't compress small data
    if (input.length < this.threshold) {
      // Add marker to indicate uncompressed
      return Buffer.concat([Buffer.from([0]), input])
    }

    const compressed = this.compressor.compress(input)

    // Only use compression if it actually reduces size
    if (compressed.length < input.length) {
      // Add marker to indicate compressed
      return Buffer.concat([Buffer.from([1]), compressed])
    }

    // Use uncompressed version
    return Buffer.concat([Buffer.from([0]), input])
  }

  decompress(data: Buffer): string | Buffer {
    const marker = data[0]
    const payload = data.subarray(1)

    if (marker === 1) {
      // Data is compressed
      const result = this.compressor.decompress(payload)
      return typeof result === 'string' ? result : result.toString()
    }

    // Data is not compressed
    return payload.toString()
  }
}

/**
 * Factory function to create compressors
 */
export function createCompressor(
  type: 'gzip' | 'brotli' | 'none' | 'smart' = 'gzip',
  options: { level?: number, quality?: number, threshold?: number } = {},
): Compressor {
  switch (type) {
    case 'gzip':
      return new GzipCompressor(options.level)
    case 'brotli':
      return new BrotliCompressor(options.quality)
    case 'smart':
      return new SmartCompressor(
        options.quality !== undefined
          ? new BrotliCompressor(options.quality)
          : new GzipCompressor(options.level),
        options.threshold,
      )
    case 'none':
      return new NoCompressor()
    default:
      return new GzipCompressor()
  }
}

/**
 * Export default compressors
 */
export const compressors: {
  gzip: GzipCompressor
  brotli: BrotliCompressor
  smart: SmartCompressor
  none: NoCompressor
} = {
  gzip: new GzipCompressor(),
  brotli: new BrotliCompressor(),
  smart: new SmartCompressor(),
  none: new NoCompressor(),
}
