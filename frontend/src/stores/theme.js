import { ref, watchEffect } from 'vue'

/**
 * Tiny global theme store — persists the choice and toggles the `dark`
 * class on <html> (wired to the Tailwind `@custom-variant dark` in main.css).
 */
const STORAGE_KEY = 'tefera-theme'

function initialTheme() {
  if (typeof localStorage === 'undefined') return 'light'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return 'light' // the mockup is a light theme; keep it the default
}

const theme = ref(initialTheme())

if (typeof document !== 'undefined') {
  watchEffect(() => {
    document.documentElement.classList.toggle('dark', theme.value === 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, theme.value)
    } catch {
      /* storage can be unavailable (private mode) — non-fatal */
    }
  })
}

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, toggleTheme }
}
