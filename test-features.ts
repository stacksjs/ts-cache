#!/usr/bin/env bun
/**
 * Comprehensive test suite for ts-cache features
 * Tests configuration system, CLI, and all new functionality
 */

import type { CacheConfig } from './src/types'
import process from 'node:process'
import { config, defaultConfig } from './src/config'

// Test colors
const colors = {
  green: (text: string) => `\x1B[32m${text}\x1B[0m`,
  red: (text: string) => `\x1B[31m${text}\x1B[0m`,
  yellow: (text: string) => `\x1B[33m${text}\x1B[0m`,
  blue: (text: string) => `\x1B[34m${text}\x1B[0m`,
  bold: (text: string) => `\x1B[1m${text}\x1B[0m`,
}

let passedTests = 0
let failedTests = 0
const errors: string[] = []

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(colors.green('  ✓'), message)
    passedTests++
  }
  else {
    console.log(colors.red('  ✗'), message)
    failedTests++
    errors.push(message)
  }
}

function testSection(title: string) {
  console.log()
  console.log(colors.bold(colors.blue(`${title}`)))
  console.log(colors.blue('━'.repeat(60)))
}

// ============================================================
// Test 1: Configuration System
// ============================================================

testSection('1. Configuration System - Default Values')

assert(typeof defaultConfig === 'object', 'defaultConfig is an object')
assert(defaultConfig.verbose === false, 'verbose defaults to false')
assert(defaultConfig.driver === 'memory', 'driver defaults to memory')
assert(defaultConfig.prefix === '', 'prefix defaults to empty string')
assert(defaultConfig.stdTTL === 0, 'stdTTL defaults to 0')
assert(defaultConfig.checkPeriod === 600, 'checkPeriod defaults to 600')
assert(defaultConfig.useClones === true, 'useClones defaults to true')
assert(defaultConfig.deleteOnExpire === true, 'deleteOnExpire defaults to true')
assert(defaultConfig.maxKeys === -1, 'maxKeys defaults to -1')

testSection('2. Configuration System - All 27 Top-Level Properties')

const expectedProperties = [
  'verbose',
  'driver',
  'prefix',
  'forceString',
  'objectValueSize',
  'promiseValueSize',
  'arrayValueSize',
  'enableLegacyCallbacks',
  'stdTTL',
  'checkPeriod',
  'useClones',
  'deleteOnExpire',
  'maxKeys',
  'redis',
  'serializer',
  'compression',
  'enableCompression',
  'middleware',
  'patterns',
  'events',
  'performance',
  'multiLevel',
  'keyTransform',
  'namespace',
  'ttlStrategy',
  'errorHandling',
  'debug',
]

const configKeys = Object.keys(config)
assert(configKeys.length === 27, `Config has 27 properties (got ${configKeys.length})`)

expectedProperties.forEach((prop) => {
  assert(
    configKeys.includes(prop),
    `Config includes '${prop}' property`,
  )
})

testSection('3. Configuration System - Nested Objects')

assert(typeof config.redis === 'object', 'redis config is an object')
assert(config.redis?.host === 'localhost', 'redis.host has default value')
assert(config.redis?.port === 6379, 'redis.port has default value')

assert(typeof config.compression === 'object', 'compression config is an object')
assert(config.compression?.algorithm === 'none', 'compression.algorithm defaults to none')
assert(config.compression?.level === 6, 'compression.level defaults to 6')
assert(config.compression?.threshold === 1024, 'compression.threshold defaults to 1024')

assert(typeof config.middleware === 'object', 'middleware config is an object')
assert(config.middleware?.enabled === false, 'middleware.enabled defaults to false')

assert(typeof config.patterns === 'object', 'patterns config is an object')
assert(config.patterns?.refreshAhead?.ttl === 3600, 'patterns.refreshAhead.ttl defaults to 3600')

assert(typeof config.performance === 'object', 'performance config is an object')
assert(config.performance?.enableStats === true, 'performance.enableStats defaults to true')
assert(config.performance?.batchSize === 100, 'performance.batchSize defaults to 100')

assert(typeof config.keyTransform === 'object', 'keyTransform config is an object')
assert(config.keyTransform?.maxLength === 250, 'keyTransform.maxLength defaults to 250')

assert(typeof config.namespace === 'object', 'namespace config is an object')
assert(config.namespace?.separator === ':', 'namespace.separator defaults to :')

assert(typeof config.ttlStrategy === 'object', 'ttlStrategy config is an object')
assert(config.ttlStrategy?.mode === 'fixed', 'ttlStrategy.mode defaults to fixed')
assert(config.ttlStrategy?.beta === 1.0, 'ttlStrategy.beta defaults to 1.0')

