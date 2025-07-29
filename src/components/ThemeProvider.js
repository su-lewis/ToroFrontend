// frontend/src/components/ThemeProvider.js
'use client';

import { ThemeProvider } from 'next-themes';

export function AppThemeProvider({ children }) {
  // attribute="class" tells next-themes to add class="dark" or class="light" to the <html> tag
  // defaultTheme="system" will use the user's OS preference as the default
  // enableSystem allows switching between light, dark, and system preference
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}