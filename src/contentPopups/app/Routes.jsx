import { useEffect, useState } from 'react'

import { useRouter } from '../../shared/context/RouterContext'
import {
  getAutofillEnabled,
  onAutofillEnabledChanged
} from '../../shared/utils/autofillSetting'
import { isV2 } from '../../shared/utils/designVersion'
import { Autofill } from '../views/Autofill'
import { LoginDetect } from '../views/LoginDetect'
import { Logo } from '../views/Logo'
import { PasswordGenerator } from '../views/PasswordGenerator'
import { PasswordGeneratorV2 } from '../views/PasswordGeneratorV2'
import { PasswordSuggestion } from '../views/PasswordSuggestion'
import { PasswordSuggestionV2 } from '../views/PasswordSuggestionV2'

export const Routes = () => {
  const { currentPage } = useRouter()
  const [isAutofillEnabled, setIsAutoFillEnabled] = useState(true)

  useEffect(() => {
    getAutofillEnabled().then((isEnabled) => setIsAutoFillEnabled(isEnabled))
    const unsubscribe = onAutofillEnabledChanged((isEnabled) => {
      setIsAutoFillEnabled(isEnabled)
    })
    return unsubscribe
  }, [])

  switch (currentPage) {
    case 'logo':
      if (!isAutofillEnabled) return null
      return <Logo />
    case 'loginDetect':
      return <LoginDetect />
    case 'autofill':
      if (!isAutofillEnabled) return null
      return <Autofill />
    case 'passwordSuggestion':
      return isV2() ? <PasswordSuggestionV2 /> : <PasswordSuggestion />
    case 'passwordGenerator':
      return isV2() ? <PasswordGeneratorV2 /> : <PasswordGenerator />
    default:
      return null
  }
}
