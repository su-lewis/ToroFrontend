import './globals.css';
import { Inter } from 'next/font/google';
import { AppThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: {
    default: 'TributeToro',
    template: '%s | TributeToro',
  },
  description: 'Create your own page, share your content, and receive support from your fans.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className}`}>
        <AppThemeProvider>
          {/* --- THIS IS THE FIX --- */}
          {/* The `min-h-screen` class has been removed from this line. */}
          {/* This allows the main content area to grow as tall as needed. */}
          <main className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {children}
          </main>
        </AppThemeProvider>
      </body>
    </html>
  );
}