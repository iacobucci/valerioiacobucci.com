import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const cold = {
  50: '#fafaff',
  100: '#f1f1f7',
  200: '#e0e0e6',
  300: '#b1b1b6',
  400: '#9c9ca1',
  500: '#55555a',
  600: '#434347',
  700: '#37373c',
  800: '#222226',
  900: '#121216',
  950: '#0c0c11',
};

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './content/**/*.mdx',
  ],
  theme: {
    extend: {
      colors: {
        gray: cold,
        bg: {
          light: '#ffffff',
          dark: cold[900],
        },
        fg: {
          light: '#000000',
          dark: cold[200],
        },
      },
    },
  },
  plugins: [
    typography,
  ],
};

export default config;
