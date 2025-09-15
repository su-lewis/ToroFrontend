'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);

  // When the component mounts on the client, check if consent has been given.
  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    // Only show the banner if consent has NOT been given.
    if (consent !== 'true') {
      setShowBanner(true);
    }
  }, []);

  const handleConsent = () => {
    // When the user clicks either button, save their choice and hide the banner.
    localStorage.setItem('cookie_consent', 'true');
    setShowBanner(false);
  };

  // If the banner shouldn't be shown, render nothing.
  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 shadow-lg z-50">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-300 text-center md:text-left">
          We use essential cookies to ensure the proper functioning of our website. By continuing to use this site, you agree to our use of these cookies. Please review our{' '}
          <Link href="/privacy-policy" className="font-semibold text-blue-400 hover:underline">
            Privacy Policy
          </Link>
          {' '}for more details.
        </p>
        <div className="flex-shrink-0 flex gap-4">
          <button
            onClick={handleConsent}
            className="px-4 py-2 text-sm font-medium bg-gray-600 hover:bg-gray-500 rounded-md transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleConsent}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}