'use client';

import Image from 'next/image';
import SendTipButton from '@/components/SendTipButton';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { useTheme } from 'next-themes';
import { GiftIcon } from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';

const DEFAULT_DARK_BG = '#111827';
const DEFAULT_LIGHT_BG = '#F9FAFB';
const OLD_DEFAULT_BG = '#FFFFFF';

// --- NEW HELPER FUNCTION ---
// This function determines if a given hex color is light or dark.
// It returns `true` for light colors and `false` for dark colors.
const isColorLight = (hexColor) => {
  if (!hexColor) return false;
  // Remove the '#' if it's there
  const color = hexColor.charAt(0) === '#' ? hexColor.slice(1) : hexColor;
  // Convert hex to RGB
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
  // Return true if the color is light, false if it's dark
  return luminance > 140; 
};

export default function PublicProfileClient({ profileData, paymentCancelled }) {
  const { resolvedTheme } = useTheme();
  const [showCancelledMessage, setShowCancelledMessage] = useState(paymentCancelled);

  const {
    displayName,
    username,
    bio,
    profileImageUrl,
    bannerImageUrl,
    pageBlocks = [],
    stripeAccountId,
    stripeOnboardingComplete,
    profileBackgroundColor,
    payoutsInUsd,
    stripeDefaultCurrency,
    } = profileData;

  const effectiveDisplayName = displayName || username;

  let finalBackgroundColor;
  const hasCustomColor = profileBackgroundColor && profileBackgroundColor.toUpperCase() !== DEFAULT_DARK_BG.toUpperCase() && profileBackgroundColor.toUpperCase() !== OLD_DEFAULT_BG.toUpperCase();

  if (hasCustomColor) {
    finalBackgroundColor = profileBackgroundColor;
  } else {
    finalBackgroundColor = resolvedTheme === 'light' ? DEFAULT_LIGHT_BG : DEFAULT_DARK_BG;
  }

  const pageStyle = { backgroundColor: finalBackgroundColor };

  const formatCurrency = (cents, currency = 'usd') => {
      try {
          return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
      } catch (e) { return `$${(cents / 100).toFixed(2)}`; }
  };

  useEffect(() => {
    if (paymentCancelled) {
        const timer = setTimeout(() => {
            setShowCancelledMessage(false);
        }, 5000); // Hide message after 5 seconds
        return () => clearTimeout(timer);
    }
   }, [paymentCancelled]);
  
  // --- NEW: Determine the correct text color for placeholders ---
  const placeholderTextColorClass = isColorLight(finalBackgroundColor) 
    ? 'text-gray-800' 
    : 'text-gray-200';

  return (
    <main style={pageStyle} className="min-h-screen transition-colors duration-500">
      <div className="container mx-auto max-w-3xl flex flex-col items-center pb-12">
        
        {/* --- FIX #1: BANNER PLACEHOLDER --- */}
        <div 
          className="w-full h-48 md:h-64 lg:h-72 relative shadow-lg flex items-center justify-center"
          // It now uses the selected background color
          style={{ backgroundColor: finalBackgroundColor }}
        >
          {bannerImageUrl ? (
            <Image src={bannerImageUrl} alt={`${effectiveDisplayName}'s banner`} layout="fill" className="object-cover" priority={true} />
          ) : (
            // --- FIX #2: READABLE TEXT ---
            // The text color now adapts based on the background brightness
            <span className={`text-lg font-medium opacity-50 ${placeholderTextColorClass}`}>
              No banner
            </span>
          )}
          <div className="absolute top-4 right-4 z-10">
            <ThemeSwitcher />
          </div>
        </div>

        <div className="w-full max-w-2xl bg-white dark:bg-gray-800 p-6 md:p-8 shadow-xl relative z-10 -mt-16 md:-mt-20 rounded-lg mx-4 sm:mx-0">
          <div className="flex flex-col items-center mb-6">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full -mt-20 md:-mt-24 border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden relative">
              {profileImageUrl ? (
                <Image src={profileImageUrl} alt={effectiveDisplayName} layout="fill" className="object-cover" />
              ) : (
                // --- FIX #3: AVATAR PLACEHOLDER ---
                <div 
                  className="w-full h-full flex items-center justify-center text-6xl font-bold"
                  // It also uses the selected background color and adapts its text color
                  style={{ backgroundColor: finalBackgroundColor, color: isColorLight(finalBackgroundColor) ? '#374151' : '#FFFFFF' }}
                >
                  {effectiveDisplayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="text-center mt-4">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100">{effectiveDisplayName}</h1>
              {displayName && <p className="text-lg text-gray-500 dark:text-gray-400">@{username}</p>}
              {bio && <p className="text-md text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg mx-auto mt-3">{bio}</p>}
            </div>
          </div>

          {showCancelledMessage && (
            <div className="p-3 mb-6 rounded-md bg-yellow-50 dark:bg-yellow-900/30 text-center text-sm text-yellow-800 dark:text-yellow-300">
              Your payment was cancelled.
            </div>
          )}

          <div className="mb-8">
            {stripeAccountId && stripeOnboardingComplete ? (
              <SendTipButton
                recipientUsername={username}
                recipientDisplayName={effectiveDisplayName}
                payoutsInUsd={payoutsInUsd}
                stripeDefaultCurrency={stripeDefaultCurrency}
              />
            ) : (
              <div className="mt-6 p-3 rounded-md shadow text-center text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {effectiveDisplayName} is not set up to receive payments yet.
              </div>
            )}
          </div>

          <div className="w-full">
            {pageBlocks.length > 0 && (<h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 text-center">Links & Wishlist</h2>)}
            <div className="space-y-4">
              {pageBlocks.length > 0 ? (
                pageBlocks.map((block) => {
                  if (block.type === 'LINK') {
                    return (
                      <a key={block.id} href={block.url && (block.url.startsWith('http') ? block.url : `//${block.url}`)} target="_blank" rel="noopener noreferrer nofollow"
                        className="block w-full text-center font-semibold py-3 px-5 rounded-lg text-lg shadow-md hover:shadow-lg transition-all bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {block.title}
                      </a>
                    );
                  } else if (block.type === 'WISHLIST') {
                    const purchasedCount = block._count.payments;
                    const progress = block.isUnlimited || !block.quantityGoal ? 100 : (purchasedCount / block.quantityGoal) * 100;
                    const isCompleted = !block.isUnlimited && block.quantityGoal && purchasedCount >= block.quantityGoal;

                    return (
                      <div key={block.id} className={`p-4 rounded-lg shadow-md border ${isCompleted ? 'bg-gray-100 dark:bg-gray-700 opacity-60' : 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'}`}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center min-w-0">
                            <GiftIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-bold text-gray-800 dark:text-gray-100 truncate">{block.title}</p>
                              <p className="text-sm text-green-700 dark:text-green-300 font-semibold">{formatCurrency(block.priceCents, stripeDefaultCurrency || 'usd')}</p>
                            </div>
                          </div>
                          {!isCompleted && (
                            <SendTipButton
                              recipientUsername={username}
                              recipientDisplayName={effectiveDisplayName}
                              payoutsInUsd={true}
                              stripeDefaultCurrency={'usd'}
                              pageBlockId={block.id}
                              fixedAmount={block.priceCents / 100}
                              isWishlistItem={true}
                            />
                          )}
                        </div>
                        {!block.isUnlimited && (
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                              <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="text-right text-xs mt-1 text-gray-500 dark:text-gray-400">
                              {purchasedCount} / {block.quantityGoal} funded
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })
              ) : (<p className="italic py-3 text-center text-gray-500 dark:text-gray-400">This user hasn't added any content yet.</p>)}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}