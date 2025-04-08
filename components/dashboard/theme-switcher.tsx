"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Loader2 } from "lucide-react";

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  
  // Prevent hydration mismatch by mounting only on client
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  // Show loading state while mounting to prevent flash
  if (!isMounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={className}
        disabled
      >
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="sr-only">Загрузка темы...</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={className}
      aria-label={resolvedTheme === "dark" ? "Переключить на светлую тему" : "Переключить на темную тему"}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
} 