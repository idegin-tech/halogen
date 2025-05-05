import { heroui } from "@heroui/theme";

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      height: {
        header: "var(--header-height)",
        body: "var(--body-height)",
        'panel-body': "var(--panel-body-height)"
      },
      maxHeight: {
        header: "var(--header-height)",
        body: "var(--body-height)",
        'panel-body': "var(--panel-body-height)"
      },
      spacing: {
        default: '1rem',
        sm: '0.5rem',
        lg: '2rem'
      }
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            colors: {
              primary: '#6348EE',
              background: '#b9b9bc',
              content1: '#ffffff',
              content2: 'orange',
              content3: 'yellow',
            },
          },
        },
        dark: {
          colors: {
            primary: '#6348EE',
            secondary: "#F65700",
            background: '#1D1D1F',
            content1: '#131519',
            divider: 'rgba(162,162,163,0.15)',
          },
        },
      },
    }),
  ],
};

module.exports = config;