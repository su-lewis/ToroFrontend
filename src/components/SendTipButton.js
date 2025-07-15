// frontend/src/components/SendTipButton.js
'use client';

import { useState } from 'react';
import apiClient from '@/lib/api'; // Your client-side Axios helper
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe.js outside of the component to avoid re-creating on every render.
// Ensure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is in your .env.local
if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error("Stripe Publishable Key is missing from environment variables.");
}
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function SendTipButton({ recipientUsername, recipientDisplayName }) {
  const [amount, setAmount] = useState('5'); // Default tip amount, as a string for input field
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const platformFeePercentage = 0.10; // 10%

  const calculateTotalDonorPays = (creatorAmount) => {
    if (isNaN(creatorAmount) || creatorAmount <= 0) return 0;
    // GrossAmount = CreatorReceivesAmount / (1 - PlatformFeePercentage)
    return creatorAmount / (1 - platformFeePercentage);
  };

  const creatorAmountNum = parseFloat(amount);
  const totalDonorPaysNum = calculateTotalDonorPays(creatorAmountNum);

  const handleTip = async () => {
    // Basic validation
    if (!recipientUsername) {
      setError("Recipient information is missing. Cannot proceed.");
      return;
    }
    if (isNaN(creatorAmountNum) || creatorAmountNum < 0.50) { // Stripe has minimums, e.g. $0.50
      setError("Please enter a valid amount for the creator (min $0.50).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Call your backend to create a Stripe Checkout Session
      const response = await apiClient.post('/stripe/create-checkout-session', {
        amount: creatorAmountNum, // Send the amount intended FOR THE CREATOR
        recipientUsername: recipientUsername,
      });

      const sessionId = response.data?.id;
      if (!sessionId) {
        throw new Error('Failed to create a checkout session ID from the backend.');
      }

      // 2. Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe.js has not loaded yet. Please check your connection.');
      }
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });

      if (stripeError) {
        console.error("Stripe redirect error:", stripeError);
        setError(stripeError.message || "Could not redirect to Stripe. Please try again.");
        setLoading(false); // Ensure loading is false if redirect fails
      }
      // If redirectToCheckout is successful, the user is navigated away.
    } catch (err) {
      console.error("Error initiating tip:", err);
      setError(err.response?.data?.message || err.message || 'Payment initiation failed. Please try again.');
      setLoading(false); // Ensure loading is false on error
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
      {error && (
        <p className="text-red-600 text-sm mb-4 p-3 bg-red-100 rounded-md text-center">
          {error}
        </p>
      )}
      
      <div className="flex items-center justify-center space-x-2 mb-3">
        <span className="text-3xl font-medium text-gray-700">$</span>
        <input
          type="text" // Use text for better decimal input handling
          value={amount}
          onChange={(e) => {
             const val = e.target.value;
             // Allow empty string, numbers, and up to two decimal places
             if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                 setAmount(val);
             }
          }}
          min="0.50" 
          className="w-28 md:w-32 px-3 py-2.5 border border-gray-300 rounded-lg text-center text-2xl font-medium text-black shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="5.00"
          aria-label="Amount to tip"
        />
      </div>
      
      {creatorAmountNum > 0 && (
        <div className="text-xs text-gray-600 text-center mb-5 bg-gray-100 p-2 rounded-md">
            <p>You will pay: <span className="font-semibold">${totalDonorPaysNum.toFixed(2)}</span> (includes platform fee).</p>
            <p className="mt-1">{recipientDisplayName || recipientUsername} receives: <span className="font-semibold">${creatorAmountNum.toFixed(2)}</span> (before Stripe's fees).</p>
        </div>
      )}

      <button
        onClick={handleTip}
        disabled={loading || isNaN(creatorAmountNum) || creatorAmountNum < 0.50}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3.5 px-6 rounded-lg text-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : `Tip $${creatorAmountNum > 0 ? creatorAmountNum.toFixed(2) : '...'}`}
      </button>
      <p className="text-xs text-gray-500 mt-3 text-center">Secure payments powered by Stripe</p>
    </div>
  );
}