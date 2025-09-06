'use client';

import { useState, useEffect, Suspense, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { createStripeOnboardLink } from '@/app/actions';
// --- THIS IS THE FIX (Part 1) ---
// Import the static list of countries directly
import { supportedCountries } from '@/lib/stripe-countries';

function ConnectStripeContent() {
    // We no longer need a 'loading' state for the country list
    const [statusLoading, setStatusLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stripeAccountStatus, setStripeAccountStatus] = useState(null);
    const [isActionPending, startTransition] = useTransition();
    const [selectedCountry, setSelectedCountry] = useState('US');
    
    const searchParams = useSearchParams();

    useEffect(() => {
        // --- THIS IS THE FIX (Part 2) ---
        // This effect is now ONLY for fetching the account status.
        const fetchAccountStatus = async () => {
            setStatusLoading(true);
            setError(null);
            try {
                const response = await apiClient.get('/stripe/connect/account-status');
                setStripeAccountStatus(response.data);
            } catch (err) {
                if (err.response?.status === 403) {
                    setError("You must complete your profile before setting up payments.");
                } else if (err.response?.status !== 404) {
                    setError(err.response?.data?.message || "Could not retrieve Stripe account status.");
                }
            } finally {
                setStatusLoading(false);
            }
        };
        fetchAccountStatus();
        if (searchParams.get('reauth')) {
            setError("Your previous Stripe session expired. Please try connecting again.");
        }
    }, [searchParams]);

    const handleStartOnboarding = (formData) => {
        setError(null);
        startTransition(async () => {
            const result = await createStripeOnboardLink(formData);
            if (result.success && result.url) {
                window.location.href = result.url;
            } else {
                setError(result.message || 'Failed to initiate Stripe connection.');
            }
        });
    };

    if (statusLoading) {
        return <p className="text-center p-10 text-lg text-gray-600 dark:text-gray-400">Loading your payment settings...</p>;
    }
    
    // ... (The rest of the component's JSX remains the same, including the error display for profile setup)
    if (error === "You must complete your profile before setting up payments.") { /* ... same as before ... */ }
    if (stripeAccountStatus?.onboardingComplete) { /* ... same as before ... */ }
    
    // The main onboarding page with the full country list
    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-lg mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">
                {stripeAccountStatus?.detailsSubmitted ? 'Complete Your Payout Setup' : 'Connect Stripe to Receive Payments'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
                First, select your country. Then, click the button to securely connect with Stripe to verify your identity and link your bank account for payouts.
            </p>
            
            <form action={handleStartOnboarding} className="space-y-6">
                <div>
                    <label htmlFor="country" className="block text-sm font-medium text-left text-gray-700 dark:text-gray-300 mb-1">Country</label>
                    <select
                        id="country"
                        name="country"
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-black dark:text-white bg-white dark:bg-gray-700"
                    >
                        {/* --- THIS IS THE FIX (Part 3) --- */}
                        {/* Map over the imported static list */}
                        {supportedCountries.map(country => (
                            <option key={country.code} value={country.code}>
                                {country.name}
                            </option>
                        ))}
                    </select>
                </div>

                {error && <p className="text-red-500 p-3 bg-red-100 dark:bg-red-900/30 rounded text-sm">{error}</p>}
                
                <button
                    type="submit"
                    disabled={isActionPending}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors disabled:opacity-70"
                >
                    {isActionPending ? 'Redirecting...' : 'Securely Connect with Stripe'}
                </button>
            </form>
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Powered by Stripe. Your details are sent securely and are never stored on our servers.
            </p>
        </div>
    );
}

export default function ConnectStripePageWrapper() {
    return (
        <Suspense fallback={<p className="text-center p-10 text-lg text-gray-600 dark:text-gray-400">Loading...</p>}>
            <ConnectStripeContent />
        </Suspense>
    );
}