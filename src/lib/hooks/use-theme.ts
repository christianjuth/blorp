import { useSyncExternalStore } from "react";

// themeStore.ts
type Theme = "light" | "dark";

// create the MQL once
const mql = window.matchMedia("(prefers-color-scheme: dark)");

// current value
let currentTheme: Theme = mql.matches ? "dark" : "light";

// subscriptions
const listeners = new Set<() => void>();

// listen once
const handler = () => {
  const next = mql.matches ? "dark" : "light";
  if (next !== currentTheme) {
    currentTheme = next;
    listeners.forEach((cb) => cb());
  }
};
if (mql.addEventListener) {
  mql.addEventListener("change", handler);
} else {
  mql.addListener(handler);
}

// subscribe & snapshot
function subscribeTheme(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getThemeSnapshot(): Theme {
  return currentTheme;
}

/**
 * useTheme
 *
 * A custom React hook that listens to the user’s system color‐scheme preference
 * and returns either "dark" or "light".
 *
 * Internally, it registers a single global `matchMedia('(prefers-color-scheme: dark)')`
 * listener and uses `useSyncExternalStore` so components
 * only update when the preference actually changes.
 *
 * @returns The current theme, either "dark" or "light".
 *
 * @example
 * function ThemedButton() {
 *   const theme = useTheme();
 *   return (
 *     <button
 *       style={{
 *         background: theme === 'dark' ? '#222' : '#eee',
 *         color: theme === 'dark' ? '#fff' : '#000',
 *         padding: '0.5rem 1rem',
 *       }}
 *     >
 *       I adapt to your theme!
 *     </button>
 *   );
 * }
 *
 * @example
 * function AppContainer() {
 *   const theme = useTheme();
 *   return (
 *     <div className={theme === 'dark' ? 'dark-mode' : 'light-mode'}>
 *       <Header />
 *       <MainContent />
 *     </div>
 *   );
 * }
 */
export function useTheme() {
  return useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeSnapshot,
  );
}
