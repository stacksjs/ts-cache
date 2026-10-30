import { afterAll, describe, expect, test } from 'bun:test'
import { RedisDriver, redisConnectionUrl } from '../src/drivers/redis'

// stacksjs/ts-cache#3093. `url` always ended up set, to REDIS_URL or
// localhost:6379, so host, port, password, database and tls were never read.

describe('redisConnectionUrl', () => {
  const env = { REDIS_URL: 'redis://from-env:6400/2' }

  test('an explicit url wins over everything', () => {
    expect(redisConnectionUrl({ url: 'redis://explicit:6500/1', host: 'ignored', port: 1 }, env)).toBe('redis://explicit:6500/1')
  })

  test('builds the url from host, port and database when they are given', () => {
    expect(redisConnectionUrl({ host: 'cache.internal', port: 6380, database: 3 }, env)).toBe('redis://cache.internal:6380/3')
  })

  test('a host alone keeps the default port and database', () => {
    expect(redisConnectionUrl({ host: 'cache.internal' }, env)).toBe('redis://cache.internal:6379/0')
  })

  test('includes an ACL username with its password, both encoded', () => {
    expect(redisConnectionUrl({ host: 'h', username: 'app user', password: 'p@ss:word/1' }, env))
      .toBe('redis://app%20user:p%40ss%3Aword%2F1@h:6379/0')
  })

  test('a password without a username is the default user', () => {
    expect(redisConnectionUrl({ host: 'h', password: 'secret' }, env)).toBe('redis://:secret@h:6379/0')
  })

  test('tls selects rediss', () => {
    expect(redisConnectionUrl({ host: 'h', tls: true }, env)).toBe('rediss://h:6379/0')
  })

  test('brackets an IPv6 host', () => {
    expect(redisConnectionUrl({ host: '::1', port: 6380 }, env)).toBe('redis://[::1]:6380/0')
  })

  test('empty strings and a false tls are not settings, so REDIS_URL still applies', () => {
    expect(redisConnectionUrl({ username: '', password: '', tls: false }, env)).toBe('redis://from-env:6400/2')
  })

  test('falls back to REDIS_URL, then localhost, only when nothing is given', () => {
    expect(redisConnectionUrl({}, env)).toBe('redis://from-env:6400/2')
    expect(redisConnectionUrl({}, {})).toBe('redis://localhost:6379')
  })
})

// The live half: a driver given host and port, not a URL, has to reach that
// server. REDIS_URL names it, and is hidden while the driver is built, so the
// driver can only get there from the parts it is handed.
const live = new URL(process.env.REDIS_URL || 'redis://127.0.0.1:6379/0')
const redisUrl = process.env.REDIS_URL
delete process.env.REDIS_URL
const driver = new RedisDriver({
  host: live.hostname,
  port: Number(live.port || 6379),
  database: Number(live.pathname.slice(1) || 0),
  password: live.password ? decodeURIComponent(live.password) : undefined,
  prefix: `ts-cache:connection:${process.pid}`,
})
if (redisUrl !== undefined)
  process.env.REDIS_URL = redisUrl

afterAll(async () => {
  await driver.flush()
  await driver.close()
})

describe('RedisDriver given host and port', () => {
  test('stores and reads back on the server those name', async () => {
    expect(await driver.set('reached', { by: 'host and port' }, 30)).toBe(true)
    expect(await driver.get('reached')).toEqual({ by: 'host and port' })
  })
})
