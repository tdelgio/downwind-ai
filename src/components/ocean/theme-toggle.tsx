"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const savedTheme = window.localStorage.getItem("downwind-theme") as Theme | null;
  if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem("downwind-theme", nextTheme);
    applyTheme(nextTheme);
  }

  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={
        compact
          ? "theme-toggle grid size-9 place-items-center rounded-full border text-[#526a73] transition hover:-translate-y-0.5 hover:text-[#0d5968]"
          : "theme-toggle flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-sm font-semibold text-[#5f7078] transition hover:-translate-y-0.5"
      }
    >
      {compact ? (
        <Icon className="size-4" />
      ) : (
        <>
          <span className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-full bg-white/70">
              <Icon className="size-4" />
            </span>
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </span>
          <span className="text-xs uppercase tracking-[0.12em]">
            {theme === "dark" ? "Day" : "Night"}
          </span>
        </>
      )}
    </button>
  );
}
