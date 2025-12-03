import postcssOKLabFunction from '@csstools/postcss-oklab-function'
import postcssLabFunction from 'postcss-lab-function'

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    // Add fallback colors for html2canvas (Bug Reporter SDK) compatibility
    // postcss-lab-function: handles lab() and lch() colors (used by Tailwind v4 default palette)
    "postcss-lab-function": {
      preserve: true, // Keep original colors for modern browsers, add fallbacks for older tools
    },
    // @csstools/postcss-oklab-function: handles oklab() and oklch() colors (used in globals.css)
    "@csstools/postcss-oklab-function": {
      preserve: true, // Keep original colors for modern browsers, add fallbacks for older tools
    },
  },
};

export default config;
