// frontend/src/components/SendTipButton.js
'use client';

import { useState } from 'react';
import apiClient from '@/lib/api';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function SendTipButton({ recipientUsername, recipientDisplayName }) {
  const MINIMUM_TIP_AMOUNT = 5; // Define the minimum amount here
  const [amount, setAmount] = useState(MINIMUM_TIP_AMOUNT.toString()); // Start with the minimum amount
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const platformFeePercentage = 0.15; // 15% - This MUST match your backend's percentage

  const calculateTotalDonorPays = (creatorAmount) => {
    if (isNaN(creatorAmount) || creatorAmount <= 0) return { total: 0, fee: 0 };
    const fee = creatorAmount * platformFeePercentage;
    const total = creatorAmount + fee;
    return { total, fee };
  };

  const creatorAmountNum = parseFloat(amount);
  const { total: totalDonorPaysNum, fee: platformFeeNum } = calculateTotalDonorPays(creatorAmountNum);

  const handleTip = async () => {
    if (!recipientUsername) { setError("Recipient information is missing."); return; }
    // --- UPDATED VALIDATION ---
    if (isNaN(creatorAmountNum) || creatorAmountNum < MINIMUM_TIP_AMOUNT) {
      setError(`Please enter a valid amount for the creator (min $${MINIMUM_TIP_AMOUNT.toFixed(2)} or equivalent).`);
      return;
    }
    // --- END UPDATED VALIDATION ---

    setLoading(true); setError(null);
    try {
      const response = await apiClient.post('/stripe/create-checkout-session', {
        amount: creatorAmountNum,
        recipientUsername: recipientUsername,
      });
      
      const sessionId = response.data?.id;
      if (!sessionId) throw new Error('Failed to get session ID from backend.');
      
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe.js has not loaded yet.');

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
      if (stripeError) {
        setError(stripeError.message || "Could not redirect to Stripe.");
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Payment initiation failed.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 md:p-8 rounded-xl shadow-lg border border-gray-200">
      <h3 className="text-2xl font-semibold mb-1 text-gray-800 text-center">
        Support {recipientDisplayName || recipientUsername}!
      </h3>
      <p className="text-xs text-gray-500 text-center mb-4">
        Enter the amount you want them to receive.
      </p>
      {error && <p className="text-red-600 text-sm mb-4 p-3 bg-red-100 rounded-md text-center">{error}</p>}
      
      <div className="flex items-center justify-center space-x-2 mb-3">
        <span className="text-2xl font-medium text-gray-700">$</span>
        <input
          type="text"
          value={amount}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                setAmount(val);
            }
          }}
          min={MINIMUM_TIP_AMOUNT.toFixed(2)} // Updated HTML5 min attribute
          className="w-24 md:w-28 px-3 py-2.5 border border-gray-300 rounded-lg text-center text-xl font-medium text-black shadow-sm"
          placeholder={MINIMUM_TIP_AMOUNT.toFixed(2)}
        />
      </div>
      
      {creatorAmountNum > 0 && (
        <div className="text-xs text-gray-600 text-center mb-4 p-2 bg-gray-100 rounded-md">
            <p>
                Gift to {recipientDisplayName || recipientUsername}: <span className="font-semibold">${creatorAmountNum.toFixed(2)}</span>
            </p>
            <p className="mt-1">
                Platform Fee (15%): <span className="font-semibold">+ ${platformFeeNum.toFixed(2)}</span>
            </p>
            <p className="font-bold text-sm mt-2">
                Total You Pay: <span className="font-semibold">${totalDonorPaysNum.toFixed(2)}</span>
            </p>
        </div>
      )}

      <button
        onClick={handleTip}
        disabled={loading || isNaN(creatorAmountNum) || creatorAmountNum < MINIMUM_TIP_AMOUNT} // Updated disabled check
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3.5 px-6 rounded-lg text-lg shadow-md hover:shadow-lg transition-all disabled:opacity-60"
      >
        {loading ? 'Processing...' : `Pay $${totalDonorPaysNum > 0 ? totalDonorPaysNum.toFixed(2) : '...'}`}
      </button>
      <p className="text-xs text-gray-500 mt-3 text-center">Powered by Stripe</p>
    </div>
  );
}