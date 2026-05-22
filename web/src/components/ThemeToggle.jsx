import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../theme.jsx";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="icon-button theme-toggle"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggleTheme}
    >
      {isDark ? <Moon size={22} /> : <Sun size={22} />}
    </button>
  );
}
