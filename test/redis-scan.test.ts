import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { RedisClient } from 'bun'
import process from 'node:process'
import { RedisDriver } from '../src/drivers/redis'

// stacksjs/ts-cache#3094. keys() ran KEYS, which walks every key in one
// command and blocks the server meanwhile: with 1M keys, 76 ms in which no
// other client was answered. Timing is too noisy to pin, so this counts the
// commands the server ran instead: none of these may issue KEYS.

const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379/0'
const prefix = `ts-cache:scan:${process.pid}`
const driver = new RedisDriver({ url, prefix })
const neighbour = new RedisDriver({ url, prefix: `ts-cache:scan-neighbour:${process.pid}` })
const admin = new RedisClient(url)

/** How many times the server has run `command`, from INFO commandstats. */
async function calls(command: string): Promise<number> {
  const info = String(await admin.send('INFO', ['commandstats']))
  const match = info.match(new RegExp(`cmdstat_${command}:calls=(\\d+)`))
  return match ? Number(match[1]) : 0
}

// More than one SCAN page, so a single-page implementation would miss keys.
const COUNT = 2500

beforeAll(async () => {
  await driver.mset(Array.from({ length: COUNT }, (_, i) => ({ key: `item:${i}`, value: i })))
  await neighbour.set('kept', true)
})

afterAll(async () => {
  await driver.flush()
  await neighbour.flush()
  await driver.close()
  await neighbour.close()
  admin.close()
})

describe('RedisDriver listing without KEYS', () => {
  test('keys() returns every match, once, through SCAN', async () => {
    const before = await calls('keys')
    const all = await driver.keys('*')
    expect(all).toHaveLength(COUNT)
    expect(new Set(all).size).toBe(COUNT)
    expect((await driver.keys('item:1*')).sort()).toEqual(
      Array.from({ length: COUNT }, (_, i) => `item:${i}`).filter(key => key.startsWith('item:1')).sort(),
    )
    expect(await calls('keys')).toBe(before)
  })

  test('getStats() counts the keys without KEYS', async () => {
    const before = await calls('keys')
    expect((await driver.getStats()).keys).toBe(COUNT)
    expect(await calls('keys')).toBe(before)
  })

  test('flush() with a prefix removes its own keys only, without KEYS', async () => {
    const before = await calls('keys')
    await driver.flush()
    expect(await driver.keys('*')).toEqual([])
    expect(await neighbour.get('kept')).toBe(true)
    expect(await calls('keys')).toBe(before)
  })
})
