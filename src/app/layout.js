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
          {/* REMOVE the <main> wrapper. Each page will define its own main wrapper. */}
          {/* This gives pages full control over their own layout. */}
          {children}
        </AppThemeProvider>
      </body>
    </html>
  );
}