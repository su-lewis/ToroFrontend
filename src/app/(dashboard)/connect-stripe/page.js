// File: frontend/src/app/(dashboard)/dashboard/connect-stripe/page.js (Final Corrected Version)

'use client';

import { useState, useEffect, Suspense } from 'react';
import apiClient from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ConnectStripeContent() {
    const [loading, setLoading] = useState(true);
    const [buttonLoading, setButtonLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stripeAccountStatus, setStripeAccountStatus] = useState(null);
    
    const searchParams = useSearchParams();

    useEffect(() => {
        const fetchAccountStatus = async () => {
            setError(null);
            try {
                const response = await apiClient.get('/stripe/connect/account-status');
                setStripeAccountStatus(response.data);
            } catch (err) {
                if (err.response?.status !== 404) { // Ignore 404, it means not connected yet
                    console.error("Error fetching Stripe status:", err);
                    setError(err.response?.data?.message || "Could not retrieve Stripe account status.");
                }
            } finally {
                setLoading(false);
            }
        };

        // Use onAuthStateChange to ensure the session is ready before fetching
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
                if (session) {
                    // Now that we have a confirmed session, we can safely make the API call.
                    fetchAccountStatus();
                } else {
                    // This case handles when the initial check finds no user.
                    setLoading(false);
                }
            }
        });

        if (searchParams.get('reauth')) {
            setError("Your previous Stripe session expired. Please try connecting again.");
        }

        // Cleanup the subscription when the component unmounts
        return () => {
            subscription.unsubscribe();
        };
    }, [searchParams]);

    const handleStartOnboarding = async () => {
        setButtonLoading(true);
        setError(null);
        try {
            const response = await apiClient.post('/stripe/connect/onboard-user', {});
            if (response.data.url) {
                window.location.href = response.data.url;
            } else {
                throw new Error('Failed to get Stripe onboarding URL from the server.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to initiate Stripe connection. Please try again.');
            setButtonLoading(false);
        }
    };

    if (loading) {
        return <p className="text-center p-10 text-lg text-gray-600 dark:text-gray-400">Verifying session...</p>;
    }
    
    if (stripeAccountStatus?.onboardingComplete) {
        return (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center max-w-lg mx-auto">
            <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h1 className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-100">Stripe Account Connected!</h1>
            <p className="text-green-600 font-medium mb-6">Your account is fully set up and ready to receive payments.</p>
            <Link href="/dashboard" className="text-blue-600 hover:underline font-semibold">
              Back to Dashboard
            </Link>
          </div>
        );
    }
    
    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-lg mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                {stripeAccountStatus?.detailsSubmitted ? 'Complete Your Payout Setup' : 'Connect Stripe to Receive Payments'}
            </h1>
            <p className="text-gray-600 mb-8">
                Click the button below to securely connect with Stripe. You will be redirected to their website to provide the necessary information to verify your identity and link your bank account for payouts.
            </p>
            {error && <p className="text-red-500 mb-4 p-3 bg-red-100 dark:bg-red-900/30 rounded text-sm">{error}</p>}
            
            <button
                onClick={handleStartOnboarding}
                disabled={buttonLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {buttonLoading ? 'Redirecting...' : (stripeAccountStatus?.stripeAccountId ? 'Continue Onboarding' : 'Securely Connect with Stripe')}
            </button>
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                This information is sent directly to Stripe and is never stored on our servers.
            </p>
        </div>
    );
}

export default function ConnectStripePageWrapper() {
    return (
        <Suspense fallback={<p className="text-center p-10">Loading...</p>}>
            <ConnectStripeContent />
        </Suspense>
    );
}