"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { MotionConfig } from "framer-motion";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { AQUA, AZUL, INK, LINE, SHADOW_SOFT } from "@/lib/brand";

const theme = createTheme({
  cssVariables: true,
  palette: {
    primary: { main: AZUL[700], dark: AZUL[900], light: AZUL[600], contrastText: "#fff" },
    secondary: { main: AQUA[500], dark: AQUA[700], light: AQUA[300], contrastText: "#fff" },
    success: { main: AQUA[600] },
    background: { default: AZUL[50], paper: "#fff" },
    text: { primary: INK[900], secondary: INK[600] },
    divider: LINE,
  },
  // 8px base: `sx={{ borderRadius: n }}` means n × 8px. Cards set their own 16px below.
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "var(--font-montserrat), system-ui, sans-serif",
    h4: { fontWeight: 700, letterSpacing: "-0.01em" },
    h5: { fontWeight: 700, letterSpacing: "-0.01em" },
    h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: `1px solid ${LINE}`, boxShadow: SHADOW_SOFT }, rounded: { borderRadius: 16 } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderColor: LINE,
          color: INK[600],
          "&.Mui-selected": { backgroundColor: AZUL[700], color: "#fff", "&:hover": { backgroundColor: AZUL[800] } },
        },
      },
    },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 12 }, notchedOutline: { borderColor: LINE } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 20 } } },
    MuiMenu: { styleOverrides: { paper: { border: `1px solid ${LINE}` } } },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
