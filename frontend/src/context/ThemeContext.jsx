import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = {
  dark: {
    name: 'Dark',
    icon: 'moon',
    colors: {
      primary: '#6366f1',
      primaryHover: '#4f46e5',
      primaryLight: 'rgba(99, 102, 241, 0.15)',
      accent: '#22c55e',
      accentSecondary: '#f97316',
      bgDark: '#0a0a0f',
      bgCard: '#111118',
      bgCardHover: '#18181f',
      bgElevated: '#1a1a24',
      border: 'rgba(255, 255, 255, 0.08)',
      borderHover: 'rgba(255, 255, 255, 0.15)',
      borderActive: 'rgba(99, 102, 241, 0.5)',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      shadowGlow: '0 0 40px rgba(99, 102, 241, 0.15)',
      gradientStart: 'rgba(99, 102, 241, 0.15)',
      gradientEnd: 'rgba(168, 85, 247, 0.1)',
    }
  },
  orange: {
    name: 'Orange Blaze',
    icon: 'flame',
    colors: {
      primary: '#f97316',
      primaryHover: '#ea580c',
      primaryLight: 'rgba(249, 115, 22, 0.15)',
      accent: '#22c55e',
      accentSecondary: '#eab308',
      bgDark: '#0c0a07',
      bgCard: '#171310',
      bgCardHover: '#1f1a15',
      bgElevated: '#241d17',
      border: 'rgba(255, 255, 255, 0.08)',
      borderHover: 'rgba(255, 255, 255, 0.15)',
      borderActive: 'rgba(249, 115, 22, 0.5)',
      textPrimary: '#fef3e2',
      textSecondary: '#d6c2a8',
      textMuted: '#a18b6e',
      shadowGlow: '0 0 40px rgba(249, 115, 22, 0.2)',
      gradientStart: 'rgba(249, 115, 22, 0.15)',
      gradientEnd: 'rgba(234, 179, 8, 0.1)',
    }
  },
  light: {
    name: 'Light',
    icon: 'sun',
    colors: {
      primary: '#6366f1',
      primaryHover: '#4f46e5',
      primaryLight: 'rgba(99, 102, 241, 0.1)',
      accent: '#16a34a',
      accentSecondary: '#ea580c',
      bgDark: '#f8fafc',
      bgCard: '#ffffff',
      bgCardHover: '#f1f5f9',
      bgElevated: '#e2e8f0',
      border: 'rgba(0, 0, 0, 0.08)',
      borderHover: 'rgba(0, 0, 0, 0.15)',
      borderActive: 'rgba(99, 102, 241, 0.5)',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      textMuted: '#94a3b8',
      shadowGlow: '0 0 40px rgba(99, 102, 241, 0.1)',
      gradientStart: 'rgba(99, 102, 241, 0.08)',
      gradientEnd: 'rgba(168, 85, 247, 0.05)',
    }
  },
  midnight: {
    name: 'Midnight Black',
    icon: 'star',
    colors: {
      primary: '#a855f7',
      primaryHover: '#9333ea',
      primaryLight: 'rgba(168, 85, 247, 0.15)',
      accent: '#22c55e',
      accentSecondary: '#ec4899',
      bgDark: '#000000',
      bgCard: '#0a0a0a',
      bgCardHover: '#141414',
      bgElevated: '#1a1a1a',
      border: 'rgba(255, 255, 255, 0.06)',
      borderHover: 'rgba(255, 255, 255, 0.12)',
      borderActive: 'rgba(168, 85, 247, 0.5)',
      textPrimary: '#ffffff',
      textSecondary: '#a1a1aa',
      textMuted: '#71717a',
      shadowGlow: '0 0 40px rgba(168, 85, 247, 0.2)',
      gradientStart: 'rgba(168, 85, 247, 0.12)',
      gradientEnd: 'rgba(236, 72, 153, 0.08)',
    }
  },
  ocean: {
    name: 'Ocean Blue',
    icon: 'droplet',
    colors: {
      primary: '#0ea5e9',
      primaryHover: '#0284c7',
      primaryLight: 'rgba(14, 165, 233, 0.15)',
      accent: '#22c55e',
      accentSecondary: '#06b6d4',
      bgDark: '#0a1219',
      bgCard: '#0f1a24',
      bgCardHover: '#15232f',
      bgElevated: '#1a2a38',
      border: 'rgba(255, 255, 255, 0.08)',
      borderHover: 'rgba(255, 255, 255, 0.15)',
      borderActive: 'rgba(14, 165, 233, 0.5)',
      textPrimary: '#e0f2fe',
      textSecondary: '#7dd3fc',
      textMuted: '#38bdf8',
      shadowGlow: '0 0 40px rgba(14, 165, 233, 0.2)',
      gradientStart: 'rgba(14, 165, 233, 0.15)',
      gradientEnd: 'rgba(6, 182, 212, 0.1)',
    }
  },
  forest: {
    name: 'Forest Green',
    icon: 'leaf',
    colors: {
      primary: '#22c55e',
      primaryHover: '#16a34a',
      primaryLight: 'rgba(34, 197, 94, 0.15)',
      accent: '#eab308',
      accentSecondary: '#84cc16',
      bgDark: '#071209',
      bgCard: '#0d1a10',
      bgCardHover: '#132416',
      bgElevated: '#1a2e1c',
      border: 'rgba(255, 255, 255, 0.08)',
      borderHover: 'rgba(255, 255, 255, 0.15)',
      borderActive: 'rgba(34, 197, 94, 0.5)',
      textPrimary: '#dcfce7',
      textSecondary: '#86efac',
      textMuted: '#4ade80',
      shadowGlow: '0 0 40px rgba(34, 197, 94, 0.2)',
      gradientStart: 'rgba(34, 197, 94, 0.15)',
      gradientEnd: 'rgba(132, 204, 22, 0.1)',
    }
  },
  rose: {
    name: 'Rose Pink',
    icon: 'heart',
    colors: {
      primary: '#ec4899',
      primaryHover: '#db2777',
      primaryLight: 'rgba(236, 72, 153, 0.15)',
      accent: '#22c55e',
      accentSecondary: '#f472b6',
      bgDark: '#120a0d',
      bgCard: '#1a1014',
      bgCardHover: '#24161b',
      bgElevated: '#2e1c22',
      border: 'rgba(255, 255, 255, 0.08)',
      borderHover: 'rgba(255, 255, 255, 0.15)',
      borderActive: 'rgba(236, 72, 153, 0.5)',
      textPrimary: '#fce7f3',
      textSecondary: '#f9a8d4',
      textMuted: '#f472b6',
      shadowGlow: '0 0 40px rgba(236, 72, 153, 0.2)',
      gradientStart: 'rgba(236, 72, 153, 0.15)',
      gradientEnd: 'rgba(244, 114, 182, 0.1)',
    }
  },
  sunset: {
    name: 'Sunset',
    icon: 'sunset',
    colors: {
      primary: '#f59e0b',
      primaryHover: '#d97706',
      primaryLight: 'rgba(245, 158, 11, 0.15)',
      accent: '#ef4444',
      accentSecondary: '#f97316',
      bgDark: '#1a1207',
      bgCard: '#241a0d',
      bgCardHover: '#2e2212',
      bgElevated: '#382a17',
      border: 'rgba(255, 255, 255, 0.08)',
      borderHover: 'rgba(255, 255, 255, 0.15)',
      borderActive: 'rgba(245, 158, 11, 0.5)',
      textPrimary: '#fef3c7',
      textSecondary: '#fcd34d',
      textMuted: '#fbbf24',
      shadowGlow: '0 0 40px rgba(245, 158, 11, 0.2)',
      gradientStart: 'rgba(245, 158, 11, 0.15)',
      gradientEnd: 'rgba(239, 68, 68, 0.1)',
    }
  }
};

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('dashboard-theme');
    return saved && themes[saved] ? saved : 'dark';
  });

  useEffect(() => {
    const theme = themes[currentTheme];
    const root = document.documentElement;
    
    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--primary-hover', theme.colors.primaryHover);
    root.style.setProperty('--primary-light', theme.colors.primaryLight);
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--accent-orange', theme.colors.accentSecondary);
    root.style.setProperty('--bg-dark', theme.colors.bgDark);
    root.style.setProperty('--bg-card', theme.colors.bgCard);
    root.style.setProperty('--bg-card-hover', theme.colors.bgCardHover);
    root.style.setProperty('--bg-elevated', theme.colors.bgElevated);
    root.style.setProperty('--border', theme.colors.border);
    root.style.setProperty('--border-hover', theme.colors.borderHover);
    root.style.setProperty('--border-active', theme.colors.borderActive);
    root.style.setProperty('--text-primary', theme.colors.textPrimary);
    root.style.setProperty('--text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--text-muted', theme.colors.textMuted);
    root.style.setProperty('--shadow-glow', theme.colors.shadowGlow);
    root.style.setProperty('--gradient-start', theme.colors.gradientStart);
    root.style.setProperty('--gradient-end', theme.colors.gradientEnd);
    
    localStorage.setItem('dashboard-theme', currentTheme);
  }, [currentTheme]);

  const setTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
