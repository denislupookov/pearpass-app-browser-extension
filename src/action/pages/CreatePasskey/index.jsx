import { useMemo, useState } from 'react'

import { t } from '@lingui/core/macro'
import { RECORD_TYPES, useRecords } from 'pearpass-lib-vault'

import { sanitizeCredentialForPage } from './utils/sanitizeCredentialForPage'
import { ReplacePasskeyModalContent } from '../../../shared/containers/ReplacePasskeyModalContent'
import { useModal } from '../../../shared/context/ModalContext'
import { useRouter } from '../../../shared/context/RouterContext'
import { PlusIcon } from '../../../shared/icons/PlusIcon'
import { logger } from '../../../shared/utils/logger'
import { normalizeUrl } from '../../../shared/utils/normalizeUrl'
import { PasskeyContainer } from '../../containers/PasskeyContainer'

export const CreatePasskey = () => {
  const { state: routerState, navigate } = useRouter()
  const { requestId, tabId, serializedPublicKey, requestOrigin } = routerState
  const { setModal } = useModal()
  const { data: records } = useRecords()

  const [selectedRecord, setSelectedRecord] = useState(null)

  const saveToExistingRecord = async (record) => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'readyForPasskeyPayload',
        requestOrigin,
        serializedPublicKey
      })

      const { credential } = response

      chrome.tabs.sendMessage(parseInt(tabId), {
        type: 'savedPasskey',
        requestId,
        recordId: record.id,
        credential: sanitizeCredentialForPage(credential)
      })

      navigate('createOrEditCategory', {
        params: { recordId: record.id },
        state: {
          inPasskeyFlow: true,
          passkeyCredential: credential,
          serializedPublicKey,
          requestId,
          requestOrigin,
          tabId
        }
      })
    } catch (error) {
      logger.error(
        'Failed to save passkey to existing record:',
        error?.message || error
      )
    }
  }

  const handleCreateNewLogin = () => {
    chrome.runtime
      .sendMessage({
        type: 'readyForPasskeyPayload',
        requestOrigin,
        serializedPublicKey
      })
      .then((response) => {
        const { credential, publicKey } = response

        chrome.tabs.sendMessage(parseInt(tabId), {
          type: 'savedPasskey',
          requestId,
          recordId: null,
          credential: sanitizeCredentialForPage(credential)
        })

        navigate('createOrEditCategory', {
          params: { recordType: RECORD_TYPES.LOGIN },
          state: {
            inPasskeyFlow: true,
            passkeyCredential: credential,
            initialData: {
              title: publicKey.rp.name,
              username: publicKey.user.name,
              websites: [normalizeUrl(publicKey.rp.id, true)]
            },
            serializedPublicKey,
            requestId,
            requestOrigin,
            tabId
          }
        })
      })
      .catch((error) => {
        logger.error('Failed to create passkey:', error?.message || error)
        chrome.tabs.sendMessage(parseInt(tabId), {
          type: 'savedPasskey',
          requestId: requestId,
          recordId: null
        })
      })
  }

  const handleRecordSelect = (record) => {
    setSelectedRecord(selectedRecord?.id === record.id ? null : record)
  }

  const handleCancel = () => {
    chrome.tabs
      .sendMessage(parseInt(tabId), {
        type: 'savedPasskey',
        requestId: requestId,
        recordId: null
      })
      .finally(() => {
        window.close()
      })
  }

  const handleGetHardwarePasskey = () => {
    chrome.tabs
      .sendMessage(parseInt(tabId), {
        type: 'createThirdPartyKey',
        requestId
      })
      .finally(() => {
        window.close()
      })
  }

  const handleSaveToSelected = async () => {
    if (!selectedRecord) return

    if (selectedRecord.data?.credential) {
      setModal(
        <ReplacePasskeyModalContent
          onConfirm={async () => {
            try {
              await saveToExistingRecord(selectedRecord)
            } catch (error) {
              logger.error(
                'Failed to save passkey to existing record:',
                error?.message || error
              )
            }
          }}
        />
      )
      return
    }

    try {
      await saveToExistingRecord(selectedRecord)
    } catch (error) {
      logger.error(
        'Failed to save passkey to existing record:',
        error?.message || error
      )
    }
  }

  const recordsFiltered = useMemo(
    () =>
      records.filter((record) => {
        if (record.type !== RECORD_TYPES.LOGIN) return false
        return record
      }),
    [records]
  )

  return (
    <PasskeyContainer
      title={t`Save Passkey?`}
      description={t`Choose where to store this Passkey, or create a new item.`}
      emptyMessage={t`No matching login found, search it or create a new login to store this passkey.`}
      selectedRecord={selectedRecord}
      records={recordsFiltered}
      onRecordSelect={handleRecordSelect}
      onHardwareKeyClick={handleGetHardwarePasskey}
    >
      <div className="flex gap-[40px] pt-[20px] pb-[20px]">
        <button
          onClick={selectedRecord ? handleSaveToSelected : handleCreateNewLogin}
          className="bg-primary400-mode1 flex flex-1 items-center justify-center gap-2 rounded-[10px] py-2 font-semibold text-black"
        >
          <PlusIcon size="24" color="#000" />
          {t`Create new login`}
        </button>
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
