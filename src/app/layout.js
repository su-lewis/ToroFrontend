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
    <html lang="en" suppressHydrationWarning className="h-full bg-gray-100 dark:bg-gray-900">
      {/* --- THIS IS THE FIX (Part 1) --- */}
      {/* The body is now a flex container that fills the full height */}
      <body className={`${inter.className} h-full flex flex-col`}>
        <AppThemeProvider>
          {/* --- THIS IS THE FIX (Part 2) --- */}
          {/* This main wrapper will grow to contain all content, enabling scroll */}
          <main className="flex-grow">
            {children}
          </main>
        </AppThemeProvider>
      </body>
    </html>
  );
}