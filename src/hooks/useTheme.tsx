import { useEffect } from 'react';

export function useTheme() {
  useEffect(() => {
    document.documentElement.classList.add('light');
  }, []);

  return { theme: 'light' as const, toggleTheme: () => {} };
}
