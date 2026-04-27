import { useEffect, useState } from 'react'

import { secureChannelMessages } from '../shared/services/messageBridge'
import { pendingPairingStore } from '../shared/services/pendingPairingStore'

const closeCurrentTab = async () => {
  const tab = await chrome.tabs.getCurrent()
  if (tab?.id !== undefined) {
    await chrome.tabs.remove(tab.id)
  }
}

export const useOnboardingInitialStep = (): number | null => {
  const [step, setStep] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      let result
      try {
        result = await secureChannelMessages.getBlockingState()
      } catch {
        if (!cancelled) setStep(1)
        return
      }
      if (cancelled) return

      if (result?.success && result.blockingState === null) {
        await closeCurrentTab()
        return
      }

      const pending = await pendingPairingStore.get()
      if (cancelled) return
      setStep(pending ? 3 : 1)
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return step
}
