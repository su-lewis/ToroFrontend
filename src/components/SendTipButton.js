// frontend/src/components/SendTipButton.js
'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { createCheckoutSession } from '@/app/actions';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const getCurrencySymbol = (currencyCode = 'usd') => {
    const symbols = { usd: '$', eur: '€', gbp: '£', cad: 'C$', aud: 'A$' };
    return symbols[currencyCode.toLowerCase()] || '$';
};

export default function SendTipButton({ 
  recipientUsername, 
  recipientDisplayName, 
  payoutsInUsd, 
  stripeDefaultCurrency, 
  pageBlockId = null,
  fixedAmount = null,
  isWishlistItem = false 
}) {
  
  const MINIMUM_TIP_AMOUNT = 1;
  const MAXIMUM_TIP_AMOUNT = 2500;
  
  const [amount, setAmount] = useState(fixedAmount ? fixedAmount.toString() : '');
  const [donorName, setDonorName] = useState('');
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(false);

  const displayCurrency = payoutsInUsd ? 'usd' : (stripeDefaultCurrency || 'usd');
  const currencySymbol = getCurrencySymbol(displayCurrency);

  const platformFeePercentage = 0.15;
  const platformFeeFixed = 1.00;

  const calculateTotalDonorPays = (creatorAmount) => {
    if (isNaN(creatorAmount) || creatorAmount <= 0) return { total: 0, fee: 0 };
    const fee = (creatorAmount * platformFeePercentage) + platformFeeFixed;
    const total = creatorAmount + fee;
    return { total, fee };
  };

  const creatorAmountNumForDisplay = parseFloat(amount);
  const { total: totalDonorPaysNum, fee: platformFeeNum } = calculateTotalDonorPays(creatorAmountNumForDisplay);

  const handlePayClick = () => {
    setError(null);
    const finalAmount = amount === '' ? MINIMUM_TIP_AMOUNT : parseFloat(amount);

    if (isNaN(finalAmount) || finalAmount < MINIMUM_TIP_AMOUNT || finalAmount > MAXIMUM_TIP_AMOUNT) {
      setError(`Amount must be between ${currencySymbol}${MINIMUM_TIP_AMOUNT} and ${currencySymbol}${MAXIMUM_TIP_AMOUNT}.`);
      return;
    }
    
    startTransition(async () => {
      const tipData = {
        amount: finalAmount,
        recipientUsername: recipientUsername,
        donorName: donorName || 'Anonymous',
        pageBlockId: pageBlockId,
      };
      
      const result = await createCheckoutSession(tipData);

      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        setError(result.message || "Could not create payment session.");
      }
    });
  };

  if (isWishlistItem) {
    return (
      <button
        type="button"
        onClick={handlePayClick}
        disabled={isPending}
        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md text-sm shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? '...' : 'Fund'}
      </button>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-600">
      
      {/* --- THIS IS THE FIX (Part 1) --- */}
      {/* The "Total You Pay" div has been removed. */}
      {isExpanded && creatorAmountNumForDisplay > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-300 text-center mb-4 py-3 transition-opacity duration-300">
            <div className="flex justify-between items-center px-2">
                <span>Platform & Stripe Fee:</span>
                 <span className="font-semibold">+ {currencySymbol}{platformFeeNum.toFixed(2)}</span>
            </div>
        </div>
      )}

      <div>
        {error && <p className="text-red-600 dark:text-red-400 text-sm mb-4 p-2 bg-red-100 dark:bg-red-900/30 rounded-md text-center">{error}</p>}
        
        <div className="relative flex items-center mb-4">
          <span className="absolute left-3 text-2xl font-medium text-gray-500 dark:text-gray-400">{currencySymbol}</span>
          <input
            type="text"
            value={amount}
            onFocus={() => setIsExpanded(true)}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || (/^\d*\.?\d{0,2}$/.test(val) && parseFloat(val) <= MAXIMUM_TIP_AMOUNT)) {
                  setAmount(val);
              }
            }}
            placeholder="Enter tip amount"
            className="w-full pl-8 pr-16 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-2xl font-semibold text-black dark:text-gray-300 bg-white dark:bg-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500"
          />
          <span className="absolute right-3 text-lg font-semibold text-gray-400 dark:text-gray-500">{displayCurrency.toUpperCase()}</span>
        </div>
        
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96' : 'max-h-0'}`}>
          <div className="pt-4 space-y-4">
            <div className="flex flex-col items-center">
              <input
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                // --- THIS IS THE FIX (Part 2) ---
                placeholder="Anonymous" // Changed back from "Name (optional)"
                maxLength="25"
                className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-lg text-black dark:text-gray-300 bg-white dark:bg-gray-700 shadow-sm text-center"
              />
            </div>

            <button
              type="button"
              onClick={handlePayClick}
              disabled={isPending || isNaN(creatorAmountNumForDisplay) || creatorAmountNumForDisplay < MINIMUM_TIP_AMOUNT}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md hover:shadow-lg transition-all disabled:opacity-60"
            >
              {isPending ? 'Processing...' : `Pay ${currencySymbol}${totalDonorPaysNum > 0 ? totalDonorPaysNum.toFixed(2) : MINIMUM_TIP_AMOUNT.toFixed(2)}`}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
          By sending a tip, you agree to our{' '}
          <Link href="/terms-of-service" target="_blank" className="hover:underline font-medium">
            Terms of Service
          </Link>
          . Powered by Stripe.
        </p>
      </div>
    </div>
  );
}