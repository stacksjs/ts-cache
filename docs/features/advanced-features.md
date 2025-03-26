# Advanced Features

Explore advanced features and configurations of the VAT calculator.

## Custom VAT Rules

Define custom VAT rules for specific scenarios:

```typescript
import { VatCalculator, VatRules } from 'ts-vat'

const customRules: VatRules = {
  DE: {
    standard: 19,
    reduced: 7,
    superReduced: null,
    categories: {
      books: 'reduced',
      ebooks: 'reduced',
      food: 'reduced'
    }
  }
}

const calculator = new VatCalculator({
  rules: customRules
})
```

## Custom Validation Service

Implement your own VAT number validation service:

```typescript
import { VatCalculator, VatValidationService } from 'ts-vat'

class CustomVatService implements VatValidationService {
  async validateVat(countryCode: string, vatNumber: string) {
    // Custom validation logic
    const response = await fetch('your-validation-api')
    const data = await response.json()

    return {
      isValid: data.valid,
      name: data.companyName,
      address: data.address,
      countryCode: data.country,
      vatNumber: data.vat,
      requestDate: new Date()
    }
  }
}

const calculator = new VatCalculator({
  validationService: new CustomVatService()
})
```

## Middleware Integration

### Express.js Middleware

```typescript
import express from 'express'
import { VatCalculator } from 'ts-vat'

const app = express()
const calculator = new VatCalculator()

async function vatMiddleware(req, res, next) {
  try {
    const { price, countryCode, vatNumber } = req.body

    // Validate VAT number if provided
    let isValidVat = false
    if (vatNumber) {
      isValidVat = await calculator.isValidVatNumber(vatNumber)
    }

    // Calculate price with VAT
    const priceWithVat = calculator.calculate(
      price,
      countryCode,
      null,
      isValidVat
    )

    req.vatCalculation = {
      netPrice: price,
      grossPrice: priceWithVat.gross,
      vatAmount: priceWithVat.vat,
      vatRate: priceWithVat.rate,
      isValidVat
    }

    next()
  }
  catch (error) {
    next(error)
  }
}

app.post('/calculate-price', vatMiddleware, (req, res) => {
  res.json(req.vatCalculation)
})
```

## Error Handling Strategies

### Custom Error Handler

```typescript
import {
  InvalidVatNumberException,
  VatCalculator,
  VatCalculatorException,
  VatCheckUnavailableException
} from 'ts-vat'

class VatErrorHandler {
  private calculator: VatCalculator
  private fallbackRate: number

  constructor(calculator: VatCalculator, fallbackRate = 20) {
    this.calculator = calculator
    this.fallbackRate = fallbackRate
  }

  async calculateWithFallback(
    amount: number,
    countryCode: string,
    vatNumber?: string
  ) {
    try {
      let isValidVat = false

      if (vatNumber) {
        try {
          isValidVat = await this.calculator.isValidVatNumber(vatNumber)
        }
        catch (error) {
          if (error instanceof VatCheckUnavailableException) {
            // Log the error and use cached result if available
            console.error('VAT validation service unavailable')
          }
          else if (error instanceof InvalidVatNumberException) {
            throw error // Re-throw invalid format errors
          }
        }
      }

      return this.calculator.calculate(amount, countryCode, null, isValidVat)
    }
    catch (error) {
      if (error instanceof VatCalculatorException) {
        // Use fallback rate for calculation errors
        console.error('Using fallback VAT rate:', this.fallbackRate)
        return {
          net: amount,
          gross: amount * (1 + this.fallbackRate / 100),
          vat: amount * (this.fallbackRate / 100),
          rate: this.fallbackRate
        }
      }
      throw error // Re-throw unknown errors
    }
  }
}
```

## Performance Optimization

### Caching Strategy

```typescript
import NodeCache from 'node-cache'
import { VatCalculator } from 'ts-vat'

class CachedVatCalculator {
  private calculator: VatCalculator
  private cache: NodeCache

  constructor() {
    this.calculator = new VatCalculator()
    this.cache = new NodeCache({ stdTTL: 3600 }) // 1 hour TTL
  }

  private getCacheKey(
    amount: number,
    countryCode: string,
    postalCode: string | null,
    isCompany: boolean
  ): string {
    return `vat:${amount}:${countryCode}:${postalCode}:${isCompany}`
  }

  async calculate(
    amount: number,
    countryCode: string,
    postalCode: string | null = null,
    isCompany = false
  ) {
    const cacheKey = this.getCacheKey(amount, countryCode, postalCode, isCompany)

    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Calculate and cache result
    const result = this.calculator.calculate(
      amount,
      countryCode,
      postalCode,
      isCompany
    )

    this.cache.set(cacheKey, result)
    return result
  }

  // Cache VAT number validation results
  private vatCache = new Map<string, {
    isValid: boolean
    timestamp: number
  }>()

  async isValidVatNumber(vatNumber: string): Promise<boolean> {
    const cached = this.vatCache.get(vatNumber)
    const now = Date.now()

    // Return cached result if less than 24 hours old
    if (cached && (now - cached.timestamp) < 24 * 60 * 60 * 1000) {
      return cached.isValid
    }

    const isValid = await this.calculator.isValidVatNumber(vatNumber)
    this.vatCache.set(vatNumber, { isValid, timestamp: now })
    return isValid
  }
}
```

## Testing Utilities

### Test Helpers

```typescript
import { VatCalculator } from 'ts-vat'

export class VatTestHelper {
  static createMockCalculator(options = {}) {
    return new VatCalculator({
      validateVatNumbers: false,
      ...options
    })
  }

  static createTestCases() {
    return [
      {
        amount: 100,
        countryCode: 'DE',
        expected: {
          net: 100,
          gross: 119,
          vat: 19,
          rate: 19
        }
      },
      // Add more test cases
    ]
  }

  static async runTestCases(calculator: VatCalculator, cases: any[]) {
    const results = []

    for (const testCase of cases) {
      const result = calculator.calculate(
        testCase.amount,
        testCase.countryCode
      )

      results.push({
        passed: JSON.stringify(result) === JSON.stringify(testCase.expected),
        testCase,
        result
      })
    }

    return results
  }
}
```

## Related Topics

- [VAT Calculation](./vat-calculation)
- [VAT Number Validation](./vat-validation)
- [Special Cases](./special-cases)
