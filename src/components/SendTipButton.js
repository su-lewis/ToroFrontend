// frontend/src/components/SendTipButton.js
'use client';

import { useState, useTransition } from 'react';
import { createCheckoutSession } from '@/app/actions';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function SendTipButton({ recipientUsername, recipientDisplayName }) {
  const [amount, setAmount] = useState('10');
  const [donorName, setDonorName] = useState('');
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  const platformFeePercentage = 0.15;
  const stripeFeePercentage = 0.029;
  const stripeFeeFixedDollars = 0.30;

  const calculateTotalDonorPays = (creatorAmount) => {
    if (isNaN(creatorAmount) || creatorAmount <= 0) return { total: 0 };
    return { total: (creatorAmount + stripeFeeFixedDollars) / (1 - platformFeePercentage - stripeFeePercentage) };
  };

  const creatorAmountNum = parseFloat(amount);
  const { total: totalDonorPaysNum } = calculateTotalDonorPays(creatorAmountNum);

  const handleTipSubmit = async (formData) => {
    setError(null);
    if (isNaN(creatorAmountNum) || creatorAmountNum < 1.00) {
      setError(`Minimum tip is $1.00.`);
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
    <form action={handleTipSubmit} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 p-6 md:p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600">
      <h3 className="text-2xl font-semibold mb-1 text-gray-800 dark:text-gray-100 text-center">
        Send to {recipientDisplayName || recipientUsername}!
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
        Enter amount you want them to receive.
      </p>
      
      {error && <p className="text-red-600 dark:text-red-400 text-sm mb-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-md text-center">{error}</p>}
      
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="recipientUsername" value={recipientUsername} />

      <div className="flex items-center justify-center space-x-2 mb-3">
        <span className="text-2xl font-medium text-gray-700 dark:text-gray-300">$</span>
        <input
          type="text"
          value={amount}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) setAmount(val);
          }}
          min="1.00" 
          className="w-24 md:w-28 px-3 py-2.5 border border-gray-300 rounded-lg text-center text-xl font-medium text-black bg-white shadow-sm"
        />
      </div>
      
      {creatorAmountNum > 0 && (
        <div className="text-xs text-gray-600 dark:text-gray-400 text-center mb-4 p-2 bg-gray-100 dark:bg-gray-900/30 rounded-md">
            <p>
                {recipientDisplayName || recipientUsername} receives: <span className="font-semibold">${creatorAmountNum.toFixed(2)}</span>
            </p>
            {/* NO <br /> here */}
            <p className="font-bold text-sm mt-2">
                Total You Pay: <span className="font-semibold">${totalDonorPaysNum.toFixed(2)}</span>
            </p>
            <p className="text-[10px] text-gray-500 mt-1">
                (Includes all platform & payment fees)
            </p>
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
        disabled={isPending || isNaN(creatorAmountNum) || creatorAmountNum < 1.00}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3.5 px-6 rounded-lg text-lg shadow-md hover:shadow-lg transition-all disabled:opacity-60"
      >
        {isPending ? 'Processing...' : `Tip $${creatorAmountNum > 0 ? creatorAmountNum.toFixed(2) : '...'}`}
      </button>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">Powered by Stripe</p>
    </form>
  );
}