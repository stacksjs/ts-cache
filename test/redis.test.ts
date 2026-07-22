import { afterAll, describe, expect, test } from 'bun:test'
import { RedisDriver } from '../src/drivers/redis'

const driver = new RedisDriver({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379/0',
  prefix: `ts-cache:contract:${process.pid}`,
})

afterAll(async () => {
  await driver.flush()
  await driver.close()
  await driver.close()
})

describe('RedisDriver live contract', () => {
  test('sets an expiring value using Bun Redis argument semantics', async () => {
    expect(await driver.set('expiring', { source: 'redis' }, 30)).toBe(true)
    expect(await driver.get('expiring')).toEqual({ source: 'redis' })
    const expiresAt = await driver.getTtl('expiring')
    expect(expiresAt).toBeGreaterThan(Date.now())
    expect(expiresAt).toBeLessThanOrEqual(Date.now() + 30_000)
  })

  test('closes idempotently after live operations', async () => {
    expect(await driver.set('close-check', true)).toBe(true)
    expect(driver.isConnected()).toBe(true)
  })
})
