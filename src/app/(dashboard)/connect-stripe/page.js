'use client';

import { useState, useEffect, Suspense, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { createStripeOnboardLink } from '@/app/actions'; // Using the Server Action

function ConnectStripeContent() {
    const [loading, setLoading] = useState(true); // Loading for initial status check
    const [error, setError] = useState(null);
    const [stripeAccountStatus, setStripeAccountStatus] = useState(null);
    const [isActionPending, startTransition] = useTransition(); // Loading for the button click
    
    const searchParams = useSearchParams();

    useEffect(() => {
        const fetchAccountStatus = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.get('/stripe/connect/account-status');
                setStripeAccountStatus(response.data);
            } catch (err) {
                // Specifically check for the 403 error when a profile is missing
                if (err.response?.status === 403) {
                    setError("You must complete your profile before setting up payments.");
                } else if (err.response?.status !== 404) { // Ignore 404, it means not connected yet
                    console.error("Error fetching Stripe status:", err);
                    setError(err.response?.data?.message || "Could not retrieve Stripe account status.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAccountStatus();

        if (searchParams.get('reauth')) {
            setError("Your previous Stripe session expired. Please try connecting again.");
        }
    }, [searchParams]);

    const handleStartOnboarding = async () => {
        setError(null);
        startTransition(async () => {
            const result = await createStripeOnboardLink();
            if (result.success && result.url) {
                // Redirect user to Stripe for onboarding
                window.location.href = result.url;
            } else {
                setError(result.message || 'Failed to initiate Stripe connection. Please try again.');
            }
        });
    };

    if (loading) {
        return <p className="text-center p-10 text-lg text-gray-600 dark:text-gray-400">Loading your payment settings...</p>;
    }
    
    // --- RENDER THIS NEW STATE for the 403 error ---
    if (error === "You must complete your profile before setting up payments.") {
        return (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center max-w-lg mx-auto">
                <h1 className="text-2xl font-bold mb-3 text-red-600 dark:text-red-400">Profile Setup Required</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    You must create and save your user profile before you can connect a Stripe account for payments.
                </p>
                <Link href="/dashboard/profile" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
                    Go to Profile Setup
                </Link>
            </div>
        );
    }
    
    // SCENARIO 1: User is fully onboarded and ready to receive payments
    if (stripeAccountStatus?.onboardingComplete) {
        return (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center max-w-lg mx-auto">
            <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h1 className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-100">Stripe Account Connected!</h1>
            <p className="text-green-600 font-medium mb-6">Your account is fully set up and ready to receive payments.</p>
            <Link href="/dashboard" className="text-blue-600 hover:underline font-semibold dark:text-blue-400">
              Back to Dashboard
            </Link>
          </div>
        );
    }
    
    // SCENARIO 2: User is not fully onboarded, show the simple "Continue to Stripe" page
    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-lg mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                {stripeAccountStatus?.detailsSubmitted ? 'Complete Your Payout Setup' : 'Connect Stripe to Receive Payments'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
                Click the button below to securely connect with our payment partner, Stripe. You will be redirected to their website to select your country and provide the necessary information to verify your identity and link your bank account for payouts.
            </p>
            {error && <p className="text-red-500 dark:text-red-400 mb-4 p-3 bg-red-100 dark:bg-red-900/30 rounded text-sm">{error}</p>}
            
            <button
                onClick={handleStartOnboarding}
                disabled={isActionPending}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isActionPending ? 'Redirecting...' : (stripeAccountStatus?.stripeAccountId ? 'Continue Onboarding' : 'Securely Connect with Stripe')}
            </button>
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                This information is sent directly to Stripe and is never stored on our servers.
            </p>
        </div>
    );
}

// Wrap with Suspense because useSearchParams is a client hook
export default function ConnectStripePageWrapper() {
    return (
        <Suspense fallback={<p className="text-center p-10 text-lg text-gray-600 dark:text-gray-400">Loading...</p>}>
            <ConnectStripeContent />
        </Suspense>
    );
}