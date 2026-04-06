'use client';

import { useEffect, useState, useCallback, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'smartoffice-theme';

function getThemeFromDOM(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function useTheme() {
  // Use useSyncExternalStore to avoid hydration mismatch
  // The FOUC-prevention script in layout.tsx sets the class before React hydrates
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setThemeState(getThemeFromDOM());
    setMounted(true);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, []);

  const toggle = useCallback(() => {
    const current = document.documentElement.classList.contains('dark');
    setTheme(current ? 'light' : 'dark');
  }, [setTheme]);

  // Before mount, return 'light' to match server render; isDark won't show wrong icon briefly
  const isDark = mounted ? theme === 'dark' : false;

  return { theme, setTheme, toggle, isDark, mounted };
}
