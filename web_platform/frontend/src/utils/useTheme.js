import { useState, useEffect } from 'react';

export function getSystemTheme() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
}

export function applyTheme(mode) {
  const activeTheme = mode === 'system' ? getSystemTheme() : mode;
  document.documentElement.setAttribute('data-theme', activeTheme);
  return activeTheme;
}

export default function useTheme() {
  const [themeMode, setThemeMode] = useState(() => {
    try {
      const saved = localStorage.getItem('telemed_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch (e) {}
    return 'system';
  });

  const [activeTheme, setActiveTheme] = useState(() => applyTheme(themeMode));

  useEffect(() => {
    const computed = applyTheme(themeMode);
    setActiveTheme(computed);
    try {
      localStorage.setItem('telemed_theme', themeMode);
    } catch (e) {}

    if (themeMode === 'system' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const newSystem = applyTheme('system');
        setActiveTheme(newSystem);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  return {
    themeMode,
    activeTheme,
    setThemeMode
  };
}
