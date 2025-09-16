'use client';

import Image from 'next/image';
import SendTipButton from '@/components/SendTipButton';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { useTheme } from 'next-themes';
import { GiftIcon } from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';

const DEFAULT_DARK_BG = '#111827';
const DEFAULT_LIGHT_BG = '#F9FAFB';

const isColorLight = (hexColor) => {
  // ... (this helper function is correct and unchanged)
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
  const finalBackgroundColor = profileBackgroundColor || (resolvedTheme === 'light' ? DEFAULT_LIGHT_BG : DEFAULT_DARK_BG);
  const pageStyle = { backgroundColor: finalBackgroundColor };

  // --- THIS IS THE FIX ---
  // The formatCurrency helper function is added back here.
  const formatCurrency = (cents, currency = 'usd') => {
      try {
          return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
      } catch (e) { return `$${(cents / 100).toFixed(2)}`; }
  };

  useEffect(() => {
    if (paymentCancelled) {
      const timer = setTimeout(() => setShowCancelledMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [paymentCancelled]);

  return (
    <main style={pageStyle} className="min-h-screen transition-colors duration-500">
      <div className="container mx-auto max-w-3xl flex flex-col items-center pb-12">
        
        {bannerImageUrl && (
          <div className="w-full h-48 md:h-64 lg:h-72 relative shadow-lg">
            <Image src={bannerImageUrl} alt={`${effectiveDisplayName}'s banner`} layout="fill" className="object-cover" priority={true} />
          </div>
        )}
        
        <div className="absolute top-4 right-4 z-10">
          <ThemeSwitcher />
        </div>

        <div className={`w-full max-w-2xl bg-white dark:bg-gray-800 p-6 md:p-8 shadow-xl relative z-10 rounded-lg mx-4 sm:mx-0 ${
          bannerImageUrl ? '-mt-16 md:-mt-20' : 'mt-16 md:mt-20'
        }`}>
          <div className="flex flex-col items-center mb-6">
            <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:bg-gray-800 shadow-lg overflow-hidden relative ${
              bannerImageUrl ? '-mt-20 md:-mt-24' : ''
            }`}>
              {profileImageUrl ? (
                <Image src={profileImageUrl} alt={effectiveDisplayName} layout="fill" className="object-cover" />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center text-6xl font-bold"
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
                    // ... (Link rendering is unchanged)
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
                              {/* This line will now work correctly */}
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