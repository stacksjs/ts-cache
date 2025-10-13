import type { Serializer } from '../drivers/types'
import { Buffer } from 'node:buffer'

/**
 * JSON serializer for complex data types
 */
export class JsonSerializer implements Serializer {
  serialize(value: any): string {
    return JSON.stringify(value)
  }

  deserialize(data: string | Buffer): any {
    if (Buffer.isBuffer(data)) {
      data = data.toString()
    }
    return JSON.parse(data)
  }
}

/**
 * String serializer for plain text values
 */
export class StringSerializer implements Serializer {
  serialize(value: any): string {
    return String(value)
  }

  deserialize(data: string | Buffer): any {
    if (Buffer.isBuffer(data)) {
      return data.toString()
    }
    return data
  }
}

/**
 * Number serializer for numeric values
 */
export class NumberSerializer implements Serializer {
  serialize(value: any): string {
    return String(value)
  }

  deserialize(data: string | Buffer): any {
    if (Buffer.isBuffer(data)) {
      data = data.toString()
    }
    return Number(data)
  }
}

/**
 * Boolean serializer for boolean values
 */
export class BooleanSerializer implements Serializer {
  serialize(value: any): string {
    return value ? 'true' : 'false'
  }

  deserialize(data: string | Buffer): any {
    if (Buffer.isBuffer(data)) {
      data = data.toString()
    }
    return data === 'true'
  }
}

/**
 * Buffer serializer for binary data
 */
export class BufferSerializer implements Serializer {
  serialize(value: any): Buffer {
    if (Buffer.isBuffer(value)) {
      return value
    }
    return Buffer.from(String(value))
  }

  deserialize(data: Buffer | string): any {
    if (Buffer.isBuffer(data)) {
      return data
    }
    return Buffer.from(data)
  }
}

/**
 * MessagePack serializer for efficient binary serialization
 * Note: Requires msgpack library to be installed
 */
export class MessagePackSerializer implements Serializer {
  private encoder: any
  private decoder: any

  constructor() {
    try {
      // Try to import msgpack
      // eslint-disable-next-line ts/no-require-imports
      const msgpack = require('msgpack-lite')
      this.encoder = msgpack.encode
      this.decoder = msgpack.decode
    }
    catch {
      throw new Error('msgpack-lite is required for MessagePackSerializer. Install it with: bun add msgpack-lite')
    }
  }

  serialize(value: any): Buffer {
    return this.encoder(value)
  }

  deserialize(data: Buffer | string): any {
    if (typeof data === 'string') {
      data = Buffer.from(data)
    }
    return this.decoder(data)
  }
}

/**
 * Null serializer (no transformation)
 */
export class NullSerializer implements Serializer {
  serialize(value: any): any {
    return value
  }

  deserialize(data: any): any {
    return data
  }
}

/**
 * Composite serializer that automatically detects the type
 */
export class AutoSerializer implements Serializer {
  private jsonSerializer = new JsonSerializer()
  private stringSerializer = new StringSerializer()
  private numberSerializer = new NumberSerializer()
  private booleanSerializer = new BooleanSerializer()
  private bufferSerializer = new BufferSerializer()

  serialize(value: any): string | Buffer {
    const type = typeof value

    if (value === null || value === undefined) {
      return JSON.stringify({ __type: 'null', __value: null })
    }

    if (type === 'string') {
      return JSON.stringify({ __type: 'string', __value: value })
    }

    if (type === 'number') {
      return JSON.stringify({ __type: 'number', __value: value })
    }

    if (type === 'boolean') {
      return JSON.stringify({ __type: 'boolean', __value: value })
    }

    if (Buffer.isBuffer(value)) {
      return JSON.stringify({ __type: 'buffer', __value: value.toString('base64') })
    }

    if (value instanceof Date) {
      return JSON.stringify({ __type: 'date', __value: value.toISOString() })
    }

    if (value instanceof RegExp) {
      return JSON.stringify({ __type: 'regexp', __value: { source: value.source, flags: value.flags } })
    }

    if (value instanceof Set) {
      return JSON.stringify({ __type: 'set', __value: Array.from(value) })
    }

    if (value instanceof Map) {
      return JSON.stringify({ __type: 'map', __value: Array.from(value.entries()) })
    }

    // Default to JSON for objects and arrays
    return JSON.stringify({ __type: 'json', __value: value })
  }

  deserialize(data: string | Buffer): any {
    if (Buffer.isBuffer(data)) {
      data = data.toString()
    }

    try {
      const parsed = JSON.parse(data)

      if (!parsed.__type) {
        // Fallback for non-typed data
        return parsed
      }

      switch (parsed.__type) {
        case 'null':
          return null
        case 'string':
          return parsed.__value
        case 'number':
          return parsed.__value
        case 'boolean':
          return parsed.__value
        case 'buffer':
          return Buffer.from(parsed.__value, 'base64')
        case 'date':
          return new Date(parsed.__value)
        case 'regexp':
          return new RegExp(parsed.__value.source, parsed.__value.flags)
        case 'set':
          return new Set(parsed.__value)
        case 'map':
          return new Map(parsed.__value)
        case 'json':
          return parsed.__value
        default:
          return parsed.__value
      }
    }
    catch {
      // If parsing fails, return as-is
      return data
    }
  }
}

/**
 * Factory function to create serializers
 */
export function createSerializer(type: 'json' | 'string' | 'number' | 'boolean' | 'buffer' | 'msgpack' | 'auto' | 'null' = 'json'): Serializer {
  switch (type) {
    case 'json':
      return new JsonSerializer()
    case 'string':
      return new StringSerializer()
    case 'number':
      return new NumberSerializer()
    case 'boolean':
      return new BooleanSerializer()
    case 'buffer':
      return new BufferSerializer()
    case 'msgpack':
      return new MessagePackSerializer()
    case 'auto':
      return new AutoSerializer()
    case 'null':
      return new NullSerializer()
    default:
      return new JsonSerializer()
  }
}

// Export default serializers
export const serializers: Record<string, Serializer> = {
  json: new JsonSerializer(),
  string: new StringSerializer(),
  number: new NumberSerializer(),
  boolean: new BooleanSerializer(),
  buffer: new BufferSerializer(),
  auto: new AutoSerializer(),
  null: new NullSerializer(),
}
