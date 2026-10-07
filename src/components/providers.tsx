"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";

const theme = createTheme({
  cssVariables: true,
  palette: {
    primary: { main: "#0b3c6e", dark: "#082b52", light: "#3a6ea5" },
    secondary: { main: "#19b4d8" },
    background: { default: "#f0f7fb" },
    text: { primary: "#0b2545" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    button: { textTransform: "none", fontWeight: 600 },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
