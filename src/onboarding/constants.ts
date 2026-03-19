import { rawTokens } from '@tetherto/pearpass-lib-ui-kit'

// Ensuring all the dialogs have the same height to avoid layout jumps
export const ONBOARDING_DIALOG_WIDTH = '750px'
export const ONBOARDING_DIALOG_HEIGHT = '700px'
// TODO: could we import these from '@tetherto/pearpass-lib-ui-kit' ?

console.log('raw tokens', rawTokens)

//@ts-ignore
export const ONBOARDING_ICON_COLOR = rawTokens.colorPrimary //'#B0D944'
export const ONBOARDING_ICON_SIZE = 20
