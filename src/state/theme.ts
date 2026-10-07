/**
 * The light/dark choice.
 *
 * The theme is a single `.dark` class on <html>. Every colour in the app is a
 * `--color-*` variable read out of `app/globals.css` (Tailwind v4 utilities compile to
 * `var()` calls), so flipping that class re-skins the whole toy-OS chrome without any
 * component knowing about themes. `THEME_SCRIPT` applies the class before first paint —
 * a dark mode never flashes light — and React only reads and writes the preference
 * afterwards. The choice lives in localStorage; with nothing stored the app follows
 * the operating system.
 */
const STORAGE_KEY = 'dubu-theme'

export type Theme = 'light' | 'dark'

/** Inline script for the document head; runs once, before any pixels. */
export const THEME_SCRIPT = `(function(){try{var s=localStorage.getItem('${STORAGE_KEY}');var d=s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`

export const readTheme = (): Theme =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'

/** Has the user explicitly chosen? If not, the OS preference stays in charge. */
export const hasStoredTheme = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}

export const writeTheme = (theme: Theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* private mode — the choice lives for this page load only */
  }
}
