<p align="center"><img src=".github/art/cover.jpg" alt="Social Card of this repo"></p>

[![npm version][npm-version-src]][npm-version-href]
[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
<!-- [![npm downloads][npm-downloads-src]][npm-downloads-href] -->
<!-- [![Codecov][codecov-src]][codecov-href] -->

# ts-vat

A TypeScript VAT calculator for EU countries. This package helps you calculate VAT rates for different EU countries, validate VAT numbers, and handle special VAT rules and exceptions.

## Features

- Calculate VAT for all EU countries
- Support for different VAT rates (standard, reduced, super-reduced)
- VAT number validation through VIES
- Special VAT zones and exceptions handling
- B2B and B2C VAT calculations
- TypeScript support with full type safety

## Installation

```bash
npm install ts-vat
```

## Usage

### Basic VAT Calculation

```typescript
import { VatCalculator } from 'ts-vat'

const calculator = new VatCalculator()

// Calculate VAT for a net price
const result = calculator.calculate(100, 'DE') // Germany
console.log(result)
// {
//   netPrice: 100,
//   grossPrice: 119,
//   vatAmount: 19,
//   vatRate: 0.19,
//   countryCode: 'DE',
//   isCompany: false
// }

// Calculate net price from gross price
const netResult = calculator.calculateNet(119, 'DE')
console.log(netResult.netPrice) // 100
```

### B2B Transactions

```typescript
const calculator = new VatCalculator({
  businessCountryCode: 'DE'
})

// B2B transaction within same country
const result = calculator.calculate(100, 'DE', undefined, true)
console.log(result.vatRate) // 0

// B2B transaction with different country
const result2 = calculator.calculate(100, 'FR', undefined, true)
console.log(result2.vatRate) // 0.20
```

### VAT Number Validation

```typescript
const calculator = new VatCalculator()

// Check if VAT number is valid
const isValid = await calculator.isValidVatNumber('DE123456789')
console.log(isValid)

// Get detailed VAT number information
const details = await calculator.getVatDetails('DE123456789')
console.log(details)
// {
//   isValid: true,
//   name: 'Company Name',
//   address: 'Company Address',
//   countryCode: 'DE',
//   vatNumber: '123456789'
// }
```

### Special VAT Zones

```typescript
const calculator = new VatCalculator()

// Calculate VAT for Heligoland (Germany)
const result = calculator.calculate(100, 'DE', 'Heligoland')
console.log(result.vatRate) // 0
```

## Configuration

You can configure the calculator with custom options:

```typescript
const calculator = new VatCalculator({
  businessCountryCode: 'DE',
  forwardSoapFaults: true,
  soapTimeout: 5000, // 5 seconds
  rules: {
    // Custom VAT rules...
  }
})
```

## Testing

```bash
bun test
```

## Changelog

Please see our [releases](https://github.com/stackjs/ts-vat/releases) page for more information on what has changed recently.

## Contributing

Please see [CONTRIBUTING](.github/CONTRIBUTING.md) for details.

## Community

For help, discussion about best practices, or any other conversation that would benefit from being searchable:

[Discussions on GitHub](https://github.com/stacksjs/ts-vat/discussions)

For casual chit-chat with others using this package:

[Join the Stacks Discord Server](https://discord.gg/stacksjs)

## Postcardware

Stacks OSS will always stay open-sourced, and we will always love to receive postcards from wherever Stacks is used! _And we also publish them on our website. Thank you, Spatie._

Our address: Stacks.js, 12665 Village Ln #2306, Playa Vista, CA 90094, United States 🌎

## Sponsors

We would like to extend our thanks to the following sponsors for funding Stacks development. If you are interested in becoming a sponsor, please reach out to us.

- [JetBrains](https://www.jetbrains.com/)
- [The Solana Foundation](https://solana.com/)

## Credits

- [`vat-calculator`](https://github.com/driesvints/vat-calculator) _for the original PHP implementation_
- [Chris Breuer](https://github.com/chrisbbreuer)
- [All Contributors](https://github.com/stacksjs/ts-vat/contributors)

## License

The MIT License (MIT). Please see [LICENSE](LICENSE.md) for more information.

Made with 💙

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/ts-vat?style=flat-square
[npm-version-href]: https://npmjs.com/package/ts-vat
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/stacksjs/ts-vat/ci.yml?style=flat-square&branch=main
[github-actions-href]: https://github.com/stacksjs/ts-vat/actions?query=workflow%3Aci

<!-- [codecov-src]: https://img.shields.io/codecov/c/gh/stacksjs/ts-vat/main?style=flat-square
[codecov-href]: https://codecov.io/gh/stacksjs/ts-vat -->
