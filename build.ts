import { dts } from 'bun-plugin-dtsx'

await Bun.build({
  minify: true,
  entrypoints: ['src/index.ts'],
  outdir: './dist',
  target: 'bun',
  plugins: [dts()],
})

// The CLI the `bin` field points at. Nothing built it, so `dist/bin/cli.js`
// has never existed and every install logged a failed bin link — the command
// was declared and unavailable.
await Bun.build({
  minify: true,
  entrypoints: ['bin/cli.ts'],
  outdir: './dist/bin',
  target: 'bun',
})
