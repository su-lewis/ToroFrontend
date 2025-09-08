'use client';

import { useState, useTransition } from 'react';
import { createCheckoutSession } from '@/app/actions';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const getCurrencySymbol = (currencyCode = 'usd') => {
    const symbols = { usd: '$', eur: '€', gbp: '£', cad: 'C$', aud: 'A$' };
    return symbols[currencyCode.toLowerCase()] || '$';
};

export default function SendTipButton({ recipientUsername, recipientDisplayName, payoutsInUsd, stripeDefaultCurrency }) {
  
  const MINIMUM_TIP_AMOUNT = 1;
  const MAXIMUM_TIP_AMOUNT = 2500;
  
  const [amount, setAmount] = useState(MINIMUM_TIP_AMOUNT.toString());
  const [donorName, setDonorName] = useState('');
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

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
    const creatorAmountNum = parseFloat(amount);

    if (isNaN(creatorAmountNum) || creatorAmountNum < MINIMUM_TIP_AMOUNT || creatorAmountNum > MAXIMUM_TIP_AMOUNT) {
      setError(`Amount must be between ${currencySymbol}${MINIMUM_TIP_AMOUNT} and ${currencySymbol}${MAXIMUM_TIP_AMOUNT}.`);
      return;
    }
    
    startTransition(async () => {
      const tipData = {
        amount: creatorAmountNum,
        recipientUsername: recipientUsername,
        donorName: donorName || 'Anonymous',
      };
      
      const result = await createCheckoutSession(tipData);

      if (result.success) {
        const stripe = await stripePromise;
        if (stripe) {
          const { error: stripeError } = await stripe.redirectToCheckout({ sessionId: result.sessionId });
          if (stripeError) {
            setError(stripeError.message || "Could not redirect to Stripe.");
          }
        } else {
            setError("Stripe.js failed to load. Please check your connection.");
        }
      } else {
        setError(result.message);
      }
    });
  };

  return (
    // This is now a simple div container, not a <form>
    <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-600">
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100 text-center">
        Send a Tip to {recipientDisplayName || recipientUsername}
      </h3>
      
      {error && <p className="text-red-600 dark:text-red-400 text-sm mb-4 p-2 bg-red-100 dark:bg-red-900/30 rounded-md text-center">{error}</p>}
      
      <div className="flex items-center justify-center space-x-2 mb-4">
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
          className="w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-2xl font-semibold text-black dark:text-gray-300 bg-white dark:bg-gray-700 shadow-sm"
          placeholder={MINIMUM_TIP_AMOUNT.toFixed(2)}
        />
      </div>
      
      {creatorAmountNumForDisplay > 0 && (
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
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          placeholder="Anonymous"
          maxLength="18"
          className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-lg text-black dark:text-gray-300 bg-white dark:bg-gray-700 shadow-sm text-center"
        />
      </div>

      <button
        type="button" // Use type="button" to prevent default form submission
        onClick={handlePayClick} // Call our handler on click
        disabled={isPending || isNaN(creatorAmountNumForDisplay) || creatorAmountNumForDisplay < MINIMUM_TIP_AMOUNT}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md hover:shadow-lg transition-all disabled:opacity-60"
      >
         {isPending ? 'Processing...' : `Pay ${currencySymbol}${totalDonorPaysNum > 0 ? totalDonorPaysNum.toFixed(2) : '...'}`}
      </button>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">Powered by Stripe</p>
    </div>
  );
}