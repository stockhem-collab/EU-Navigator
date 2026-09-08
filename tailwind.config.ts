import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef3f8",
          100: "#d6e2ee",
          200: "#adc5dd",
          300: "#84a8cc",
          400: "#5b8bbb",
          500: "#396ea3",
          600: "#2c5580",
          700: "#1f3d5c",
          800: "#16293f",
          900: "#0e1a28",
        },
        gold: {
          50: "#fdf8ec",
          100: "#faedc9",
          200: "#f4da93",
          300: "#eec25c",
          400: "#e6aa35",
          500: "#d4941f",
          600: "#b07417",
          700: "#8a5816",
          800: "#704819",
          900: "#5e3d19",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
