import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Hyperliquid-ish mint/teal accent
        brand: {
          DEFAULT: "#4afac8",
          50: "#eafef8",
          100: "#c6fcec",
          400: "#4afac8",
          500: "#1fe0a8",
          600: "#0bb486",
        },
        ink: {
          900: "#0a0f14",
          800: "#0f161d",
          700: "#161f28",
          600: "#1d2935",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
