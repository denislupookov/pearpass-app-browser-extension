import { pendingPairingStore } from './pendingPairingStore'

const KEY = 'pendingPairingToken'

const makeArea = (data: Map<string, unknown>) => ({
  get: jest.fn(async (key: string) =>
    data.has(key) ? { [key]: data.get(key) } : {}
  ),
  set: jest.fn(async (items: Record<string, unknown>) => {
    for (const [k, v] of Object.entries(items)) data.set(k, v)
  }),
  remove: jest.fn(async (key: string) => {
    data.delete(key)
  })
})

describe('pendingPairingStore', () => {
  let sessionData: Map<string, unknown>
  let localData: Map<string, unknown>
  let originalChrome: unknown

  beforeEach(() => {
    originalChrome = (global as { chrome?: unknown }).chrome
    sessionData = new Map()
    localData = new Map()
    ;(global as { chrome: unknown }).chrome = {
      storage: {
        session: makeArea(sessionData),
        local: makeArea(localData)
      }
    }
  })

  afterEach(() => {
    ;(global as { chrome: unknown }).chrome = originalChrome
  })

  describe('set', () => {
    it('writes to chrome.storage.session when available', async () => {
      await pendingPairingStore.set('abc')
      expect(sessionData.get(KEY)).toBe('abc')
      expect(localData.has(KEY)).toBe(false)
    })

    it('falls back to chrome.storage.local when session is missing', async () => {
      ;(global as { chrome: unknown }).chrome = {
        storage: { local: makeArea(localData) }
      }
      await pendingPairingStore.set('xyz')
      expect(localData.get(KEY)).toBe('xyz')
    })

    it('throws when chrome.storage is unavailable', async () => {
      ;(global as { chrome: unknown }).chrome = undefined
      await expect(pendingPairingStore.set('abc')).rejects.toThrow(
        /chrome\.storage/
      )
    })
  })

  describe('get', () => {
    it('returns the stored token from session storage', async () => {
      sessionData.set(KEY, 'stored-token')
      await expect(pendingPairingStore.get()).resolves.toBe('stored-token')
    })

    it('reads from local storage when session is missing', async () => {
      localData.set(KEY, 'local-token')
      ;(global as { chrome: unknown }).chrome = {
        storage: { local: makeArea(localData) }
      }
      await expect(pendingPairingStore.get()).resolves.toBe('local-token')
    })

    it('returns null when no token is stored', async () => {
      await expect(pendingPairingStore.get()).resolves.toBeNull()
    })

    it('returns null when chrome.storage is unavailable', async () => {
      ;(global as { chrome: unknown }).chrome = undefined
      await expect(pendingPairingStore.get()).resolves.toBeNull()
    })

    it('returns null when storage.get rejects (swallows errors)', async () => {
      ;(global as { chrome: unknown }).chrome = {
        storage: {
          session: {
            get: jest.fn().mockRejectedValue(new Error('boom')),
            set: jest.fn(),
            remove: jest.fn()
          }
        }
      }
      await expect(pendingPairingStore.get()).resolves.toBeNull()
    })

    it('returns null when stored value is not a string', async () => {
      sessionData.set(KEY, { not: 'a string' })
      await expect(pendingPairingStore.get()).resolves.toBeNull()
    })
  })

  describe('clear', () => {
    it('removes the token from session storage', async () => {
      sessionData.set(KEY, 'will-be-cleared')
      await pendingPairingStore.clear()
      expect(sessionData.has(KEY)).toBe(false)
    })

    it('is a no-op when chrome.storage is unavailable', async () => {
      ;(global as { chrome: unknown }).chrome = undefined
      await expect(pendingPairingStore.clear()).resolves.toBeUndefined()
    })

    it('swallows errors from storage.remove', async () => {
      ;(global as { chrome: unknown }).chrome = {
        storage: {
          session: {
            get: jest.fn(),
            set: jest.fn(),
            remove: jest.fn().mockRejectedValue(new Error('boom'))
          }
        }
      }
      await expect(pendingPairingStore.clear()).resolves.toBeUndefined()
    })
  })

  describe('round-trip', () => {
    it('set then get returns the same value; clear then get returns null', async () => {
      await pendingPairingStore.set('round-trip-token')
      await expect(pendingPairingStore.get()).resolves.toBe('round-trip-token')
      await pendingPairingStore.clear()
      await expect(pendingPairingStore.get()).resolves.toBeNull()
    })
  })
})
