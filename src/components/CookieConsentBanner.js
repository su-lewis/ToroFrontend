'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (consent !== 'true') {
      setShowBanner(true);
    }
  }, []);

  const handleConsent = () => {
    localStorage.setItem('cookie_consent', 'true');
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    // --- THIS IS THE FIX ---
    // We change the positioning and add classes for margin, rounded corners, and shadows.
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 max-w-lg z-50">
      <div className="bg-gray-800 text-white p-6 rounded-lg shadow-xl border border-gray-700">
        <div className="flex flex-col items-start gap-4">
          <p className="text-sm text-gray-300">
            We use essential cookies to ensure our site functions correctly. By using the site, you acknowledge our use of these cookies. Please review our{' '}
            <Link href="/privacy-policy" className="font-semibold text-blue-400 hover:underline">
              Privacy Policy
            </Link>
            {' '}for more details.
          </p>
          <div className="flex w-full sm:w-auto gap-4">
            <button
              onClick={handleConsent}
              className="flex-1 px-4 py-2 text-sm font-medium bg-gray-600 hover:bg-gray-500 rounded-md transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleConsent}
              className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}