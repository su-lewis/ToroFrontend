// frontend/src/components/SendTipButton.js
'use client';

import { useState } from 'react';
import { createCheckoutSession } from '@/app/actions'; // Using Server Action
import { loadStripe } from '@stripe/stripe-js';
import { useTransition } from 'react'; // For Server Action loading state

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Helper to get currency symbol
const getCurrencySymbol = (currencyCode = 'usd') => {
    const symbols = {
        usd: '$',
        eur: '€',
        gbp: '£',
        cad: 'C$',
        aud: 'A$',
    };
    return symbols[currencyCode.toLowerCase()] || '$';
};

export default function SendTipButton({ recipientUsername, recipientDisplayName, payoutsInUsd, stripeDefaultCurrency }) { // <-- ADD PROP
  
  const MINIMUM_TIP_AMOUNT = 5;
  const MAXIMUM_TIP_AMOUNT = 1111;
  const [amount, setAmount] = useState(MINIMUM_TIP_AMOUNT.toString());
  const [donorName, setDonorName] = useState('');
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  // --- FIX: Logic to determine the correct currency to display ---
  const displayCurrency = payoutsInUsd ? 'usd' : (stripeDefaultCurrency || 'usd');
  const currencySymbol = getCurrencySymbol(displayCurrency);

  const platformFeePercentage = 0.15;
  const platformFeeFixed = 1.00;

  // Calculation for the simple "add-on" fee model for display (no changes needed)
  const calculateTotalDonorPays = (creatorAmount) => {
    if (isNaN(creatorAmount) || creatorAmount <= 0) return { total: 0, fee: 0 };
    const fee = (creatorAmount * platformFeePercentage) + platformFeeFixed;
    const total = creatorAmount + fee;
    return { total, fee };
  };

  const creatorAmountNum = parseFloat(amount);
  const { total: totalDonorPaysNum, fee: platformFeeNum } = calculateTotalDonorPays(creatorAmountNum);

  const handleTip = async (formData) => {
    // --- FIX: The error message should use the dynamic currency symbol ---
    if (isNaN(creatorAmountNum) || creatorAmountNum < MINIMUM_TIP_AMOUNT) {
      setError(`Please enter a valid amount for the creator (min ${currencySymbol}${MINIMUM_TIP_AMOUNT.toFixed(2)} or equivalent).`);
      return;
    }
    if (creatorAmountNum > MAXIMUM_TIP_AMOUNT) {
      setError(`Amount cannot exceed ${currencySymbol}${MAXIMUM_TIP_AMOUNT.toFixed(2)}.`);
      return;
    }
    setError(null);
    
    startTransition(async () => {
      const result = await createCheckoutSession(formData);
      if (!result.success) {
        setError(result.message);
        return;
      }
      const sessionId = result.sessionId;
      const stripe = await stripePromise;
      if (!stripe) {
        setError('Stripe.js has not loaded yet.');
        return;
      }
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
      if (stripeError) {
        setError(stripeError.message || "Could not redirect to Stripe.");
      }
    });
  };

  return (
    <form action={handleTip} className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-600">
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100 text-center">
        Send a Tip to {recipientDisplayName || recipientUsername}
      </h3>
      
      {error && <p className="text-red-600 dark:text-red-400 text-sm mb-4 p-2 bg-red-100 dark:bg-red-900/30 rounded-md text-center">{error}</p>}
      
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="recipientUsername" value={recipientUsername} />

      <div className="flex items-center justify-center space-x-2 mb-4">
        {/* This now correctly displays the dynamic currency symbol */}
        <span className="text-2xl font-medium text-gray-700 dark:text-gray-300">{currencySymbol}</span>
        <input
          type="text"
          value={amount}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "" || (/^\d*\.?\d{0,2}$/.test(val) && parseFloat(val) <= MAXIMUM_TIP_AMOUNT)) {
                setAmount(val);
            }
          }}
          min={MINIMUM_TIP_AMOUNT.toFixed(2)}
          max={MAXIMUM_TIP_AMOUNT.toFixed(2)}
          className="w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-2xl font-semibold text-black dark:text-gray-300 bg-white dark:bg-gray-700 shadow-sm"
          placeholder={MINIMUM_TIP_AMOUNT.toFixed(2)}
        />
      </div>
      
      {creatorAmountNum > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-300 text-center mb-4 py-3">
            <div className="flex justify-between items-center px-2">
                <span>Platform & Stripe Fee:</span>
                 <span className="font-semibold">+ {currencySymbol}{platformFeeNum.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center px-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <span className="font-bold">Total You Pay:</span>
                 <span className="font-bold">{currencySymbol}{totalDonorPaysNum.toFixed(2)}</span>
            </div>
        </div>
      )}

      <div className="mb-4 flex flex-col items-center">
        <input
          id="donorName"
          name="donorName"
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          placeholder="Anonymous"
          maxLength="18"
          className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-lg text-black dark:text-gray-300 bg-white dark:bg-gray-700 shadow-sm text-center"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || isNaN(creatorAmountNum) || creatorAmountNum < MINIMUM_TIP_AMOUNT || creatorAmountNum > MAXIMUM_TIP_AMOUNT}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md hover:shadow-lg transition-all disabled:opacity-60"
      >
         {isPending ? 'Processing...' : `Pay ${currencySymbol}${totalDonorPaysNum > 0 ? totalDonorPaysNum.toFixed(2) : '...'}`}
      </button>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">Powered by Stripe</p>
    </form>
  );
}