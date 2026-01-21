import {
  LOCAL_STORAGE_KEYS,
  PASSKEY_VERIFICATION_OPTIONS
} from '../constants/storage'

/**
 * @returns {string} One of PASSKEY_VERIFICATION_OPTIONS values
 */
export const getPasskeyVerificationPreference = () => {
  const saved = localStorage.getItem(
    LOCAL_STORAGE_KEYS.PASSKEY_VERIFICATION_PREFERENCE
  )
  return saved || PASSKEY_VERIFICATION_OPTIONS.REQUESTED
}
