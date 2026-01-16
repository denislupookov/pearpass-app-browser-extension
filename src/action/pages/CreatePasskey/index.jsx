import { useEffect, useMemo, useState } from 'react'

import { t } from '@lingui/core/macro'
import {
  RECORD_TYPES,
  useRecords,
  useUserData,
  useVault,
  useVaults
} from 'pearpass-lib-vault'

import { InputSearch } from '../../../shared/components/InputSearch'
import { RecordItem } from '../../../shared/components/RecordItem'
import { Vault } from '../../../shared/components/Vault'
import { ReplacePasskeyModalContent } from '../../../shared/containers/ReplacePasskeyModalContent'
import { useGlobalLoading } from '../../../shared/context/LoadingContext'
import { useModal } from '../../../shared/context/ModalContext'
import { useRouter } from '../../../shared/context/RouterContext'
import { ArrowDownIcon } from '../../../shared/icons/ArrowDownIcon'
import { HardwareKey } from '../../../shared/icons/HardwareKey'
import { LockCircleIcon } from '../../../shared/icons/LockCircleIcon'
import { PlusIcon } from '../../../shared/icons/PlusIcon'
import { UserIcon } from '../../../shared/icons/UserIcon'
import { logger } from '../../../shared/utils/logger'
import { normalizeUrl } from '../../../shared/utils/normalizeUrl'

