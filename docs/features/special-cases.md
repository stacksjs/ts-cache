# Special VAT Cases

Learn how to handle special VAT cases and territories in the EU.

## Special Territories

The EU has several special territories with different VAT rules:

```typescript
import { VatCalculator } from 'ts-vat'

const calculator = new VatCalculator()

// Canary Islands (Spain)
const canaryIslands = calculator.getTaxRateForLocation('ES', '35001') // 0%

// Mount Athos (Greece)
const mountAthos = calculator.getTaxRateForLocation('GR', '63086') // 0%

// Åland Islands (Finland)
const alandIslands = calculator.getTaxRateForLocation('FI', '22100') // 0%
```

## Domestic Reverse Charge

Some transactions require domestic reverse charge:

```typescript
const calculator = new VatCalculator({
  businessCountryCode: 'DE',
})

// Construction services in Germany
const constructionServices = calculator.calculate(1000, 'DE', null, true, {
  reverseCharge: true,
  service: 'construction'
})
```

## Special VAT Rates

### Reduced Rates

```typescript
// Books in Germany (7%)
const bookVat = calculator.calculate(
  100,
  'DE',
  null,
  false,
  { type: 'reduced' }
)

// Super-reduced rate in France (2.1%)
const newspaperVat = calculator.calculate(
  100,
  'FR',
  null,
  false,
  { type: 'super_reduced' }
)
```

### Zero-Rated Goods

```typescript
// Zero-rated medical supplies
const medicalVat = calculator.calculate(
  100,
  'IE',
  null,
  false,
  { type: 'zero' }
)
```

## Distance Selling

Handle distance selling thresholds:

```typescript
const calculator = new VatCalculator({
  businessCountryCode: 'DE',
  enableDistanceSellingThresholds: true
})

// Check if threshold is exceeded
const exceedsThreshold = calculator.exceedsDistanceSellingThreshold('FR', 10000)

// Calculate VAT considering thresholds
const price = calculator.calculate(
  100,
  'FR',
  null,
  false,
  {
    checkDistanceSellingThreshold: true,
    previousSalesToCountry: 9000
  }
)
```

## Digital Services

Special rules for digital services:

```typescript
const calculator = new VatCalculator({
  businessCountryCode: 'DE',
  isDigitalService: true
})

// Digital service to French consumer
const digitalServiceVat = calculator.calculate(100, 'FR')

// Digital service with evidence of customer location
const locationBasedVat = calculator.calculate(100, 'FR', '75001', false, {
  evidenceType: 'billing_address'
})
```

## Special Regions

### Northern Ireland

Special handling for Northern Ireland post-Brexit:

```typescript
const calculator = new VatCalculator()

// Goods in Northern Ireland
const niGoods = calculator.calculate(100, 'XI', null, false, {
  type: 'goods'
})

// Services in Northern Ireland (treated as UK)
const niServices = calculator.calculate(100, 'XI', null, false, {
  type: 'services'
})
```

### Monaco and Isle of Man

```typescript
// Monaco (treated as FR)
const monacoVat = calculator.getTaxRateForLocation('MC', '98000')

// Isle of Man (treated as GB)
const iomVat = calculator.getTaxRateForLocation('IM', 'IM1')
```

## Exempt Supplies

Handle VAT-exempt supplies:

```typescript
const calculator = new VatCalculator()

// Financial services (exempt)
const financialServices = calculator.calculate(1000, 'DE', null, false, {
  type: 'exempt',
  category: 'financial'
})

// Insurance services (exempt)
const insurance = calculator.calculate(1000, 'FR', null, false, {
  type: 'exempt',
  category: 'insurance'
})
```

## Related Topics

- [VAT Calculation](./vat-calculation)
- [VAT Number Validation](./vat-validation)
- [Advanced Features](./advanced-features)
