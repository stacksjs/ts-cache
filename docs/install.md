# Installation

ts-vat is available as an npm package and can be installed using your preferred package manager.

## Package Managers

Choose your package manager of choice:

::: code-group

```sh [npm]
npm install ts-vat
# or install with TypeScript types
npm install ts-vat @types/ts-vat
```

```sh [bun]
bun install ts-vat
```

```sh [pnpm]
pnpm add ts-vat
```

```sh [yarn]
yarn add ts-vat
```

:::

## TypeScript Configuration

If you're using TypeScript, make sure your `tsconfig.json` includes the following settings for the best experience:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "lib": ["ES2020", "DOM"],
    "types": ["node"], // or "types": ["bun"]
    "resolveJsonModule": true
  }
}
```

## Environment Setup

### VIES Service Access

ts-vat uses the EU's VIES (VAT Information Exchange System) service for VAT number validation. Make sure your environment has:

1. Access to the internet
2. No firewall blocking access to `ec.europa.eu`
3. Proper SSL/TLS support

### Timeouts

By default, ts-vat sets a 30-second timeout for VIES service calls. You can configure this in your initialization:

```typescript
const calculator = new VatCalculator({
  soapTimeout: 15000, // 15 seconds
})
```

## Next Steps

Once installed, you can:

1. Check out the [Usage Guide](./usage.md) for examples
2. Review the [Configuration Options](./config.md)
3. Explore the [API Documentation](./api.md)