export const CreatePasskey = () => {
  const { state: routerState, navigate } = useRouter()
  const { requestId, tabId, serializedPublicKey, requestOrigin } = routerState
  const { setModal } = useModal()

  const { refetch: refetchVault, data: vaultData } = useVault()
  const { data: vaultsData, refetch: refetchVaults } = useVaults()
  const { data: records, refetch: refetchRecords } = useRecords()
  const { refetch: refetchUserData } = useUserData()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isVaultDropdownOpen, setIsVaultDropdownOpen] = useState(false)
  const [isVaultChanging, setIsVaultChanging] = useState(false)

  const availableVaults = useMemo(
    () => (vaultsData || []).filter((vault) => vault.id !== vaultData?.id),
    [vaultsData, vaultData?.id]
  )

  const handleVaultSelect = async (vault) => {
    setIsVaultChanging(true)
    try {
      await refetchVault(vault.id)
      setIsVaultDropdownOpen(false)
    } catch (error) {
      logger.error('Failed to switch vault:', error)
    } finally {
      setIsVaultChanging(false)
    }
  }

  useGlobalLoading({ isLoading: isVaultChanging })

  const publicKeyData = useMemo(() => {
    if (!serializedPublicKey) return null
    try {
      return JSON.parse(serializedPublicKey)
    } catch {
      return null
    }
  }, [serializedPublicKey])

  const filteredRecords = useMemo(() => {
    if (!records || !publicKeyData) return []

    const rpId = publicKeyData.rp?.id
    const normalizedRpId = rpId ? normalizeUrl(rpId, true) : null

    let filtered = records.filter((record) => {
      if (record.type !== RECORD_TYPES.LOGIN) return false

      const websites = record.data?.websites || []
      if (!normalizedRpId) return true

      return websites.some((site) => {
        const normalizedSite = normalizeUrl(site, true)
        return (
          normalizedSite === normalizedRpId ||
          normalizedSite.includes(normalizedRpId) ||
          normalizedRpId.includes(normalizedSite)
        )
      })
    })

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (record) =>
          record.data.title?.toLowerCase().includes(query) ||
          record.data.username?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [records, publicKeyData, searchQuery])

  useEffect(() => {
    const refreshData = async () => {
      const currentUserData = await refetchUserData()

      if (!currentUserData?.isLoggedIn || !currentUserData?.isVaultOpen) {
        const passkeyParams = {
          page: 'createPasskey',
          serializedPublicKey,
          requestId,
          requestOrigin,
          tabId,
          inPasskeyFlow: true
        }

        const targetState = !currentUserData?.isLoggedIn
          ? 'masterPassword'
          : 'vaults'

        navigate('welcome', {
          params: { state: targetState },
          state: passkeyParams
        })
        return
      }

      await Promise.all([refetchVault(), refetchRecords(), refetchVaults()])
    }
    refreshData()
  }, [])

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
        credential
      })

      navigate('createOrEditCategory', {
        params: { recordId: record.id },
        state: {
          inPasskeyFlow: true,
          passkeyCredential: credential
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
          credential
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
            }
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

  const handleCancel = () => {
    chrome.tabs.sendMessage(parseInt(tabId), {
      type: 'savedPasskey',
      requestId: requestId,
      recordId: null
    })
    window.close()
  }

  const handleGetHardwarePasskey = () => {
    chrome.tabs.sendMessage(parseInt(tabId), {
      type: 'createThirdPartyKey',
      requestId
    })
    window.close()
  }

  return (
    <div className="bg-grey500-mode1 flex h-full w-full flex-col p-[20px]">
      <div className="flex flex-1 flex-col gap-[15px] overflow-auto">
        <h1 className="font-inter text-[24px] leading-[normal] font-bold text-white">
          {t`Save Passkey?`}
        </h1>

        <div className="flex h-[42px] items-center self-stretch rounded-[10px] bg-[#050B06] px-[10px] py-[9px]">
          <InputSearch
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t`Search...`}
          />
        </div>

        <div className="relative inline-block">
          <button
            onClick={() => setIsVaultDropdownOpen(!isVaultDropdownOpen)}
            className="bg-grey400-mode1 flex items-center gap-[7px] rounded-[10px] px-[9px] py-[10px]"
          >
            <ArrowDownIcon size="12" />
            <LockCircleIcon size="24" />
            <span className="font-inter text-[14px] font-normal text-white">
              {vaultData?.name || t`Personal`}
            </span>
          </button>

          {isVaultDropdownOpen && availableVaults.length > 0 && (
            <div className="bg-grey500-mode1 absolute top-full right-0 left-0 z-10 mt-1 flex flex-col gap-2 rounded-[10px] p-2">
              {availableVaults.map((vault) => (
                <Vault
                  key={vault.id}
                  vault={vault}
                  onClick={() => handleVaultSelect(vault)}
                />
              ))}
            </div>
          )}
        </div>

        <p className="font-inter text-[16px] leading-[normal] text-white">
          {t`Choose where to store this Passkey, or create a new item.`}
        </p>

        <div className="flex flex-1 flex-col gap-[10px]">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => {
              const isSelected = selectedRecord?.id === record.id
              const websiteDomain = record.data?.websites?.[0]

              return (
                <div
                  key={record.id}
                  onClick={() => setSelectedRecord(isSelected ? null : record)}
                  className={`cursor-pointer rounded-[10px] p-[10px] ${
                    isSelected
                      ? 'border border-[#BADE5B] bg-[rgba(186,222,91,0.2)]'
                      : 'bg-grey500-mode1 hover:bg-[rgba(134,170,172,0.2)]'
                  }`}
                >
                  <RecordItem
                    websiteDomain={websiteDomain}
                    title={record.data?.title}
                    isFavorite={record.isFavorite}
                    type={record.type}
                    folder={record.data?.username}
                  />
                </div>
              )
            })
          ) : (
            <div className="flex items-center justify-center gap-[10px] self-stretch rounded-[10px] bg-[#303030] px-[15px] py-[10px]">
              <div className="flex">
                <UserIcon width="24" color="#E6AA68" />
              </div>
              <span className="font-inter text-[16px] leading-[normal] font-normal text-white">
                {t`No matching login found, search it or create a new login to store this passkey.`}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleGetHardwarePasskey}
          className="flex items-center gap-[8px] self-start px-[12px] py-[5px]"
        >
          <HardwareKey width="18" height="18" color="#BADE5B" />
          <span className="font-inter text-[14px] font-normal text-[#BADE5B]">
            {t`Use device or hardware key`}
          </span>
        </button>
      </div>

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
    </div>
  )
}
