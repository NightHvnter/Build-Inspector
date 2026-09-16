import React, { createContext, useContext, useState, type ReactNode } from "react";
import { ThemeProvider, createTheme, type Theme } from "@mui/material/styles";
import type { ThemeSwitcherContextType } from "../interfaces";
import { CssBaseline } from "@mui/material";

// 2. Creiamo il contesto con un valore di default nullo
const ThemeSwitcherContext = createContext<ThemeSwitcherContextType | null>(null);

interface AppThemeProviderProps {
    children: ReactNode;
}

export const AppThemeProvider = ({ children }: AppThemeProviderProps) => {
    const [mode, setMode] = useState<"light" | "dark">(() => {
        const savedMode = localStorage.getItem("themeMode");
        return (savedMode === "light" || savedMode === "dark") ? savedMode : "light";
    });

    const toggleColorMode = () => {
        setMode((prevMode) => {
            const newMode = prevMode === "light" ? "dark" : "light";
            localStorage.setItem("themeMode", newMode);
            return newMode;
        });
    };

    // 5. Creiamo dinamicamente il tema MUI in base allo stato 'mode'
    // Puoi inserire qui le personalizzazioni globali (typography, shape, palette secondarie)
    const theme: Theme = React.useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                    ...(mode === "light"
                        ? {
                            // ---- CONFIGURAZIONE LIGHT THEME ----
                            primary: {
                                main: '#3f51b5',
                                contrastText: '#0a0a0a',
                            },
                            secondary: {
                                main: '#f50057',
                            },
                            background: {
                                paper: '#f9f8f8',
                            },
                            divider: 'rgba(58, 58, 58, 0.28)',
                        }
                        : {
                            // ---- CONFIGURAZIONE DARK THEME ----
                            primary: {
                                main: '#5b6ee4',
                            },
                            secondary: {
                                main: '#f50057',
                            },
                            background: {
                                default: '#0d0d0d',
                                paper: '#1a1a1a',
                            },
                            divider: 'rgba(214,214,214,0.12)',
                        }),
                },

            }),
        [mode]
    );

    return (
        <ThemeSwitcherContext.Provider value={{ mode, toggleColorMode }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ThemeSwitcherContext.Provider>
    );
};

// 6. Il Custom Hook da esportare e usare nei componenti
export const useThemeSwitcher = (): ThemeSwitcherContextType => {
    const context = useContext(ThemeSwitcherContext);
    if (!context) {
        throw new Error("useThemeSwitcher deve essere usato all'interno di un AppThemeProvider");
    }
    return context;
};