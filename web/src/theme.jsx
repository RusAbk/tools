import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ConfigProvider } from "antd";

const ThemeContext = createContext(null);

function getInitialTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  const savedTheme = window.localStorage.getItem("theme");
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getAntdTheme(theme) {
  const isDark = theme === "dark";

  return {
    token: {
      colorPrimary: isDark ? "#5eead4" : "#087a73",
      colorText: isDark ? "#f4f2ee" : "#232b35",
      colorTextSecondary: isDark ? "#d8dde3" : "#6d6a65",
      colorBorder: isDark ? "#30353b" : "#ded8cf",
      colorBgContainer: isDark ? "#15191d" : "#fbfbf9",
      colorFillAlter: isDark ? "#1d2228" : "#f4f0e9",
      borderRadius: 8,
      fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    },
    components: {
      Card: {
        borderRadiusLG: 8
      },
      Tag: {
        borderRadiusSM: 5
      }
    }
  };
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("saved-theme", theme);
    root.style.colorScheme = theme;
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = (event) => {
      if (!window.localStorage.getItem("theme")) {
        setThemeState(event.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme: setThemeState,
      toggleTheme: () => setThemeState((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={getAntdTheme(theme)}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
