# Usage Guide

ts-vat provides a comprehensive API for handling EU VAT calculations and validations. This guide will walk you through common use cases and best practices.

## Quick Start

```typescript
import { VatCalculator } from 'ts-vat'

// Create a calculator instance
const calculator = new VatCalculator({
  businessCountryCode: 'DE', // Your business location
  validateVatNumbers: true, // Enable VAT number validation
})

// Basic VAT calculation
const result = calculator.calculate(
  100, // net price
  'FR', // customer country
  '75001' // postal code (optional)
)

console.log(result)
// {
//   netPrice: 100,
//   grossPrice: 120,
//   vatAmount: 20,
//   vatRate: 0.20,
//   countryCode: 'FR',
//   isCompany: false,
//   details: {
//     ruleApplied: 'standard',
//     reverseCharge: false,
//     postalCodeUsed: '75001'
//   }
// }
```

## Basic Usage

### Simple VAT Calculation

```typescript
import { VatCalculator } from 'ts-vat'

const calculator = new VatCalculator()

// Calculate VAT for a €100 product in Germany
const result = calculator.calculate(100, 'DE')
console.log(result)
```

### B2B Transactions

```typescript
const calculator = new VatCalculator({
  businessCountryCode: 'NL', // Your business is in Netherlands
})

// Calculate VAT for a B2B transaction
const result = calculator.calculate(
  1000, // net price
  'DE', // customer country
  null, // no postal code
  true, // is business customer
)
```

### Handling Special Rates

```typescript
// Calculate VAT with reduced rate
const result = calculator.calculate(
  50,
  'FR',
  null,
  false,
  'reduced' // use reduced rate
)

// Super-reduced rate for specific products
const result2 = calculator.calculate(
  30,
  'ES',
  null,
  false,
  'super-reduced'
)
```

## VAT Number Validation

### Basic Validation

```typescript
const calculator = new VatCalculator()

// Validate a VAT number
const isValid = await calculator.isValidVatNumber('DE123456789')
```

### Detailed VAT Information

```typescript
// Get detailed information about a VAT number
const details = await calculator.getVatDetails('NL123456789B01')
console.log(details)
// {
//   isValid: true,
//   name: "Example Company BV",
//   address: "Example Street 123, Amsterdam",
//   countryCode: "NL",
//   vatNumber: "123456789B01",
//   requestDate: "2024-03-25T...",
//   isCompany: true
// }
```

## Special Cases

### Handling Special Territories

```typescript
// Canary Islands (Spain)
const result = calculator.calculate(
  100,
  'ES',
  '35001' // Las Palmas, Canary Islands
)
// VAT rate will be 0%

// Mount Athos (Greece)
const result2 = calculator.calculate(
  100,
  'EL',
  '63086' // Mount Athos
)
```

### Reverse Charge Mechanism

```typescript
const calculator = new VatCalculator({
  businessCountryCode: 'DE',
})

// B2B transaction with reverse charge
const result = calculator.calculate(
  1000,
  'FR',
  null,
  true
)
// VAT will be 0% due to reverse charge
```

## Advanced Features

### Method Chaining

```typescript
const result = calculator
  .setCountryCode('DE')
  .setPostalCode('10115')
  .setCompany(true)
  .setVatNumber('DE123456789')
  .calculate(100)
```

### Net/Gross Calculations

```typescript
// Calculate net price from gross
const result = calculator.calculateNet(
  119, // gross price
  'DE', // country
  null, // no postal code
  false // not a business
)
// Will return { netPrice: 100, ... }
```

### Error Handling

```typescript
import {
  InvalidCountryCodeException,
  InvalidPostalCodeException,
  InvalidVatNumberException,
  VatCheckUnavailableException,
} from 'ts-vat'

try {
  const result = await calculator.getVatDetails('invalid-vat')
}
catch (error) {
  if (error instanceof InvalidVatNumberException) {
    console.error('Invalid VAT number format')
  }
  else if (error instanceof VatCheckUnavailableException) {
    console.error('VIES service is currently unavailable')
  }
}
```

## Best Practices

1. **Enable Validation**: In production, enable all validation options:

   ```typescript
   const calculator = new VatCalculator({
     validateVatNumbers: true,
     validatePostalCodes: true,
     validateCountryCodes: true,
   })
   ```

2. **Handle VIES Service Errors**: The VIES service can be unreliable, always implement proper error handling:

   ```typescript
   try {
     const isValid = await calculator.isValidVatNumber('DE123456789')
   }
   catch (error) {
     if (error instanceof VatCheckUnavailableException) {
       // Implement fallback behavior
     }
   }
   ```

3. **Cache VAT Validations**: Cache successful VAT number validations to improve performance:

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

4. **Set Appropriate Timeouts**: Configure timeouts based on your needs:

   ```typescript
   const calculator = new VatCalculator({
     soapTimeout: 15000, // 15 seconds
   })
   ```

For more detailed information about the available methods and options, check out the [API Documentation](./api.md).
