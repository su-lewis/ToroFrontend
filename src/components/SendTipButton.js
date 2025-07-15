// frontend/src/components/SendTipButton.js
'use client';
import { useState } from 'react';
import apiClient from '@/lib/api';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function SendTipButton({ recipientUsername, recipientDisplayName }) {
  const [amountForCreator, setAmountForCreator] = useState('10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const platformFeePercentage = 0.15; // Your 15% flat fee

  const creatorAmountNum = parseFloat(amountForCreator);
  const platformFeeNum = isNaN(creatorAmountNum) || creatorAmountNum <= 0 ? 0 : creatorAmountNum * platformFeePercentage;
  const totalDonorPaysNum = creatorAmountNum + platformFeeNum;

  const handleTip = async () => {
    if (isNaN(creatorAmountNum) || creatorAmountNum < 1.00) {
      setError("Please enter an amount of at least $1.00 for the creator.");
      return;
    }
    setLoading(true); setError(null);
    try {
      const response = await apiClient.post('/stripe/create-checkout-session', {
        amount: creatorAmountNum, // Send the amount intended FOR THE CREATOR
        recipientUsername: recipientUsername,
      });
      // ... (Stripe redirect logic remains the same)
      const sessionId = response.data?.id;
      if (!sessionId) throw new Error('No session ID returned from server.');
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe.js failed to load.');
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
      if (stripeError) { setError(stripeError.message); setLoading(false); }
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
        <span className="text-3xl font-medium text-gray-700">$</span>
        <input
          type="text"
          value={amountForCreator}
          onChange={(e) => {
             const val = e.target.value;
             if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                 setAmountForCreator(val);
             }
          }}
          min="1.00" 
          className="w-28 md:w-32 px-3 py-2.5 border border-gray-300 rounded-lg text-center text-2xl font-medium text-black shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="10.00"
          aria-label="Amount to send to creator"
        />
      </div>
      
      {creatorAmountNum > 0 && (
        <div className="text-sm text-gray-600 text-center mb-5 bg-gray-100 p-3 rounded-lg">
            <p>Creator receives: <span className="font-semibold">${creatorAmountNum.toFixed(2)}</span></p>
            <p className="mt-1">Platform Fee (15%): <span className="font-semibold">${platformFeeNum.toFixed(2)}</span></p>
            <hr className="my-2"/>
            <p className="font-bold text-lg">Total Charge: ${totalDonorPaysNum.toFixed(2)}</p>
        </div>
      )}

      <button
        onClick={handleTip}
        disabled={loading || isNaN(creatorAmountNum) || creatorAmountNum < 1.00}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3.5 px-6 rounded-lg text-lg shadow-md hover:shadow-lg transition-all disabled:opacity-60"
      >
        {loading ? 'Processing...' : `Pay $${totalDonorPaysNum > 0 ? totalDonorPaysNum.toFixed(2) : '...'}`}
      </button>
      <p className="text-xs text-gray-500 mt-3 text-center">Secure payments powered by Stripe</p>
    </div>
  );
}