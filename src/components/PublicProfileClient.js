'use client';

import Image from 'next/image';
import SendTipButton from '@/components/SendTipButton';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { useTheme } from 'next-themes';

// These are our default colors
const DEFAULT_DARK_BG = '#111827';  // Tailwind gray-900
const DEFAULT_LIGHT_BG = '#F9FAFB'; // Tailwind gray-50
const OLD_DEFAULT_BG = '#FFFFFF';   // The old white default

export default function PublicProfileClient({ profileData, paymentCancelled }) {
  const { resolvedTheme } = useTheme();

  // Destructure all the data passed from the server page
  const {
    displayName,
    username,
    bio,
    profileImageUrl,
    bannerImageUrl,
    links = [],
    stripeAccountId,
    stripeOnboardingComplete,
    profileBackgroundColor,
    payoutsInUsd,
    stripeDefaultCurrency,
  } = profileData;

  // This logic is also from your original file
  const effectiveDisplayName = profileData.displayName || profileData.username;

  // --- THIS IS THE CORE FIX ---
  // 1. Start with the color from the database.
  let finalBackgroundColor;

  // 1. Check if the user has a custom color set.
  // A color is considered "not custom" if it's the new dark default OR the old white default.
  const hasCustomColor = profileBackgroundColor &&
    profileBackgroundColor.toUpperCase() !== DEFAULT_DARK_BG.toUpperCase() &&
    profileBackgroundColor.toUpperCase() !== OLD_DEFAULT_BG.toUpperCase();

  if (hasCustomColor) {
    // 2. If they have a custom color, ALWAYS use it.
    finalBackgroundColor = profileBackgroundColor;
  } else {
    // 3. Otherwise, apply the theme-appropriate default.
    finalBackgroundColor = resolvedTheme === 'light' ? DEFAULT_LIGHT_BG : DEFAULT_DARK_BG;
  }

  const pageStyle = { backgroundColor: finalBackgroundColor };

  // The entire JSX from your original page.js goes here.
  return (
    <main style={pageStyle} className="min-h-screen transition-colors duration-500">
      <div className="container mx-auto max-w-3xl flex flex-col items-center pb-12">
        <div
          className="w-full h-48 md:h-64 lg:h-72 relative shadow-lg"
          style={{ backgroundColor: '#D1D5DB' }} // This is Tailwind's gray-300 color
        >
          {bannerImageUrl && <Image src={bannerImageUrl} alt={`${effectiveDisplayName}'s banner`} layout="fill" className="object-cover" priority={true} />}
        </div>

        <div className="w-full max-w-2xl bg-white dark:bg-gray-800 p-6 md:p-8 shadow-xl relative z-10 -mt-16 md:-mt-20 rounded-lg mx-4 sm:mx-0">
          <div className="absolute top-3 left-3">
            <ThemeSwitcher />
          </div>
          <div className="flex justify-center -mt-20 md:-mt-24 mb-4">
            {profileImageUrl ? (
              <Image src={profileImageUrl} alt={`Profile picture of ${effectiveDisplayName}`} width={160} height={160} className="rounded-full w-32 h-32 md:w-40 md:h-40 object-cover border-4 border-white dark:border-gray-700 shadow-2xl bg-gray-200" priority />
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-5xl md:text-6xl font-semibold shadow-2xl border-4 border-white dark:border-gray-700">
                {effectiveDisplayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {paymentCancelled && (
            <div role="alert" className="mb-6 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 rounded-md text-sm text-center">
              <p className="font-semibold">Payment Cancelled.</p>
            </div>
          )}

          <div className="text-center text-gray-900 dark:text-gray-100">
            <h1 className="text-3xl md:text-4xl font-extrabold mt-2 mb-1">{effectiveDisplayName}</h1>
            {displayName && <p className="text-lg text-gray-500 dark:text-gray-400 mb-3">@{username}</p>}
            {bio && <p className="text-md text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg mx-auto mb-6">{bio}</p>}
          </div>

          <div className="mb-8">
            {stripeAccountId && stripeOnboardingComplete ? (
              <SendTipButton
                recipientUsername={username}
                recipientDisplayName={effectiveDisplayName}
                payoutsInUsd={payoutsInUsd}
                stripeDefaultCurrency={stripeDefaultCurrency}
              />
            ) : (
              profileData &&
              <div className="mt-6 p-3 rounded-md shadow text-center text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {effectiveDisplayName} is not set up to receive payments.
              </div>
            )}
          </div>

          <div className="w-full">
            {links.length > 0 && (<h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 text-center">Links</h2>)}
            <div className="space-y-4">
              {links.length > 0 ? (
                links.map((link) => (
                  <a key={link.id} href={link.url.startsWith('http') ? link.url : `//${link.url}`} target="_blank" rel="noopener noreferrer nofollow"
                    className="block w-full text-center font-semibold py-3 px-5 rounded-lg text-lg shadow-md hover:shadow-lg transition-all bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {link.title}
                  </a>
                ))
              ) : (<p className="italic py-3 text-center text-gray-500 dark:text-gray-400">This user hasn't added any links yet.</p>)}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}