assert(typeof config.errorHandling === 'object', 'errorHandling config is an object')
assert(config.errorHandling?.throwOnError === false, 'errorHandling.throwOnError defaults to false')

assert(typeof config.debug === 'object', 'debug config is an object')
assert(config.debug?.enabled === false, 'debug.enabled defaults to false')
assert(config.debug?.logLevel === 'info', 'debug.logLevel defaults to info')

testSection('4. Configuration System - User Overrides')

assert(config.verbose === true, 'User config overrides verbose to true')

testSection('5. Configuration System - Type Safety')

const testConfig: CacheConfig = {
  driver: 'memory',
  stdTTL: 3600,
  compression: {
    algorithm: 'gzip',
    level: 9,
    enabled: true,
  },
}

assert(typeof testConfig === 'object', 'Custom config object can be created')
assert(testConfig.driver === 'memory', 'Custom config properties are accessible')

// ============================================================
// Test 2: CLI Commands
// ============================================================

testSection('6. CLI - Help System')

try {
  const proc = Bun.spawn(['bun', 'bin/cli.ts', '--help'], {
    stdout: 'pipe',
  })
  const helpResult = await new Response(proc.stdout).text()

  assert(helpResult.includes('Usage:'), 'CLI shows usage information')
  assert(helpResult.includes('Commands:'), 'CLI shows commands section')
  assert(helpResult.includes('get <key>'), 'CLI lists get command')
  assert(helpResult.includes('set <key> <value>'), 'CLI lists set command')
  assert(helpResult.includes('del <keys...>'), 'CLI lists del command')
  assert(helpResult.includes('stats'), 'CLI lists stats command')
  assert(helpResult.includes('config'), 'CLI lists config command')
}
catch (error) {
  console.error(colors.red('  ✗ Failed to run CLI help:'), error)
  failedTests++
}

testSection('7. CLI - Version Command')

try {
  const proc = Bun.spawn(['bun', 'bin/cli.ts', 'version'], { stdout: 'pipe' })
  const versionResult = await new Response(proc.stdout).text()

  assert(versionResult.trim().match(/\d+\.\d+\.\d+/) !== null, 'Version command returns semantic version')
}
catch (error) {
  console.error(colors.red('  ✗ Failed to run CLI version:'), error)
  failedTests++
}

testSection('8. CLI - Info Command')

try {
  const proc = Bun.spawn(['bun', 'bin/cli.ts', 'info'], { stdout: 'pipe' })
  const infoResult = await new Response(proc.stdout).text()

  assert(infoResult.includes('ts-cache'), 'Info shows library name')
  assert(infoResult.includes('Features:'), 'Info shows features section')
  assert(infoResult.includes('Multiple drivers'), 'Info mentions drivers')
  assert(infoResult.includes('Compression'), 'Info mentions compression')
  assert(infoResult.includes('Middleware'), 'Info mentions middleware')
  assert(infoResult.includes('Multi-level caching'), 'Info mentions multi-level caching')
}
catch (error) {
  console.error(colors.red('  ✗ Failed to run CLI info:'), error)
  failedTests++
}

testSection('9. CLI - Config Command')

try {
  const proc = Bun.spawn(['bun', 'bin/cli.ts', 'config'], { stdout: 'pipe' })
  const configResult = await new Response(proc.stdout).text()

  assert(configResult.includes('Current Configuration:'), 'Config shows header')
  assert(configResult.includes('Driver:'), 'Config shows driver')
  assert(configResult.includes('TTL:'), 'Config shows TTL')
  assert(configResult.includes('Verbose: true'), 'Config shows user override')
}
catch (error) {
  console.error(colors.red('  ✗ Failed to run CLI config:'), error)
  failedTests++
}

testSection('10. CLI - Test Command')

try {
  const proc = Bun.spawn(['bun', 'bin/cli.ts', 'test'], { stdout: 'pipe' })
  const testResult = await new Response(proc.stdout).text()

  assert(testResult.includes('Testing'), 'Test command runs')
  assert(testResult.includes('Writing test key'), 'Test writes key')
  assert(testResult.includes('Reading test key'), 'Test reads key')
  assert(testResult.includes('Deleting test key'), 'Test deletes key')
  assert(testResult.includes('✓ All tests passed'), 'Test command passes')
}
catch (error) {
  console.error(colors.red('  ✗ Failed to run CLI test:'), error)
  failedTests++
}

testSection('11. CLI - Set Command')

try {
  const proc = Bun.spawn(['bun', 'bin/cli.ts', 'set', 'test:cli', 'hello', '--ttl', '60'], { stdout: 'pipe' })
  const setResult = await new Response(proc.stdout).text()

  assert(setResult.includes('✓ Set: test:cli'), 'Set command succeeds')
  assert(setResult.includes('TTL: 60 seconds'), 'Set command shows TTL')
}
catch (error) {
  console.error(colors.red('  ✗ Failed to run CLI set:'), error)
  failedTests++
}

