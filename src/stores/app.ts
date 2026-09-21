import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { setLocalStorage, getLocalStorage } from '@/utils/storage'

export type ThemeMode = 'light' | 'dark'
export type ColorScheme = 'office' | 'blue' | 'teal' | 'violet' | 'orange'

const colorSchemes: Record<
  ColorScheme,
  {
    name: string
    primary: string
    hover: string
    light3: string
    light5: string
    light7: string
    light8: string
    light9: string
    dark: string
  }
> = {
  office: {
    name: '原点蓝',
    primary: '#245b78',
    hover: '#1d4b64',
    light3: '#5c8ba0',
    light5: '#8caebb',
    light7: '#bdd3dc',
    light8: '#d4e3e8',
    light9: '#e6f1f4',
    dark: '#183f55',
  },
  blue: {
    name: '湖水蓝',
    primary: '#1a73e8',
    hover: '#1557b0',
    light3: '#669df0',
    light5: '#9fc1f6',
    light7: '#c8dcfb',
    light8: '#d9e7fc',
    light9: '#e8f0fe',
    dark: '#1557b0',
  },
  teal: {
    name: '商务青',
    primary: '#0f766e',
    hover: '#0b5f59',
    light3: '#5aa9a3',
    light5: '#8fc3bf',
    light7: '#b9dcd9',
    light8: '#d2eae8',
    light9: '#eaf6f5',
    dark: '#0b5f59',
  },
  violet: {
    name: '雅致紫',
    primary: '#6750a4',
    hover: '#50398d',
    light3: '#9b8bc5',
    light5: '#bdb2db',
    light7: '#d6d0e9',
    light8: '#e3dff0',
    light9: '#f1eff8',
    dark: '#50398d',
  },
  orange: {
    name: '活力橙',
    primary: '#c2410c',
    hover: '#9a3412',
    light3: '#df8a66',
    light5: '#ebb19a',
    light7: '#f3cfc0',
    light8: '#f7ddd2',
    light9: '#fdf1ed',
    dark: '#9a3412',
  },
}

function applyTheme(mode: ThemeMode, scheme: ColorScheme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const palette = colorSchemes[scheme]
  root.classList.toggle('dark', mode === 'dark')
  root.dataset.theme = scheme
  root.style.setProperty('--color-primary', palette.primary)
  root.style.setProperty('--color-primary-soft', palette.light9)
  root.style.setProperty('--el-color-primary', palette.primary)
  root.style.setProperty('--el-color-primary-light-3', palette.light3)
  root.style.setProperty('--el-color-primary-light-5', palette.light5)
  root.style.setProperty('--el-color-primary-light-7', palette.light7)
  root.style.setProperty('--el-color-primary-light-8', palette.light8)
  root.style.setProperty('--el-color-primary-light-9', palette.light9)
  root.style.setProperty('--el-color-primary-dark-2', palette.dark)
  // 侧栏保持中性深色，只让选中条使用主题色，避免整块菜单被染成高饱和色。
  const menuSurface = mode === 'dark' ? '#171717' : '#18384b'
  const menuHover = mode === 'dark' ? '#27272a' : '#234b60'
  const menuSub = 'transparent'
  root.style.setProperty('--menu-surface', menuSurface)
  root.style.setProperty('--menu-text', mode === 'dark' ? '#d4d4d8' : '#d8e0ea')
  root.style.setProperty('--menu-hover', menuHover)
  root.style.setProperty('--menu-active', mode === 'dark' ? palette.dark : palette.primary)
  root.style.setProperty('--menu-hover-bg', mode === 'dark' ? 'rgb(255 255 255 / 6%)' : 'rgb(255 255 255 / 8%)')
  root.style.setProperty('--menu-active-bg', mode === 'dark' ? 'rgb(242 193 106 / 14%)' : 'rgb(242 193 106 / 12%)')
  root.style.setProperty('--menu-sub', mode === 'dark' ? '#202123' : menuSub)
  root.style.setProperty('--menu-brand-text', mode === 'dark' ? '#f8fafc' : '#ffffff')
  root.style.setProperty('--menu-brand-muted', mode === 'dark' ? '#a1a1aa' : '#a8b3c4')
}

const useAppStore = defineStore('app', () => {
  const isFold = ref<boolean>(getLocalStorage('isFold') === 'true')
  const themeMode = ref<ThemeMode>(getLocalStorage('themeMode') === 'dark' ? 'dark' : 'light')
  const storedScheme = getLocalStorage('colorScheme')
  const colorScheme = ref<ColorScheme>(
    storedScheme && storedScheme in colorSchemes ? (storedScheme as ColorScheme) : 'office',
  )

  const toggleCollapse = () => {
    isFold.value = !isFold.value
    setLocalStorage('isFold', isFold.value.toString())
  }

  const setThemeMode = (mode: ThemeMode) => {
    themeMode.value = mode
  }

  const toggleTheme = () => setThemeMode(themeMode.value === 'light' ? 'dark' : 'light')

  const setColorScheme = (scheme: ColorScheme) => {
    if (colorSchemes[scheme]) colorScheme.value = scheme
  }

  watch(
    [themeMode, colorScheme],
    ([mode, scheme]) => {
      setLocalStorage('themeMode', mode)
      setLocalStorage('colorScheme', scheme)
      applyTheme(mode, scheme)
    },
    { immediate: true },
  )

  return {
    isFold,
    toggleCollapse,
    themeMode,
    colorScheme,
    colorSchemes,
    setThemeMode,
    toggleTheme,
    setColorScheme,
  }
})

export default useAppStore
