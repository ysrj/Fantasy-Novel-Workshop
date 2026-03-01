import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Language, Translations, zhCN, enUS } from '../i18n'

interface SettingsStore {
  language: Language
  theme: 'light' | 'dark'
  autoSaveInterval: number
  fontSize: number
  font: string
  customDataPath: string
  ollamaAddress: string
  aiModel: string
  setLanguage: (lang: Language) => void
  setTheme: (theme: 'light' | 'dark') => void
  setAutoSaveInterval: (interval: number) => void
  setFontSize: (size: number) => void
  setFont: (font: string) => void
  setCustomDataPath: (path: string) => void
  setOllamaAddress: (address: string) => void
  setAiModel: (model: string) => void
  getTranslations: () => Translations
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      language: 'zh-CN',
      theme: 'light',
      autoSaveInterval: 30,
      fontSize: 16,
      font: 'monospace',
      customDataPath: '',
      ollamaAddress: 'http://localhost:11434',
      aiModel: 'llama2',
      
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setAutoSaveInterval: (autoSaveInterval) => set({ autoSaveInterval }),
      setFontSize: (fontSize) => set({ fontSize }),
      setFont: (font) => set({ font }),
      setCustomDataPath: (customDataPath) => set({ customDataPath }),
      setOllamaAddress: (ollamaAddress) => set({ ollamaAddress }),
      setAiModel: (aiModel) => set({ aiModel }),
      
      getTranslations: () => {
        const { language } = get()
        return language === 'zh-CN' ? zhCN : enUS
      }
    }),
    {
      name: 'fnw-settings'
    }
  )
)
