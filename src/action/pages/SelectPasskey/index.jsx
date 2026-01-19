import { useMemo } from 'react'

import { t } from '@lingui/core/macro'
import { RECORD_TYPES, useRecords } from 'pearpass-lib-vault'

import { useRouter } from '../../../shared/context/RouterContext'
import { logger } from '../../../shared/utils/logger'
import { PasskeyContainer } from '../../containers/PasskeyContainer'

export const SelectPasskey = () => {
  const { state: routerState } = useRouter()
  const { data: records } = useRecords()

  const { serializedPublicKey, requestId, requestOrigin, tabId } = routerState

  const handleRecordSelect = (record) => {
    chrome.runtime
      .sendMessage({
        type: 'getAssertionCredential',
        serializedPublicKey,
        credential: record.data.credential,
        requestOrigin
      })
      .then((response) => {
        chrome.tabs.sendMessage(parseInt(tabId), {
          type: 'gotPasskey',
          requestId,
          credential: response.assertionCredential
        })
      })
      .catch((error) => {
        logger.error(
          'Failed to get assertion credential:',
          error?.message || error
        )
        chrome.tabs.sendMessage(parseInt(tabId), {
          type: 'gotPasskey',
          requestId,
          credential: null
        })
      })
      .finally(() => {
        window.close()
      })
  }

  const handleCancel = () => {
    chrome.tabs.sendMessage(parseInt(tabId), {
      type: 'gotPasskey',
      requestId,
      credential: null
    })
    window.close()
  }

  const handleGetHardwarePasskey = () => {
    chrome.tabs
      .sendMessage(parseInt(tabId), {
        type: 'getThirdPartyKey',
        requestId
      })
      .finally(() => {
        window.close()
      })
  }

  const recordsFiltered = useMemo(
    () =>
      records.filter((record) => {
        if (record.type !== RECORD_TYPES.LOGIN) return false
        if (!record.data?.credential) return false
        return true
      }),
    [records]
  )

  return (
    <PasskeyContainer
      title={t`Use Passkey?`}
      records={recordsFiltered}
      description={t`Select one of your stored passkeys to sign in.`}
      emptyMessage={t`No passkeys found for this website.`}
      onRecordSelect={handleRecordSelect}
      onHardwareKeyClick={handleGetHardwarePasskey}
    >
      <div className="flex gap-[40px] pt-[20px] pb-[20px]">
        <button
          onClick={handleCancel}
          className="text-primary400-mode1 flex-1 rounded-[10px] bg-black py-2 font-semibold"
        >
          {t`Cancel`}
        </button>
      </div>
    </PasskeyContainer>
  )
}
