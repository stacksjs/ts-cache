# VAT Calculation

Learn how to calculate VAT rates for different scenarios in the EU.

## Basic Calculation

```typescript
import { VatCalculator } from 'ts-vat'

const calculator = new VatCalculator()

// Calculate VAT for a €100 product in Germany
const result = calculator.calculate(100, 'DE')
console.log(result)
// {
//   netPrice: 100,
//   grossPrice: 119,
//   vatAmount: 19,
//   vatRate: 0.19,
//   countryCode: 'DE',
//   isCompany: false,
//   details: {
//     ruleApplied: 'standard',
//     reverseCharge: false
//   }
// }
```

## Different VAT Rates

### Standard Rate

Each EU country has its standard VAT rate:

```typescript
// France standard rate (20%)
const result = calculator.calculate(100, 'FR')
```

### Reduced Rates

Many products qualify for reduced rates:

```typescript
// Calculate VAT with reduced rate
const result = calculator.calculate(
  50,
  'FR',
  null,
  false,
  'reduced' // use reduced rate
)
```

### Super-reduced Rates

Some countries have super-reduced rates for specific goods:

```typescript
// Super-reduced rate in Spain
const result = calculator.calculate(
  30,
  'ES',
  null,
  false,
  'super-reduced'
)
```

## Net/Gross Calculations

### From Net to Gross

```typescript
const result = calculator.calculate(
  100, // net price
  'DE', // country
  null, // no postal code
  false // not a business
)
// Returns gross price with VAT
```

### From Gross to Net

```typescript
const result = calculator.calculateNet(
  119, // gross price
  'DE', // country
  null, // no postal code
  false // not a business
)
// Returns net price without VAT
```

## Location-based Rules

### Postal Code Specific Rules

Some locations have special VAT rules based on postal codes:

```typescript
// Canary Islands (Spain) - 0% VAT
const result = calculator.calculate(
  100,
  'ES',
  '35001' // Las Palmas postal code
)

// Regular Spain - Standard VAT
const result2 = calculator.calculate(
  100,
  'ES',
  '28001' // Madrid postal code
)
```

### Cross-border Calculations

For cross-border transactions within the EU:

```typescript
const calculator = new VatCalculator({
  businessCountryCode: 'DE', // Your business is in Germany
})

// Selling to France
const result = calculator.calculate(
  100,
  'FR',
  null,
  false // B2C transaction
)
```

## Best Practices

1. **Always Specify Country Code**: Even if you have a default, be explicit
2. **Use Postal Codes**: When available, for accurate special territory handling
3. **Set Business Location**: Configure your business country for correct cross-border rules
4. **Handle Rounding**: VAT calculations should typically round to 2 decimal places
5. **Cache Results**: For frequently used calculations

## Error Handling

```typescript
try {
  const result = calculator.calculate(100, 'XX') // Invalid country
}
catch (error) {
  if (error instanceof InvalidCountryCodeException) {
    console.error('Invalid country code')
  }
}
```

## Related Topics

- [VAT Number Validation](./vat-validation)
- [Special Cases](./special-cases)
- [Advanced Features](./advanced-features)
