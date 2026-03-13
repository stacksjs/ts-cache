# Claude Code Guidelines

## About

A high-performance, type-safe caching library for TypeScript with support for multiple storage drivers (in-memory, memory-LRU, and Redis via Bun's native client). It provides flexible TTL strategies, batch operations, a tagging system, built-in caching patterns (cache-aside, read-through, write-through, write-behind, refresh-ahead, multi-level), rate limiting, distributed locking, memoization, and a CLI tool. In ultra-fast mode, it outperforms lru-cache on both GET and SET operations.

## Linting

- Use **pickier** for linting — never use eslint directly
- Run `bunx --bun pickier .` to lint, `bunx --bun pickier . --fix` to auto-fix
- When fixing unused variable warnings, prefer `// eslint-disable-next-line` comments over prefixing with `_`

## Frontend

- Use **stx** for templating — never write vanilla JS (`var`, `document.*`, `window.*`) in stx templates
- Use **crosswind** as the default CSS framework which enables standard Tailwind-like utility classes
- stx `<script>` tags should only contain stx-compatible code (signals, composables, directives)

## Dependencies

- **buddy-bot** handles dependency updates — not renovatebot
- **better-dx** provides shared dev tooling as peer dependencies — do not install its peers (e.g., `typescript`, `pickier`, `bun-plugin-dtsx`) separately if `better-dx` is already in `package.json`
- If `better-dx` is in `package.json`, ensure `bunfig.toml` includes `linker = "hoisted"`

## Commits

- Use conventional commit messages (e.g., `fix:`, `feat:`, `chore:`)
