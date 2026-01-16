import { useEffect, useMemo, useRef, useState } from 'react'

import { useVault } from 'pearpass-lib-vault'

import { PopupCard } from '../../../shared/components/PopupCard'
import { RecordItem } from '../../../shared/components/RecordItem'
import { useRouter } from '../../../shared/context/RouterContext'
import { UserIcon } from '../../../shared/icons/UserIcon'
import { UserKeyIcon } from '../../../shared/icons/UserKeyIcon'
import { MESSAGE_TYPES } from '../../../shared/services/messageBridge'
import { useFilteredRecords } from '../../hooks/useFilteredRecords'

export const Autofill = () => {
  const popupRef = useRef(null)
  const { state: routerState } = useRouter()

  const { refetch: refetchVault } = useVault()

  const { filteredRecords } = useFilteredRecords()

  const [passkeyRequest, setPasskeyRequest] = useState(null)
  const [currentTabId, setCurrentTabId] = useState(null)

  useEffect(() => {
    chrome.runtime.sendMessage(
      { type: MESSAGE_TYPES.GET_CONDITIONAL_PASSKEY_REQUEST },
      (response) => {
        if (response?.request) {
          setPasskeyRequest(response.request)
          setCurrentTabId(response.tabId)
        }
      }
    )

    refetchVault()
  }, [])

  const passkeyRecords = useMemo(() => {
    if (!passkeyRequest || !filteredRecords) return []

    return filteredRecords.filter((record) => {
      if (record.type !== 'login' || !record.data?.credential) return false

      const origin = passkeyRequest.requestOrigin
      if (
        origin &&
        record.data?.websites?.some(
          (site) => site.includes(origin) || origin.includes(site)
        )
      ) {
        return true
      }
      return false
    })
  }, [filteredRecords, passkeyRequest])

  useEffect(() => {
    if (!popupRef.current) return

    window.parent.postMessage(
      {
        type: 'setStyles',
        data: {
          iframeId: routerState?.iframeId,
          iframeType: routerState?.iframeType,
          style: {
            width: `${popupRef.current.offsetWidth}px`,
            height: `${popupRef.current.offsetHeight}px`,
            borderRadius: '12px'
          }
        }
      },
      '*'
    )
  }, [routerState?.iframeId, routerState?.iframeType])

  const handleAutofillLogin = (record) => {
    const targetOrigin = document.referrer
      ? new URL(document.referrer).origin
      : '*'

    window.parent.postMessage(
      {
        type: 'autofillLogin',
        data: {
          iframeId: routerState?.iframeId,
          iframeType: routerState?.iframeType,
          username: record?.data?.username,
          password: record?.data?.password
        }
      },
      targetOrigin
    )
  }

  const handleAutofillIdentity = (record) => {
    window.parent.postMessage(
      {
        type: 'autofillIdentity',
        data: {
          iframeId: routerState?.iframeId,
          iframeType: routerState?.iframeType,
          name: record?.data?.fullName,
          email: record?.data?.email,
          phoneNumber: record?.data?.phoneNumber,
          address: record?.data?.address,
          zip: record?.data?.zip,
          city: record?.data?.city,
          region: record?.data?.region,
          country: record?.data?.country
        }
      },
      '*'
    )
  }

  const handleAutofillPasskey = (record) => {
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.AUTHENTICATE_WITH_PASSKEY,
      credential: record.data.credential,
      tabId: currentTabId
    })

    window.parent.postMessage(
      {
        type: 'close',
        data: {
          iframeId: routerState?.iframeId,
          iframeType: routerState?.iframeType
        }
      },
      '*'
    )
  }

  const handleAutoFill = (record) => {
    const isPasskey = record.type === 'login' && record.data?.credential

    if (isPasskey) {
      handleAutofillPasskey(record)
      return
    }

    if (routerState.recordType === 'identity') {
      handleAutofillIdentity(record)
    } else if (routerState.recordType === 'login') {
      handleAutofillLogin(record)
    }
  }

  const regularLogins = useMemo(
    () =>
      (filteredRecords || []).filter(
        (r) => !(r.type === 'login' && r.data?.credential)
      ),
    [filteredRecords]
  )

  console.log(filteredRecords)
  return (
    <PopupCard className="flex h-[195px] w-[280px] flex-col p-2" ref={popupRef}>
      <div className="flex flex-col gap-2 overflow-x-hidden overflow-y-auto">
        <span className="text-white-mode1 text-sm">Make the acces with...</span>

        <div className="flex flex-col gap-2">
          <div className="flex flex-col">
            {passkeyRecords.length > 0 && (
              <>
                <div className="text-white-mode1 mb-[5px] flex items-center gap-2 text-sm">
                  <UserKeyIcon size="24" />
                  <span>Passkey</span>
                </div>
                {passkeyRecords.map((record) => {
                  const websiteDomain = record?.data?.websites?.[0]
                  return (
                    <div
                      key={record.id}
                      className="bg-grey500-mode1 cursor-pointer rounded-[10px] p-2 hover:bg-[rgba(134,170,172,0.2)]"
                      onClick={() => handleAutoFill(record)}
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
                })}
              </>
            )}
          </div>

          <div className="flex flex-col">
            {regularLogins.length > 0 && (
              <>
                <div className="text-white-mode1 mb-[5px] flex items-center gap-2 text-sm">
                  <UserIcon size="24" />
                  <span>Password</span>
                </div>
                {regularLogins.map((record) => {
                  const websiteDomain =
                    record.type === 'login' ? record?.data?.websites?.[0] : null
                  return (
                    <div
                      key={record.id}
                      className="bg-grey500-mode1 cursor-pointer rounded-[10px] p-2 hover:bg-[rgba(134,170,172,0.2)]"
                      onClick={() => handleAutoFill(record)}
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
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </PopupCard>
  )
}
