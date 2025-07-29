// frontend/src/components/SendTipButton.js
'use client';

import { useState, useTransition } from 'react';
import { createCheckoutSession } from '@/app/actions';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function SendTipButton({ recipientUsername, recipientDisplayName }) {
  const MINIMUM_TIP_AMOUNT = 1.00; // Minimum amount creator can receive
  const MAXIMUM_TIP_AMOUNT = 11111.00; // Maximum amount creator can receive

  const [amount, setAmount] = useState('10');
  const [donorName, setDonorName] = useState('');
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  const platformFeePercentage = 0.15;
  const stripeFeePercentage = 0.029;
  const stripeFeeFixedDollars = 0.30;
  
  const calculateTotalDonorPays = (creatorAmount) => {
    if (isNaN(creatorAmount) || creatorAmount <= 0) return { total: 0 };
    const total = (creatorAmount + stripeFeeFixedDollars) / (1 - platformFeePercentage - stripeFeePercentage);
    return { total };
  };

  const creatorAmountNum = parseFloat(amount);
  const { total: totalDonorPaysNum } = calculateTotalDonorPays(creatorAmountNum);
  const platformFeeNum = totalDonorPaysNum - creatorAmountNum;

  const handleTipSubmit = async (formData) => {
    setError(null);
    if (isNaN(creatorAmountNum) || creatorAmountNum < MINIMUM_TIP_AMOUNT) {
      setError(`Minimum tip is $${MINIMUM_TIP_AMOUNT.toFixed(2)}.`);
      return;
    }
    // --- NEW: Add maximum amount check ---
    if (creatorAmountNum > MAXIMUM_TIP_AMOUNT) {
      setError(`Maximum tip amount is $${MAXIMUM_TIP_AMOUNT.toFixed(2)}.`);
      return;
    }
    
    startTransition(async () => {
      const result = await createCheckoutSession(formData);
      if (!result.success) {
        setError(result.message);
        return;
      }
      const sessionId = result.sessionId;
      const stripe = await stripePromise;
      if (!stripe) { setError('Stripe.js failed to load.'); return; }
      
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
      if (stripeError) { setError(stripeError.message); }
    });
  };

  return (
    <form action={handleTipSubmit} className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-600">
      <h3 className="text-xl font-bold mb-4 text-center text-gray-800 dark:text-gray-100">
        Send a Tip to {recipientDisplayName || recipientUsername}
      </h3>
      
      {error && <p className="text-red-600 dark:text-red-400 text-sm mb-4 p-2 bg-red-100 dark:bg-red-900/30 rounded-md text-center">{error}</p>}
      
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="recipientUsername" value={recipientUsername} />

      <div className="flex items-center justify-center space-x-2 mb-4">
        <span className="text-2xl font-medium text-gray-700 dark:text-gray-300">$</span>
        <input
          type="text"
          value={amount}
          onChange={(e) => {
            const val = e.target.value;
            // --- NEW: Prevent typing a value larger than the max ---
            if (val === "" || (/^\d*\.?\d{0,2}$/.test(val) && parseFloat(val) <= MAXIMUM_TIP_AMOUNT)) {
                setAmount(val);
            } else if (parseFloat(val) > MAXIMUM_TIP_AMOUNT) {
                // If they paste a larger number, set it to the max
                setAmount(MAXIMUM_TIP_AMOUNT.toString());
            }
          }}
          min={MINIMUM_TIP_AMOUNT.toFixed(2)}
          max={MAXIMUM_TIP_AMOUNT.toFixed(2)} // HTML5 validation attribute
          className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-center text-2xl font-semibold text-black bg-white shadow-sm"
          placeholder="10.00"
        />
      </div>
      
      {creatorAmountNum > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-300 text-center mb-4 py-3 space-y-2">
            <div className="flex justify-between items-center px-2">
                <span>Platform & Stripe Fee:</span>
                <span className="font-semibold">+ ${platformFeeNum.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center px-2 pt-2">
                <span className="font-bold">Total You Pay:</span>
                <span className="font-bold">${totalDonorPaysNum.toFixed(2)}</span>
            </div>
        </div>
      )}

      <div className="mb-4 flex flex-col items-center">
        <input
          id="donorName"
          name="donorName"
          placeholder="Anonymous"
          maxLength="40"
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-lg text-black bg-white text-center"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || isNaN(creatorAmountNum) || creatorAmountNum < MINIMUM_TIP_AMOUNT || creatorAmountNum > MAXIMUM_TIP_AMOUNT}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md hover:shadow-lg transition-all disabled:opacity-60"
      >
        {isPending ? 'Processing...' : `Pay $${totalDonorPaysNum > 0 ? totalDonorPaysNum.toFixed(2) : '...'}`}
      </button>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">Powered by Stripe</p>
    </form>
  );
}