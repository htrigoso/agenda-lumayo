// Lumayo Brandbook V2 tokens. Mirrors landing/src/app/globals.css (@theme); keep both in sync.
export const AZUL = {
  950: "#1a2f51",
  900: "#234b85",
  800: "#2557a8",
  700: "#2364c2",
  600: "#2e81e2",
  500: "#439dee",
  300: "#98d3f8",
  200: "#c2e4fb",
  100: "#ddeffc",
  50: "#f0f8fe",
} as const;

export const AQUA = {
  800: "#265c64",
  700: "#257079",
  600: "#268b94",
  500: "#2baaaf",
  400: "#46c7ca",
  300: "#61d6d7",
  200: "#b4eded",
  100: "#d7f6f5",
  50: "#effcfb",
} as const;

export const INK = { 900: AZUL[950], 600: "#475b6e", 400: "#7a8a99" } as const;

export const LINE = "#d6e6f0";

// Lumayo Card Dorada (landing/src/components/lumayo-card/CardFaces.tsx).
export const GOLD = {
  gradient: "linear-gradient(118deg,#c39c48 0%,#d4b25c 30%,#dcc070 52%,#d2ae55 76%,#c09744 100%)",
  main: "#c39c48",
  dark: "#9a7a32",
  accent: "#f3dc9a",
  soft: "#fbf1d2",
} as const;

/** Dark brand gradient for the sidebar, mobile bar and login panel. */
export const NIGHT = `linear-gradient(170deg, ${AZUL[900]} 0%, ${AZUL[950]} 70%, #13233d 100%)`;

export const SHADOW_SOFT = "0 1px 2px rgba(26,47,81,0.06)";
export const SHADOW_LIFT = "0 1px 2px rgba(26,47,81,0.06), 0 8px 20px -14px rgba(26,47,81,0.25)";
export const SHADOW_HOVER = "0 1px 2px rgba(26,47,81,0.06), 0 14px 28px -16px rgba(26,47,81,0.35)";
