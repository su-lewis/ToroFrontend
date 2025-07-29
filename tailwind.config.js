// frontend/tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1. ADD THIS LINE: Enable dark mode using the 'class' strategy.
  // This means dark mode styles (e.g., dark:bg-gray-900) will be
  // applied when a parent element has class="dark".
  darkMode: 'class',

  // 2. Your 'content' array is already correct. It tells Tailwind
  // where to look for class names to generate the necessary CSS.
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    // If you have other folders with components, add them here, e.g.:
    // "./src/layouts/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  // 3. The 'theme' object is where you can customize Tailwind's default
  // design system (colors, spacing, fonts, etc.). 'extend' adds your
  // customizations on top of the defaults. It's fine to leave it empty
  // for now if you are just using the default theme.
  theme: {
    extend: {
      // Example of extending the theme (you can add this later if you want):
      // colors: {
      //   primary: {
      //     light: '#3b82f6', // blue-500
      //     DEFAULT: '#2563eb', // blue-600
      //     dark: '#1d4ed8',  // blue-700
      //   },
      // },
      // fontFamily: {
      //   sans: ['Inter', 'sans-serif'], // Example: Setting Inter as the default sans-serif font
      // },
    },
  },

  // 4. The 'plugins' array is for adding official or third-party
  // Tailwind plugins, like for forms or typography. It's fine to
  // leave it empty.
  plugins: [
    // require('@tailwindcss/forms'), // Example of a common plugin
  ],
};