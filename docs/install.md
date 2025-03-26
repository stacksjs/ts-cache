# Installation

ts-cache is available as an npm package and can be installed using your preferred package manager.

## Package Managers

Choose your package manager of choice:

::: code-group

```sh [npm]
npm install ts-cache
```

```sh [bun]
bun install ts-cache
```

```sh [pnpm]
pnpm add ts-cache
```

```sh [yarn]
yarn add ts-cache
```

:::

## TypeScript Configuration

ts-cache is written in TypeScript and includes type definitions out of the box. Make sure your `tsconfig.json` includes the following settings for the best experience:

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

## ES Modules Support

ts-cache is distributed as ES Modules, which provides better tree-shaking and is more aligned with modern JavaScript practices. Make sure your project is configured to use ES Modules:

- In a Node.js project, set `"type": "module"` in your `package.json`
- In Bun projects, ES Modules are supported by default
- For browser-based projects, use a modern bundler like Vite, Webpack, or Rollup

## Importing the Library

Once installed, you can import ts-cache in your code:

```typescript
// Import the default cache instance
import cache from 'ts-cache'

// Or import the Cache class to create your own instances
import { Cache } from 'ts-cache'

// Or import everything
import * as cache from 'ts-cache'
```

## Environment Support

### Node.js

ts-cache works with Node.js version 14.x and later. It uses the native `events` module and relies on features like:

- ES Modules
- EventEmitter
- setTimeout/clearTimeout

### Bun

ts-cache is fully compatible with Bun 1.0 and later.

### Browsers

When using ts-cache in browsers, you should bundle it with a tool like Webpack, Rollup, or Vite. The library itself doesn't have any browser-specific dependencies, so it works well in browser environments.

## Dependencies

ts-cache has minimal dependencies:

- `clone`: Used for deep cloning of objects when `useClones` option is enabled

No other runtime dependencies are required.

## Next Steps

Now that you've installed ts-cache, you can:

1. Check out the [Usage Guide](./usage.md) for examples
2. Review the [Configuration Options](./config.md)
3. Explore the [API Documentation](./api.md)
