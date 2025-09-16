import './globals.css';
import { Inter } from 'next/font/google';
import { AppThemeProvider } from '@/components/ThemeProvider';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import { Analytics } from "@vercel/analytics/react";

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
          {children}
          
          <CookieConsentBanner />

          <Analytics />
        </AppThemeProvider>
      </body>
    </html>
  );
}