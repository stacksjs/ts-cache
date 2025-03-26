<p align="center"><img src="https://github.com/stacksjs/ts-vat/blob/main/.github/art/cover.jpg?raw=true" alt="Social Card of this repo"></p>

# Introduction

ts-vat is a powerful TypeScript library designed to handle EU VAT calculations and validations with precision and ease. It provides a comprehensive solution for businesses dealing with European Union Value Added Tax regulations, including special cases, reduced rates, and post-Brexit UK rules.

## Features

### 🇪🇺 Complete EU VAT Coverage

- Support for all EU member states
- Post-Brexit UK VAT rules
- Special territories and exceptions
- Reduced rates and parking rates
- Reverse charge mechanism

### ✅ Comprehensive Validation

- VAT number validation against official VIES service
- Postal code validation for all EU countries
- Country code validation
- Detailed error messages and handling

### 🎯 Special Cases

- Support for special territories (e.g., Canary Islands, Mount Athos)
- Handling of B2B and B2C transactions
- Cross-border transaction rules
- Reverse charge mechanism

### 🛡️ Type Safety

- Full TypeScript support
- Comprehensive type definitions
- Compile-time checks
- IDE autocompletion

### 🔧 Flexible Configuration

- Customizable validation rules
- Configurable timeouts
- Error handling options
- Business country settings

## Browser Compatibility

ts-vat is designed to work in both Node.js / Bun and modern browser environments. Here's what you need to know:

### Modern Browsers

- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 79+

### Key Considerations

- The library uses the `fetch` API for VIES service communication
- XML parsing is handled via the `@xmldom/xmldom` package
- All modern ES6+ features are transpiled for broader compatibility
- The library is tree-shakeable for optimal bundle size

### CORS Considerations

When using the library in a browser environment, you may need to handle CORS for VIES service calls. We recommend:

1. Using a CORS proxy in development
2. Setting up proper backend proxying in production
3. Implementing request caching for better performance

## Performance Optimization

ts-vat is optimized for:

1. **Tree Shaking**: Only import what you need
2. **Caching**: Implement response caching for VAT validations
3. **Lazy Loading**: Import validation features on demand
4. **Bundle Size**: Core package is under 10KB minified and gzipped

## Use Cases

ts-vat is perfect for:

- E-commerce platforms
- SaaS businesses
- Digital service providers
- Accounting software
- Invoice generation systems
- Tax compliance tools

## Real-World Example

Here's a quick example of calculating VAT for a product sold to a customer in Germany:

```typescript
import { VatCalculator } from 'ts-vat'

const calculator = new VatCalculator({
  businessCountryCode: 'DE',
  validateVatNumbers: true,
})

// Calculate VAT for a €100 product sold to a business customer in Germany
const result = calculator.calculate(
  100,
  'DE',
  '10115', // Berlin postal code
  true, // is business customer
)

console.log(result)
// Output:
// {
//   netPrice: 100,
//   grossPrice: 119,
//   vatAmount: 19,
//   vatRate: 0.19,
//   countryCode: 'DE',
//   isCompany: true,
//   details: {
//     ruleApplied: 'standard',
//     reverseCharge: true,
//     vatNumberUsed: undefined,
//     postalCodeUsed: '10115'
//   }
// }
```

## Why ts-vat?

1. **Accuracy**: Built with precision in mind, following official EU VAT rules and regulations
2. **Type Safety**: Full TypeScript support ensures compile-time error catching
3. **Validation**: Built-in validation for VAT numbers, postal codes, and country codes
4. **Maintenance**: Regular updates to keep up with VAT rate changes and regulation updates
5. **Performance**: Optimized for high-performance applications with minimal overhead

Ready to get started? Check out our [Installation Guide](./install.md) or dive into the [Usage Documentation](./usage.md).
