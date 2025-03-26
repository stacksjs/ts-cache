# VAT Number Validation

Learn how to validate EU VAT numbers using the VIES service.

## Basic Validation

```typescript
import { VatCalculator } from 'ts-vat'

const calculator = new VatCalculator()

// Simple validation
const isValid = await calculator.isValidVatNumber('DE123456789')
```

## Detailed Validation

Get comprehensive information about a VAT number:

```typescript
const details = await calculator.getVatDetails('NL123456789B01')
console.log(details)
// {
//   isValid: true,
//   name: "Example Company BV",
//   address: "Example Street 123, Amsterdam",
//   countryCode: "NL",
//   vatNumber: "123456789B01",
//   isCompany: true
// }
```

## Format Validation

Each country has specific VAT number formats:

```typescript
// Valid formats per country
const examples = {
  AT: 'ATU12345678', // Austria
  BE: 'BE0123456789', // Belgium
  DE: 'DE123456789', // Germany
  FR: 'FR12345678901', // France
  GB: 'GB123456789', // UK
  NL: 'NL123456789B01', // Netherlands
}
```

## Error Handling

### VIES Service Errors

```typescript
import { VatCheckUnavailableException } from 'ts-vat'

try {
  const isValid = await calculator.isValidVatNumber('DE123456789')
}
catch (error) {
  if (error instanceof VatCheckUnavailableException) {
    console.error('VIES service is temporarily unavailable')
    // Implement fallback behavior
  }
}
```

### Format Errors

```typescript
import { InvalidVatNumberException } from 'ts-vat'

try {
  await calculator.getVatDetails('invalid-format')
}
catch (error) {
  if (error instanceof InvalidVatNumberException) {
    console.error('Invalid VAT number format')
  }
}
```

## Best Practices

### 1. Enable Validation in Production

```typescript
const calculator = new VatCalculator({
  validateVatNumbers: true,
  forwardSoapFaults: true,
})
```

### 2. Implement Caching

```typescript
const vatCache = new Map<string, boolean>()

async function validateVatNumber(vatNumber: string): Promise<boolean> {
  if (vatCache.has(vatNumber)) {
    return vatCache.get(vatNumber)!
  }

  const isValid = await calculator.isValidVatNumber(vatNumber)
  vatCache.set(vatNumber, isValid)
  return isValid
}
```

### 3. Set Appropriate Timeouts

```typescript
const calculator = new VatCalculator({
  soapTimeout: 15000, // 15 seconds
})
```

### 4. Handle Rate Limiting

```typescript
async function validateWithRetry(vatNumber: string, maxRetries = 3): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await calculator.isValidVatNumber(vatNumber)
    }
    catch (error) {
      if (error instanceof VatCheckUnavailableException && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}
```

## Integration with VAT Calculations

```typescript
const calculator = new VatCalculator({
  businessCountryCode: 'DE',
  validateVatNumbers: true,
})

async function calculateB2BPrice(netPrice: number, countryCode: string, vatNumber: string) {
  // First validate the VAT number
  const isValid = await calculator.isValidVatNumber(vatNumber)

  // Then calculate VAT (0% if valid VAT number for B2B)
  return calculator.calculate(
    netPrice,
    countryCode,
    null,
    isValid // use validation result for B2B check
  )
}
```

## Related Topics

- [VAT Calculation](./vat-calculation)
- [Special Cases](./special-cases)
- [Advanced Features](./advanced-features)
