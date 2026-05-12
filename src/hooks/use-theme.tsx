import { createContext, useContext, useEffect, ReactNode } from 'react';

type Theme = 'light';

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'light',
  toggle: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('logitrack-theme', 'light');
  }, []);

  return <ThemeCtx.Provider value={{ theme: 'light', toggle: () => {} }}>{children}</ThemeCtx.Provider>;
};

export const useTheme = () => useContext(ThemeCtx);
