# Configuration

ts-vat provides extensive configuration options to customize its behavior according to your needs. Here's a complete guide to all available configuration options.

## Basic Configuration

The `VatCalculator` constructor accepts a configuration object that allows you to customize its behavior:

```typescript
import { VatCalculator } from 'ts-vat'

const calculator = new VatCalculator({
  // Your configuration options here
})
```

## Configuration Options

### Core Settings

```typescript
interface VatCalculatorConfig {
  // The country code where your business is located
  businessCountryCode?: CountryCode

  // VAT rules for different countries
  rules?: VatRules

  // Validation settings
  validateVatNumbers?: boolean
  validatePostalCodes?: boolean
  validateCountryCodes?: boolean

  // VIES service settings
  forwardSoapFaults?: boolean
  soapTimeout?: number
}
```

### VAT Rules Configuration

```typescript
interface VatRules {
  [countryCode: string]: {
    // Standard VAT rate for the country
    rate: number

    // Different types of VAT rates
    rates?: {
      'high': number
      'low'?: number
      'low1'?: number
      'super-reduced'?: number
      'parking'?: number
    }

    // Special territory exceptions
    exceptions?: {
      [territory: string]: number
    }

    // Special rules for the country
    specialRules?: {
      isCompanyRequired?: boolean
      reverseCharge?: boolean
      vatNumberRequired?: boolean
    }

    // Postal code based rules
    postalCodeRules?: Array<{
      pattern: RegExp | string
      rate: number
    }>
  }
}
```

## Example Configurations

### Basic Setup

```typescript
const calculator = new VatCalculator({
  businessCountryCode: 'DE',
  validateVatNumbers: true,
  validatePostalCodes: true,
  validateCountryCodes: true,
})
```

### Custom VAT Rules

```typescript
const calculator = new VatCalculator({
  rules: {
    DE: {
      rate: 0.19,
      rates: {
        high: 0.19,
        low: 0.07,
      },
      exceptions: {
        'Heligoland': 0,
        'Büsingen am Hochrhein': 0,
      },
    },
    // ... other country rules
  },
})
```

### VIES Service Configuration

```typescript
const calculator = new VatCalculator({
  forwardSoapFaults: true,
  soapTimeout: 15000, // 15 seconds
})
```

## Default Configuration

ts-vat comes with sensible defaults that you can override as needed:

```typescript
const defaultConfig = {
  rules: defaultVatRules, // Includes all EU country rules
  businessCountryCode: undefined,
  forwardSoapFaults: false,
  soapTimeout: 30000, // 30 seconds
  validateVatNumbers: true,
  validateCountryCodes: true,
  validatePostalCodes: false,
}
```

## Validation Settings

### VAT Number Validation

```typescript
const calculator = new VatCalculator({
  validateVatNumbers: true, // Enable VAT number format validation
})
```

### Postal Code Validation

```typescript
const calculator = new VatCalculator({
  validatePostalCodes: true, // Enable postal code format validation
})
```

### Country Code Validation

```typescript
const calculator = new VatCalculator({
  validateCountryCodes: true, // Enable country code validation
})
```

## Special Rules

### Reverse Charge

```typescript
const calculator = new VatCalculator({
  rules: {
    DE: {
      // ... other rules
      specialRules: {
        reverseCharge: true,
      },
    },
  },
})
```

### VAT Number Requirements

```typescript
const calculator = new VatCalculator({
  rules: {
    GB: {
      // ... other rules
      specialRules: {
        vatNumberRequired: true,
      },
    },
  },
})
```

## Custom Postal Code Rules

```typescript
const calculator = new VatCalculator({
  rules: {
    ES: {
      // ... other rules
      postalCodeRules: [
        {
          pattern: /^(35|38)\d{3}$/, // Canary Islands
          rate: 0,
        },
      ],
    },
  },
})
```

## Error Handling

### SOAP Faults

```typescript
const calculator = new VatCalculator({
  forwardSoapFaults: true, // Forward SOAP errors from VIES service
})
```

### Timeouts

```typescript
const calculator = new VatCalculator({
  soapTimeout: 30000, // 30 seconds timeout for VIES service calls
})
```

## Best Practices

1. **Production Settings**

   ```typescript
   const calculator = new VatCalculator({
     validateVatNumbers: true,
     validatePostalCodes: true,
     validateCountryCodes: true,
     forwardSoapFaults: false,
     soapTimeout: 15000,
   })
   ```

2. **Development Settings**

   ```typescript
   const calculator = new VatCalculator({
     validateVatNumbers: true,
     validatePostalCodes: false,
     validateCountryCodes: true,
     forwardSoapFaults: true,
     soapTimeout: 30000,
   })
   ```

3. **High-Performance Settings**

   ```typescript
   const calculator = new VatCalculator({
     validateVatNumbers: false,
     validatePostalCodes: false,
     validateCountryCodes: true,
     soapTimeout: 5000,
   })
   ```

For more information about using these configurations, check out the [Usage Guide](./usage.md) or the [API Documentation](./api.md).
