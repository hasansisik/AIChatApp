/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Appearance } from 'react-native';
import { Colors as OriginalColors } from '@/constants/Colors';
import React from 'react';

// Type definitions
export type ThemeType = 'light' | 'dark';
export type ColorName = keyof typeof OriginalColors.light & keyof typeof OriginalColors.dark;
export type ThemeColors = typeof OriginalColors.light | typeof OriginalColors.dark;

// Global theme state
let globalTheme: ThemeType = (Appearance.getColorScheme() ?? 'light') as ThemeType;
let isManuallySet = false;

// Global update counter for forcing re-renders
let globalUpdateCounter = 0;
const forceUpdateCallbacks = new Set<() => void>();

// Global theme change notification
const notifyAllComponents = () => {
  globalUpdateCounter++;
  forceUpdateCallbacks.forEach(callback => {
    try {
      callback();
    } catch (error) {
      console.error('Theme update error:', error);
    }
  });
};

// Theme management functions
const setGlobalTheme = (theme: ThemeType) => {
  isManuallySet = true;
  if (globalTheme !== theme) {
    globalTheme = theme;
    notifyAllComponents();
  }
};

const toggleGlobalTheme = () => {
  setGlobalTheme(globalTheme === 'light' ? 'dark' : 'light');
};

const resetToSystemTheme = () => {
  isManuallySet = false;
  const systemTheme = (Appearance.getColorScheme() ?? 'light') as ThemeType;
  if (globalTheme !== systemTheme) {
    globalTheme = systemTheme;
    notifyAllComponents();
  }
};

// System theme change handler
const handleSystemThemeChange = (preferences: any) => {
  if (!isManuallySet) {
    const newTheme = (preferences.colorScheme ?? 'light') as ThemeType;
    if (globalTheme !== newTheme) {
      globalTheme = newTheme;
      notifyAllComponents();
    }
  }
};

// Subscribe to system theme changes
Appearance.addChangeListener(handleSystemThemeChange);

// Theme Context
interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
  resetToSystemTheme: () => void;
  updateCounter: number;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

// Theme Provider Component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [updateCounter, setUpdateCounter] = React.useState(globalUpdateCounter);
  const [currentTheme, setCurrentTheme] = React.useState<ThemeType>(globalTheme);

  React.useEffect(() => {
    const callback = () => {
      setCurrentTheme(globalTheme);
      setUpdateCounter(globalUpdateCounter);
    };
    
    forceUpdateCallbacks.add(callback);
    return () => {
      forceUpdateCallbacks.delete(callback);
    };
  }, []);

  const contextValue: ThemeContextType = React.useMemo(() => ({
    theme: currentTheme,
    isDark: currentTheme === 'dark',
    colors: OriginalColors[currentTheme],
    toggleTheme: toggleGlobalTheme,
    setTheme: setGlobalTheme,
    resetToSystemTheme,
    updateCounter,
  }), [currentTheme, updateCounter]);

  return React.createElement(
    ThemeContext.Provider, 
    { value: contextValue }, 
    children
  );
};

// Main theme hook
export function useTheme(): ThemeContextType {
  const context = React.useContext(ThemeContext);
  
  if (context === undefined) {
    // Fallback for components outside ThemeProvider
    const [updateCounter, setUpdateCounter] = React.useState(globalUpdateCounter);
    const [currentTheme, setCurrentTheme] = React.useState<ThemeType>(globalTheme);
    
    React.useEffect(() => {
      const callback = () => {
        setCurrentTheme(globalTheme);
        setUpdateCounter(globalUpdateCounter);
      };
      
      forceUpdateCallbacks.add(callback);
      return () => {
        forceUpdateCallbacks.delete(callback);
      };
    }, []);

    return {
      theme: currentTheme,
      isDark: currentTheme === 'dark',
      colors: OriginalColors[currentTheme],
      toggleTheme: toggleGlobalTheme,
      setTheme: setGlobalTheme,
      resetToSystemTheme,
      updateCounter,
    };
  }
  
  return context;
}

// Hook to make any component reactive to theme changes
export const useReactiveColors = (): ThemeColors => {
  const [updateCounter, setUpdateCounter] = React.useState(globalUpdateCounter);
  
  React.useEffect(() => {
    const callback = () => {
      setUpdateCounter(globalUpdateCounter);
    };
    
    forceUpdateCallbacks.add(callback);
    return () => {
      forceUpdateCallbacks.delete(callback);
    };
  }, []);
  
  return OriginalColors[globalTheme];
};

// Create reactive Colors proxy
const createReactiveColors = () => {
  return new Proxy(OriginalColors, {
    get(target, prop) {
      if (prop === 'light' || prop === 'dark') {
        return target[prop];
      }
      return target[globalTheme][prop as keyof ThemeColors];
    }
  }) as unknown as ThemeColors;
};

// Export the reactive Colors object
export const Colors = createReactiveColors();

// Backward compatibility
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorName
) {
  const { theme } = useTheme();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return OriginalColors[theme][colorName];
  }
}

// Theme manager for direct usage
export const themeManager = {
  getTheme: () => globalTheme,
  setTheme: setGlobalTheme,
  toggleTheme: toggleGlobalTheme,
  resetToSystemTheme,
  subscribe: (callback: () => void) => {
    forceUpdateCallbacks.add(callback);
    return () => forceUpdateCallbacks.delete(callback);
  },
};