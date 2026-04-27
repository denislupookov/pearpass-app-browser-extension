const KEY = 'pendingPairingToken'

const getArea = (): chrome.storage.StorageArea | null => {
  if (typeof chrome === 'undefined' || !chrome.storage) return null
  return chrome.storage.session ?? chrome.storage.local
}

export const pendingPairingStore = {
  async set(token: string): Promise<void> {
    const area = getArea()
    if (!area) throw new Error('chrome.storage is not available')
    await area.set({ [KEY]: token })
  },
  async get(): Promise<string | null> {
    const area = getArea()
    if (!area) return null
    try {
      const res = await area.get(KEY)
      const value = res[KEY]
      return typeof value === 'string' ? value : null
    } catch {
      return null
    }
  },
  async clear(): Promise<void> {
    const area = getArea()
    if (!area) return
    try {
      await area.remove(KEY)
    } catch {}
  }
}
