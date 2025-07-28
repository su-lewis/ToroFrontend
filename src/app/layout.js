// frontend/src/app/layout.js
import './globals.css';
import { Inter } from 'next/font/google'; // Or your chosen font

const inter = Inter({ subsets: ['latin'] });

// --- METADATA OBJECT ---
// This object configures the default metadata for your entire application.
export const metadata = {
  title: {
    default: 'TributeToro', // The default title for most pages
    template: '%s | TributeToro', // A template for child pages to use
                                     // e.g., "samiam's Profile | TributeToro"
  },
  description: 'Create your own link-in-bio page, share your content, and receive support from your audience.',
  // You can add more metadata here for SEO, like openGraph, twitter, etc.
  // openGraph: {
  //   title: 'Your Site Name',
  //   description: 'Your awesome site description.',
  //   url: 'https://your-live-domain.com',
  //   siteName: 'Your Site Name',
  //   images: [
  //     {
  //       url: 'https://your-live-domain.com/og-image.png', // A URL to a default sharing image
  //       width: 1200,
  //       height: 630,
  //     },
  //   ],
  //   locale: 'en_US',
  //   type: 'website',
  // },
};
// --- END OF METADATA ---

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-100 text-gray-900`}>
        <main>{children}</main>
      </body>
    </html>
  );
}