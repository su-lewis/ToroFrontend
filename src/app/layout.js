import './globals.css';
import { Inter } from 'next/font/google';
import { AppThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: {
    default: 'TributeToro',
    template: '%s | TributeToro',
  },
  description: 'Create your own link-in-bio page, share your content, and receive support from your audience.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className}`}>
        <AppThemeProvider>
          {/* --- THE FIX --- */}
          {/* We have REMOVED `min-h-screen` from this <main> tag. */}
          {/* This allows the main content area to grow to the height of its children. */}
          <main className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {children}
          </main>
        </AppThemeProvider>
      </body>
    </html>
  );
}