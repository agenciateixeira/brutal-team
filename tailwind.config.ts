import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        slideUp: 'slideUp 0.3s ease-out',
        slideIn: 'slideIn 0.3s ease-out',
      },
      colors: {
        primary: {
          50: '#e6f4f7',
          100: '#cce9ef',
          200: '#99d3df',
          300: '#66bdcf',
          400: '#33a7bf',
          500: '#0081A7', // Cor principal
          600: '#006786',
          700: '#004d64',
          800: '#003443',
          900: '#001a21',
        },
        secondary: {
          50: '#e6e7ea',
          100: '#cccfd5',
          200: '#999fab',
          300: '#667081',
          400: '#334057',
          500: '#011936', // Azul escuro
          600: '#01142b',
          700: '#010f20',
          800: '#000a15',
          900: '#00050b',
        },
        accent: {
          50: '#f1f3f4',
          100: '#e3e7e9',
          200: '#c7cfd3',
          300: '#abb7bd',
          400: '#8f9fa7',
          500: '#465362', // Cinza azulado
          600: '#38424e',
          700: '#2a323b',
          800: '#1c2127',
          900: '#0e1114',
        },
        light: {
          50: '#f9fcfd',
          100: '#f4f9fa',
          200: '#e9f3f5',
          300: '#deedf0',
          400: '#d3e7eb',
          500: '#93B7BE', // Azul pastel
          600: '#769298',
          700: '#586e72',
          800: '#3b494c',
          900: '#1d2526',
        },
      },
    },
  },
  plugins: [],
};
export default config;
