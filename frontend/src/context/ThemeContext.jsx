import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem("mess_theme");
        if (saved === "light" || saved === "dark") return saved;
        return "light"; // Default to light mode
    });

    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;

        if (theme === "dark") {
            root.classList.add("dark");
            body.classList.add("dark");
            root.setAttribute("data-theme", "dark");
            root.style.colorScheme = "dark";
        } else {
            root.classList.remove("dark");
            body.classList.remove("dark");
            root.setAttribute("data-theme", "light");
            root.style.colorScheme = "light";
        }
        localStorage.setItem("mess_theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}

