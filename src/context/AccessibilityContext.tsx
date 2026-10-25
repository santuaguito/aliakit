'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AccessibilitySettings,
  FontSizeSetting,
  ColorThemeSetting,
  SpacingSetting,
} from '@/types/aliakit';

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  setFontSize: (size: FontSizeSetting) => void;
  setColorTheme: (theme: ColorThemeSetting) => void;
  setLineSpacing: (spacing: SpacingSetting) => void;
  setLetterSpacing: (spacing: SpacingSetting) => void;
  toggleDyslexicFont: () => void;
  toggleReadingRuler: () => void;
  resetSettings: () => void;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 'large', // Por defecto 'large' pensando en niños de 6 a 8 años
  colorTheme: 'warm', // Fondo crema cálido antifatiga por defecto
  lineSpacing: 'relaxed',
  letterSpacing: 'relaxed',
  dyslexicFont: false,
  readingRuler: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const stored = localStorage.getItem('aliakit_accessibility');
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      }
    } catch {
      // Ignorar errores de acceso a localStorage
    }
  }, []);

  const updateSettings = (newSettings: AccessibilitySettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('aliakit_accessibility', JSON.stringify(newSettings));
    } catch {
      // Ignorar errores de guardado local
    }
  };

  const setFontSize = (fontSize: FontSizeSetting) => {
    updateSettings({ ...settings, fontSize });
  };

  const setColorTheme = (colorTheme: ColorThemeSetting) => {
    updateSettings({ ...settings, colorTheme });
  };

  const setLineSpacing = (lineSpacing: SpacingSetting) => {
    updateSettings({ ...settings, lineSpacing });
  };

  const setLetterSpacing = (letterSpacing: SpacingSetting) => {
    updateSettings({ ...settings, letterSpacing });
  };

  const toggleDyslexicFont = () => {
    updateSettings({ ...settings, dyslexicFont: !settings.dyslexicFont });
  };

  const toggleReadingRuler = () => {
    updateSettings({ ...settings, readingRuler: !settings.readingRuler });
  };

  const resetSettings = () => {
    updateSettings(defaultSettings);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        setFontSize,
        setColorTheme,
        setLineSpacing,
        setLetterSpacing,
        toggleDyslexicFont,
        toggleReadingRuler,
        resetSettings,
      }}
    >
      <div
        className={`aliakit-root min-h-screen transition-colors duration-200 ${
          settings.colorTheme === 'warm'
            ? 'bg-[#FBF8F2] text-[#2D2A26]'
            : settings.colorTheme === 'cream'
            ? 'bg-[#FFFDF5] text-[#222120]'
            : settings.colorTheme === 'contrast'
            ? 'bg-[#18181B] text-[#FEF08A]'
            : 'bg-white text-zinc-900'
        } aliakit-letter-${settings.letterSpacing} aliakit-line-${settings.lineSpacing}`}
      >
        {children}
        {settings.readingRuler && isClient && <ReadingRulerOverlay />}
      </div>
    </AccessibilityContext.Provider>
  );
}

/**
 * Regla de lectura visual que ayuda a enfocar la línea actual
 */
function ReadingRulerOverlay() {
  const [mouseY, setMouseY] = useState(250);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseY(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 right-0 z-50 h-16 border-y-2 border-amber-400 bg-amber-300/20 backdrop-brightness-105 transition-all duration-75"
      style={{ top: `${Math.max(60, mouseY - 32)}px` }}
    />
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility debe usarse dentro de un AccessibilityProvider');
  }
  return context;
}
