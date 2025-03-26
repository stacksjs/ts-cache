import type { Options } from './types'

/**
 * Default options for the cache
 */
export const DEFAULT_OPTIONS: Options = {
  // convert all elements to string
  forceString: false,
  // used standard size for calculating value size
  objectValueSize: 80,
  promiseValueSize: 80,
  arrayValueSize: 40,
  // standard time to live in seconds. 0 = infinity;
  stdTTL: 0,
  // time in seconds to check all data and delete expired keys
  checkPeriod: 600,
  // en/disable cloning of variables. If `true` you'll get a copy of the cached variable.
  // If `false` you'll save and get just the reference
  useClones: true,
  // whether values should be deleted automatically at expiration
  deleteOnExpire: true,
  // enable legacy callbacks
  enableLegacyCallbacks: false,
  // max amount of keys that are being stored
  maxKeys: -1,
}

/**
 * Error message templates
 */
export const ERROR_MESSAGES = {
  ENOTFOUND: 'Key `__key` not found',
  ECACHEFULL: 'Cache max keys amount exceeded',
  EKEYTYPE: 'The key argument has to be of type `string` or `number`. Found: `__key`',
  EKEYSTYPE: 'The keys argument has to be an array.',
  ETTLTYPE: 'The ttl argument has to be a number.',
}
