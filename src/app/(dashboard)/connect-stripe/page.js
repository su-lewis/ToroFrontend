// frontend/src/app/(dashboard)/connect-stripe/page.js
'use client';

import { useState, useEffect, Suspense } from 'react';
import apiClient from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ConnectStripeContent() {
    const [loading, setLoading] = useState(true); // Loading for initial status check
    const [buttonLoading, setButtonLoading] = useState(false); // Loading for the button click
    const [error, setError] = useState(null);
    const [stripeAccountStatus, setStripeAccountStatus] = useState(null);
    
    const searchParams = useSearchParams();

    useEffect(() => {
        const fetchAccountStatus = async () => {
            setLoading(true);
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

        fetchAccountStatus();

        if (searchParams.get('reauth')) {
            setError("Your previous Stripe session expired. Please try connecting again.");
        }
    }, [searchParams]);

    const handleStartOnboarding = async () => {
        setButtonLoading(true);
        setError(null);
        try {
            // POST request now sends an empty body.
            // The backend will not look for countryCode or phone.
            const response = await apiClient.post('/stripe/connect/onboard-user', {});
            
            if (response.data.url) {
                window.location.href = response.data.url; // Redirect user to Stripe
            } else {
                throw new Error('Failed to get Stripe onboarding URL from the server.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to initiate Stripe connection. Please try again.');
            setButtonLoading(false);
        }
    };

    if (loading) {
        return <p className="text-center p-10 text-lg text-gray-600">Loading your payment settings...</p>;
    }
    
    // SCENARIO 1: User is fully onboarded and ready to receive payments
    if (stripeAccountStatus?.onboardingComplete) {
        return (
          <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-lg mx-auto">
            <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h1 className="text-2xl font-bold mb-3 text-gray-800">Stripe Account Connected!</h1>
            <p className="text-green-600 font-medium mb-6">Your account is fully set up and ready to receive payments.</p>
            {/* You could add the "View Stripe Dashboard" button here too */}
            <Link href="/dashboard" className="text-blue-600 hover:underline font-semibold">
              Back to Dashboard
            </Link>
          </div>
        );
    }
    
    // SCENARIO 2: User is not fully onboarded, show the simple "Continue to Stripe" page
    return (
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">
                {stripeAccountStatus?.detailsSubmitted ? 'Complete Your Payout Setup' : 'Connect Stripe to Receive Payments'}
            </h1>
            <p className="text-gray-600 mb-8">
                Click the button below to securely connect with our payment partner, Stripe. You will be redirected to their website to select your country and provide the necessary information to verify your identity and link your bank account for payouts.
            </p>
            {error && <p className="text-red-500 mb-4 p-3 bg-red-100 rounded text-sm">{error}</p>}
            
            {/* NO FORM - JUST A BUTTON */}
            <button
                onClick={handleStartOnboarding}
                disabled={buttonLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {buttonLoading ? 'Redirecting...' : (stripeAccountStatus?.stripeAccountId ? 'Continue Onboarding' : 'Securely Connect with Stripe')}
            </button>
             <p className="text-xs text-gray-500 mt-4">
                This information is sent directly to Stripe and is never stored on our servers.
            </p>
        </div>
    );
}

// Wrap with Suspense
export default function ConnectStripePageWrapper() {
    return (
        <Suspense fallback={<p className="text-center p-10">Loading...</p>}>
            <ConnectStripeContent />
        </Suspense>
    );
}