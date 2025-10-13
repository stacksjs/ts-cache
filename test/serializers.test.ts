import { describe, expect, test } from 'bun:test'
import { Buffer } from 'node:buffer'
import {
  BooleanSerializer,
  JsonSerializer,
  NumberSerializer,
  StringSerializer,
} from '../src/serializers'

describe('Serializers', () => {
  describe('JsonSerializer', () => {
    const serializer = new JsonSerializer()

    test('should serialize object to JSON string', () => {
      // Arrange
      const obj = { name: 'test', value: 123, nested: { flag: true } }

      // Act
      const result = serializer.serialize(obj)

      // Assert
      expect(typeof result).toBe('string')
      expect(result).toBe(JSON.stringify(obj))
    })

    test('should deserialize JSON string to object', () => {
      // Arrange
      const jsonString = '{"name":"test","value":123}'

      // Act
      const result = serializer.deserialize(jsonString)

      // Assert
      expect(result).toEqual({ name: 'test', value: 123 })
    })

    test('should deserialize JSON Buffer to object', () => {
      // Arrange
      const jsonBuffer = Buffer.from('{"name":"test","value":123}')

      // Act
      const result = serializer.deserialize(jsonBuffer)

      // Assert
      expect(result).toEqual({ name: 'test', value: 123 })
    })

    test('should handle array serialization', () => {
      // Arrange
      const array = [1, 2, 'three', { four: 4 }]

      // Act
      const serialized = serializer.serialize(array)
      const deserialized = serializer.deserialize(serialized)

      // Assert
      expect(deserialized).toEqual(array)
    })

    test('should handle null values', () => {
      // Arrange
      const value = null

      // Act
      const serialized = serializer.serialize(value)
      const deserialized = serializer.deserialize(serialized)

      // Assert
      expect(deserialized).toBeNull()
    })

    test('should handle nested objects', () => {
      // Arrange
      const complex = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
              array: [1, 2, 3],
            },
          },
        },
      }

      // Act
      const serialized = serializer.serialize(complex)
      const deserialized = serializer.deserialize(serialized)

      // Assert
      expect(deserialized).toEqual(complex)
    })
  })

  describe('StringSerializer', () => {
    const serializer = new StringSerializer()

    test('should serialize string value', () => {
      // Arrange
      const value = 'test string'

      // Act
      const result = serializer.serialize(value)

      // Assert
      expect(result).toBe('test string')
    })

    test('should serialize non-string value to string', () => {
      // Arrange
      const number = 123
      const bool = true
      const obj = { test: 'value' }

      // Act & Assert
      expect(serializer.serialize(number)).toBe('123')
      expect(serializer.serialize(bool)).toBe('true')
      expect(serializer.serialize(obj)).toBe('[object Object]')
    })

    test('should deserialize string', () => {
      // Arrange
      const value = 'test string'

      // Act
      const result = serializer.deserialize(value)

      // Assert
      expect(result).toBe('test string')
    })

    test('should deserialize Buffer to string', () => {
      // Arrange
      const buffer = Buffer.from('buffer string')

      // Act
      const result = serializer.deserialize(buffer)

      // Assert
      expect(result).toBe('buffer string')
    })

    test('should handle empty string', () => {
      // Arrange
      const value = ''

      // Act
      const serialized = serializer.serialize(value)
      const deserialized = serializer.deserialize(serialized)

      // Assert
      expect(deserialized).toBe('')
    })

    test('should handle unicode characters', () => {
      // Arrange
      const value = 'Hello 世界 🌍'

      // Act
      const serialized = serializer.serialize(value)
      const deserialized = serializer.deserialize(serialized)

      // Assert
      expect(deserialized).toBe(value)
    })
  })

  describe('NumberSerializer', () => {
    const serializer = new NumberSerializer()

    test('should serialize integer number', () => {
      // Arrange
      const value = 123

      // Act
      const result = serializer.serialize(value)

      // Assert
      expect(result).toBe('123')
    })

    test('should serialize float number', () => {
      // Arrange
      const value = 123.456

      // Act
      const result = serializer.serialize(value)

      // Assert
      expect(result).toBe('123.456')
    })

    test('should serialize negative number', () => {
      // Arrange
      const value = -456

      // Act
      const result = serializer.serialize(value)

      // Assert
      expect(result).toBe('-456')
    })

    test('should deserialize string to number', () => {
      // Arrange
      const value = '789'

      // Act
      const result = serializer.deserialize(value)

      // Assert
      expect(result).toBe(789)
    })

    test('should deserialize Buffer to number', () => {
      // Arrange
      const buffer = Buffer.from('456.789')

      // Act
      const result = serializer.deserialize(buffer)

      // Assert
      expect(result).toBe(456.789)
    })

    test('should handle zero', () => {
      // Arrange
      const value = 0

      // Act
      const serialized = serializer.serialize(value)
      const deserialized = serializer.deserialize(serialized)

      // Assert
      expect(deserialized).toBe(0)
    })

    test('should handle scientific notation', () => {
      // Arrange
      const value = 1.23e10

      // Act
      const serialized = serializer.serialize(value)
      const deserialized = serializer.deserialize(serialized)

      // Assert
      expect(deserialized).toBe(value)
    })

    test('should handle Infinity', () => {
      // Arrange
      const value = Number.POSITIVE_INFINITY

      // Act
      const serialized = serializer.serialize(value)
      const deserialized = serializer.deserialize(serialized)

      // Assert
      expect(deserialized).toBe(Infinity)
    })

    test('should handle NaN', () => {
      // Arrange
      const value = Number.NaN

      // Act
      const serialized = serializer.serialize(value)
      const deserialized = serializer.deserialize(serialized)

      // Assert
      expect(Number.isNaN(deserialized)).toBe(true)
    })
  })

  describe('BooleanSerializer', () => {
    const serializer = new BooleanSerializer()

    test('should serialize true', () => {
      // Arrange
      const value = true

      // Act
      const result = serializer.serialize(value)

      // Assert
      expect(result).toBe('true')
    })

    test('should serialize false', () => {
      // Arrange
      const value = false

      // Act
      const result = serializer.serialize(value)

      // Assert
      expect(result).toBe('false')
    })

    test('should deserialize "true" string to true', () => {
      // Arrange
      const value = 'true'

      // Act
      const result = serializer.deserialize(value)

      // Assert
      expect(result).toBe(true)
    })

    test('should deserialize "false" string to false', () => {
      // Arrange
      const value = 'false'

      // Act
      const result = serializer.deserialize(value)

      // Assert
      expect(result).toBe(false)
    })

    test('should deserialize Buffer to boolean', () => {
      // Arrange
      const trueBuffer = Buffer.from('true')
      const falseBuffer = Buffer.from('false')

      // Act & Assert
      expect(serializer.deserialize(trueBuffer)).toBe(true)
      expect(serializer.deserialize(falseBuffer)).toBe(false)
    })

    test('should serialize truthy values as true', () => {
      // Arrange & Act & Assert
      expect(serializer.serialize(1)).toBe('true')
      expect(serializer.serialize('yes')).toBe('true')
      expect(serializer.serialize([])).toBe('true')
      expect(serializer.serialize({})).toBe('true')
    })

    test('should serialize falsy values as false', () => {
      // Arrange & Act & Assert
      expect(serializer.serialize(0)).toBe('false')
      expect(serializer.serialize('')).toBe('false')
      expect(serializer.serialize(null)).toBe('false')
      expect(serializer.serialize(undefined)).toBe('false')
    })

    test('should handle non-standard boolean strings', () => {
      // Arrange
      const value = 'not-a-boolean'

      // Act
      const result = serializer.deserialize(value)

      // Assert
      expect(result).toBe(false) // Any non-"true" string becomes false
    })

    test('should handle case sensitivity', () => {
      // Arrange
      const upperTrue = 'TRUE'
      const mixedFalse = 'False'

      // Act & Assert
      expect(serializer.deserialize(upperTrue)).toBe(false) // Not "true"
      expect(serializer.deserialize(mixedFalse)).toBe(false) // Not "true"
    })
  })

  describe('Serializer Round-trip', () => {
    test('JsonSerializer should handle round-trip', () => {
      // Arrange
      const serializer = new JsonSerializer()
      const data = {
        string: 'test',
        number: 123,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        nested: { a: 1, b: 2 },
      }

      // Act
      const serialized = serializer.serialize(data)
      const deserialized = serializer.deserialize(serialized)

      // Assert
      expect(deserialized).toEqual(data)
    })

    test('StringSerializer should handle round-trip', () => {
      // Arrange
      const serializer = new StringSerializer()
      const data = 'test string with special chars: @#$%'

      // Act
      const serialized = serializer.serialize(data)
      const deserialized = serializer.deserialize(serialized)

      // Assert
      expect(deserialized).toBe(data)
    })

    test('NumberSerializer should handle round-trip', () => {
      // Arrange
      const serializer = new NumberSerializer()
      const data = 123.456

      // Act
      const serialized = serializer.serialize(data)
      const deserialized = serializer.deserialize(serialized)

      // Assert
      expect(deserialized).toBe(data)
    })

    test('BooleanSerializer should handle round-trip', () => {
      // Arrange
      const serializer = new BooleanSerializer()

      // Act & Assert - true
      const serializedTrue = serializer.serialize(true)
      expect(serializer.deserialize(serializedTrue)).toBe(true)

      // Act & Assert - false
      const serializedFalse = serializer.serialize(false)
      expect(serializer.deserialize(serializedFalse)).toBe(false)
    })
  })

  describe('Buffer Handling', () => {
    test('all serializers should handle Buffer input', () => {
      // Arrange
      const json = new JsonSerializer()
      const string = new StringSerializer()
      const number = new NumberSerializer()
      const boolean = new BooleanSerializer()

      // Act & Assert
      expect(json.deserialize(Buffer.from('{"test":123}'))).toEqual({ test: 123 })
      expect(string.deserialize(Buffer.from('test'))).toBe('test')
      expect(number.deserialize(Buffer.from('456'))).toBe(456)
      expect(boolean.deserialize(Buffer.from('true'))).toBe(true)
    })

    test('should handle empty Buffer', () => {
      // Arrange
      const string = new StringSerializer()
      const emptyBuffer = Buffer.from('')

      // Act
      const result = string.deserialize(emptyBuffer)

      // Assert
      expect(result).toBe('')
    })

    test('should handle large Buffer', () => {
      // Arrange
      const string = new StringSerializer()
      const largeString = 'x'.repeat(10000)
      const largeBuffer = Buffer.from(largeString)

      // Act
      const result = string.deserialize(largeBuffer)

      // Assert
      expect(result).toBe(largeString)
      expect(result.length).toBe(10000)
    })
  })
})