testSection('12. CLI - JSON Support')

try {
  const proc = Bun.spawn([
    'bun',
    'bin/cli.ts',
    'set',
    'test:json',
    '{"name":"test","value":123}',
    '--json',
  ], { stdout: 'pipe' })
  const jsonSetResult = await new Response(proc.stdout).text()

  assert(jsonSetResult.includes('✓ Set: test:json'), 'JSON set command succeeds')
}
catch (error) {
  console.error(colors.red('  ✗ Failed to run CLI JSON set:'), error)
  failedTests++
}

testSection('13. CLI - Config JSON Output')

try {
  const proc = Bun.spawn(['bun', 'bin/cli.ts', 'config', '--json'], { stdout: 'pipe' })
  const jsonConfigResult = await new Response(proc.stdout).text()

  const parsed = JSON.parse(jsonConfigResult)
  assert(typeof parsed === 'object', 'Config JSON output is valid JSON')
  assert(parsed.driver === 'memory', 'Config JSON contains driver')
  assert(parsed.verbose === true, 'Config JSON contains user overrides')
}
catch (error) {
  console.error(colors.red('  ✗ Failed to run CLI config --json:'), error)
  failedTests++
}

// ============================================================
// Test 3: Feature Verification
// ============================================================

testSection('14. Feature Verification - Middleware Config')

assert(config.middleware?.retry !== undefined, 'Retry middleware config exists')
assert(config.middleware?.retry?.maxRetries === 3, 'Retry maxRetries defaults to 3')
assert(config.middleware?.retry?.initialDelay === 100, 'Retry initialDelay defaults to 100')
assert(config.middleware?.retry?.maxDelay === 5000, 'Retry maxDelay defaults to 5000')

testSection('15. Feature Verification - Pattern Defaults')

assert(config.patterns?.writeBehind?.flushInterval === 5000, 'WriteBehind flushInterval defaults to 5000')
assert(config.patterns?.refreshAhead?.thresholdPercentage === 0.8, 'RefreshAhead threshold defaults to 0.8')
assert(config.patterns?.slidingWindow?.ttl === 3600, 'SlidingWindow TTL defaults to 3600')

testSection('16. Feature Verification - Multi-Level Cache')

assert(config.multiLevel?.enabled === false, 'Multi-level cache disabled by default')
assert(config.multiLevel?.levels === undefined, 'Multi-level levels not defined by default')

testSection('17. Feature Verification - TTL Strategy')

assert(config.ttlStrategy?.jitter === 0, 'TTL jitter defaults to 0')
assert(config.ttlStrategy?.mode === 'fixed', 'TTL mode defaults to fixed')

testSection('18. Feature Verification - Error Handling')

assert(config.errorHandling?.circuitBreaker !== undefined, 'Circuit breaker config exists')
assert(config.errorHandling?.circuitBreaker?.threshold === 5, 'Circuit breaker threshold defaults to 5')
assert(config.errorHandling?.circuitBreaker?.timeout === 60000, 'Circuit breaker timeout defaults to 60000')

testSection('19. Feature Verification - Event Hooks')

assert(config.events !== undefined, 'Events config exists')
assert(config.events?.onSet === undefined, 'Event hooks are undefined by default')
assert(config.events?.onGet === undefined, 'Event hooks are undefined by default')

testSection('20. Feature Verification - Performance Settings')

assert(config.performance?.warmup !== undefined, 'Warmup config exists')
assert(config.performance?.warmup?.enabled === false, 'Warmup disabled by default')
assert(config.performance?.metricsInterval === 60000, 'Metrics interval defaults to 60000')

// ============================================================
// Test Summary
// ============================================================

console.log()
console.log(colors.bold('═'.repeat(60)))
console.log(colors.bold('TEST SUMMARY'))
console.log(colors.bold('═'.repeat(60)))
console.log()

const total = passedTests + failedTests
const passRate = total > 0 ? ((passedTests / total) * 100).toFixed(1) : 0

console.log(`  ${colors.green('Passed:')} ${passedTests}`)
console.log(`  ${colors.red('Failed:')} ${failedTests}`)
console.log(`  ${colors.blue('Total:')}  ${total}`)
console.log(`  ${colors.yellow('Pass Rate:')} ${passRate}%`)
console.log()

if (failedTests > 0) {
  console.log(colors.red(colors.bold('FAILED TESTS:')))
  errors.forEach((error, index) => {
    console.log(colors.red(`  ${index + 1}. ${error}`))
  })
  console.log()
  process.exit(1)
}
else {
  console.log(colors.green(colors.bold('✓ ALL TESTS PASSED!')))
  console.log()
  process.exit(0)
}
