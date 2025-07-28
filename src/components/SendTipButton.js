// frontend/src/components/SendTipButton.js
'use client';

import { useState, useTransition } from 'react';
import { createCheckoutSession } from '@/app/actions';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function SendTipButton({ recipientUsername, recipientDisplayName }) {
  const [amount, setAmount] = useState('10');
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
      if (!stripe) {
        setError('Stripe.js failed to load.');
        return;
      }
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
      if (stripeError) {
        setError(stripeError.message);
      }
    });
  };

  return (
    <form action={handleTipSubmit} className="bg-gray-50 p-6 rounded-xl shadow-md border">
      <h3 className="text-xl font-bold mb-4 text-center">Send a Tip to {recipientDisplayName}</h3>
      {error && <p className="text-red-600 text-sm mb-4 p-2 bg-red-100 rounded-md text-center">{error}</p>}
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="recipientUsername" value={recipientUsername} />
      <div className="flex items-center justify-center space-x-2 mb-4">
        <span className="text-2xl font-medium">$</span>
        <input
          type="text"
          value={amount}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) setAmount(val);
          }}
          className="w-28 px-3 py-2 border rounded-lg text-center text-2xl font-semibold"
        />
      </div>
      {creatorAmountNum > 0 && (
        <div className="text-sm text-center mb-4 border-t border-b py-3">
            <div className="flex justify-between px-2"><span>Total You Pay:</span><span className="font-bold">${totalDonorPaysNum.toFixed(2)}</span></div>
            <p className="text-[10px] text-gray-500 mt-1">(Creator receives ${creatorAmountNum.toFixed(2)} before Stripe fees)</p>
        </div>
      )}
      <div className="mb-4 flex flex-col items-center">
        <input name="donorName" placeholder="Your name (optional)" maxLength="40" className="w-full max-w-xs px-3 py-2 border rounded-lg text-lg text-center" />
      </div>
      <button type="submit" disabled={isPending || isNaN(creatorAmountNum) || creatorAmountNum < 1.00} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg text-lg disabled:opacity-60">
        {isPending ? 'Processing...' : `Pay $${totalDonorPaysNum > 0 ? totalDonorPaysNum.toFixed(2) : '...'}`}
      </button>
      <p className="text-xs text-gray-500 mt-3 text-center">Powered by Stripe</p>
    </form>
  );
}