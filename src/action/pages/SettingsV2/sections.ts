import type React from 'react'

export type SettingsItemKey =
  | 'app-preferences'
  | 'your-vaults'
  | 'shared-items'
  | 'shared-vaults'
  | 'language'
  | 'theme'
  | 'report-a-problem'
  | 'app-version'

export type SettingsSectionKey =
  | 'security'
  | 'vault'
  | 'shared-elements'
  | 'appearance'
  | 'about'

export type SectionItem = {
  key: SettingsItemKey
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export type Section = {
  key: SettingsSectionKey
  title: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  items: SectionItem[]
}
