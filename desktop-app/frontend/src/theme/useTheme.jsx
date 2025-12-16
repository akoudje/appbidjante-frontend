// src/theme/useTheme.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    
    // Par défaut : mode clair pour le thème village
    return window.matchMedia("(prefers-color-scheme: dark)").matches 
      ? "dark" 
      : "light";
  });

  // Appliquer le thème au document
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
      // Ajouter une classe pour les animations de transition
      root.classList.add("theme-transition");
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
      // Ajouter une classe pour les animations de transition
      root.classList.add("theme-transition");
    }
    
    localStorage.setItem("theme", theme);
    
    // Nettoyer la classe de transition après animation
    const timer = setTimeout(() => {
      root.classList.remove("theme-transition");
    }, 300);
    
    return () => clearTimeout(timer);
  }, [theme]);

  const toggle = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const value = { theme, toggle, setTheme };

  return (
    <ThemeContext.Provider value={value}>
      <div className={`min-h-screen bg-background text-foreground ${theme === "dark" ? "dark" : ""}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};