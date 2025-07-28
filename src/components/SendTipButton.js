// frontend/src/components/SendTipButton.js
'use client';

import { useState, useTransition } from 'react';
import { createCheckoutSession } from '@/app/actions'; // Import the new Server Action
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function SendTipButton({ recipientUsername, recipientDisplayName }) {
  const MINIMUM_TIP_AMOUNT = 1.00; // Let's use 1.00 for consistency with backend
  const [amount, setAmount] = useState(MINIMUM_TIP_AMOUNT.toString());
  const [donorName, setDonorName] = useState('');
  const [error, setError] = useState(null);
  // useTransition is for Server Actions, replaces the old 'loading' state
  const [isPending, startTransition] = useTransition();

  const platformFeePercentage = 0.15;
  // This is the correct "gross-up" calculation that matches your backend
  const calculateTotalDonorPays = (creatorAmount) => {
    if (isNaN(creatorAmount) || creatorAmount <= 0) return { total: 0, fee: 0 };
    const stripeFeePercentage = 0.029;
    const stripeFeeFixedDollars = 0.30;
    const total = (creatorAmount + stripeFeeFixedDollars) / (1 - platformFeePercentage - stripeFeePercentage);
    const fee = total - creatorAmount;
    return { total, fee };
  };

  const creatorAmountNum = parseFloat(amount);
  const { total: totalDonorPaysNum } = calculateTotalDonorPays(creatorAmountNum);

  const handleTipSubmit = async (formData) => {
    setError(null);
    if (isNaN(creatorAmountNum) || creatorAmountNum < MINIMUM_TIP_AMOUNT) {
      setError(`Minimum tip amount is $${MINIMUM_TIP_AMOUNT.toFixed(2)}.`);
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
      if (!stripe) {
        setError('Stripe.js has not loaded. Please refresh the page.');
        return;
      }
      
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
      if (stripeError) {
        setError(stripeError.message || "Could not redirect to payment page.");
      }
    });
  };

  return (
    // The form now calls the server action directly
    <form action={handleTipSubmit} className="bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200">
      <h3 className="text-xl font-bold mb-4 text-gray-800 text-center">
        Send a Tip to {recipientDisplayName || recipientUsername}
      </h3>
      
      {error && <p className="text-red-600 text-sm mb-4 p-2 bg-red-100 rounded-md text-center">{error}</p>}
      
      {/* Hidden inputs to pass data to the Server Action */}
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="recipientUsername" value={recipientUsername} />

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
      
      {creatorAmountNum > 0 && (
        <div className="text-sm text-gray-600 text-center mb-4 border-t border-b border-gray-200 py-3">
            <div className="flex justify-between items-center px-2">
                <span>Your tip for {recipientDisplayName}:</span>
                <span className="font-semibold">${creatorAmountNum.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center px-2 mt-2 pt-2 border-t border-gray-200">
                <span className="font-bold">Total You Pay:</span>
                <span className="font-bold">${totalDonorPaysNum.toFixed(2)}</span>
            </div>
             <p className="text-[10px] text-gray-500 mt-1">(Includes platform & payment processing fees)</p>
        </div>
      )}

      <div className="mb-4 flex flex-col items-center">
        <input
          id="donorName"
          name="donorName" // 'name' attribute is crucial for FormData
          placeholder="Your name (optional)"
          maxLength="40"
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-lg text-black shadow-sm text-center"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || isNaN(creatorAmountNum) || creatorAmountNum < MINIMUM_TIP_AMOUNT}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md hover:shadow-lg transition-all disabled:opacity-60"
      >
        {isPending ? 'Processing...' : `Pay $${totalDonorPaysNum > 0 ? totalDonorPaysNum.toFixed(2) : '...'}`}
      </button>
      <p className="text-xs text-gray-500 mt-3 text-center">Powered by Stripe</p>
    </form>
  );
}