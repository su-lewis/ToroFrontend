// frontend/src/components/SendTipButton.js
'use client';

import { useState } from 'react';
import apiClient from '@/lib/api';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function SendTipButton({ recipientUsername, recipientDisplayName }) {
  const MINIMUM_TIP_AMOUNT = 5;
  const [amount, setAmount] = useState(MINIMUM_TIP_AMOUNT.toString());
  const [donorName, setDonorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const platformFeePercentage = 0.15;

  // Calculation for the simple "add-on" fee model
  const calculateTotalDonorPays = (creatorAmount) => {
    if (isNaN(creatorAmount) || creatorAmount <= 0) return { total: 0, fee: 0 };
    const fee = creatorAmount * platformFeePercentage;
    const total = creatorAmount + fee;
    return { total, fee };
  };

  const creatorAmountNum = parseFloat(amount);
  const { total: totalDonorPaysNum, fee: platformFeeNum } = calculateTotalDonorPays(creatorAmountNum);

  const handleTip = async () => {
    if (isNaN(creatorAmountNum) || creatorAmountNum < MINIMUM_TIP_AMOUNT) {
      setError(`Please enter a valid amount for the creator (min $${MINIMUM_TIP_AMOUNT.toFixed(2)} or equivalent).`);
      return;
    }
    setLoading(true); 
    setError(null);
    try {
      const response = await apiClient.post('/stripe/create-checkout-session', {
        amount: creatorAmountNum,
        recipientUsername: recipientUsername,
        // If donorName is empty, send 'Anonymous', otherwise send the trimmed name
        donorName: donorName.trim() === '' ? 'Anonymous' : donorName.trim(),
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
    <div className="bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200">
      <h3 className="text-xl font-bold mb-4 text-gray-800 text-center">
        Send a Tip to {recipientDisplayName || recipientUsername}
      </h3>
      
      {error && <p className="text-red-600 text-sm mb-4 p-2 bg-red-100 rounded-md text-center">{error}</p>}
      
      {/* Amount Input Section */}
      <div className="flex items-center justify-center space-x-2 mb-4">
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
          min={MINIMUM_TIP_AMOUNT.toFixed(2)}
          className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-center text-2xl font-semibold text-black shadow-sm"
          placeholder={MINIMUM_TIP_AMOUNT.toFixed(2)}
        />
      </div>
      
      {/* Simplified Fee Breakdown Section */}
      {creatorAmountNum > 0 && (
        <div className="text-sm text-gray-600 text-center mb-4 border-t border-b border-gray-200 py-3">
            <div className="flex justify-between items-center px-2">
                <span>Platform & Stripe Fee:</span>
                <span className="font-semibold">+ ${platformFeeNum.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center px-2 mt-2 pt-2 border-t border-gray-200">
                <span className="font-bold">Total You Pay:</span>
                <span className="font-bold">${totalDonorPaysNum.toFixed(2)}</span>
            </div>
        </div>
      )}

      {/* --- REVISED NAME FIELD SECTION (Positioned above Pay button) --- */}
      <div className="mb-4 flex flex-col items-center">
        <input
          id="donorName"
          type="text"
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          placeholder="Anonymous"
          maxLength="18"
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-lg text-black shadow-sm text-center"
        />
      </div>

      <button
        onClick={handleTip}
        disabled={loading || isNaN(creatorAmountNum) || creatorAmountNum < MINIMUM_TIP_AMOUNT}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md hover:shadow-lg transition-all disabled:opacity-60"
      >
        {loading ? 'Processing...' : `Pay $${totalDonorPaysNum > 0 ? totalDonorPaysNum.toFixed(2) : '...'}`}
      </button>
      <p className="text-xs text-gray-500 mt-3 text-center">Powered by Stripe</p>
    </div>
  );
}