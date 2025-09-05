'use client';

import { useState, useEffect, Suspense, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { createStripeOnboardLink } from '@/app/actions';

function ConnectStripeContent() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stripeAccountStatus, setStripeAccountStatus] = useState(null);
    const [isActionPending, startTransition] = useTransition();
    const [selectedCountry, setSelectedCountry] = useState('US'); // Default to United States
    
    // --- NEW: State for the list of countries ---
    const [countries, setCountries] = useState([]);

    const searchParams = useSearchParams();

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch both account status and the country list concurrently
                const [statusResponse, countriesResponse] = await Promise.all([
                    apiClient.get('/stripe/connect/account-status').catch(err => err.response),
                    apiClient.get('/public/stripe-supported-countries').catch(err => err.response)
                ]);

                // Handle account status response
                if (statusResponse?.status === 200) {
                    setStripeAccountStatus(statusResponse.data);
                } else if (statusResponse?.status === 403) {
                    setError("You must complete your profile before setting up payments.");
                } else if (statusResponse?.status !== 404) {
                    setError(statusResponse?.data?.message || "Could not retrieve Stripe account status.");
                }

                // Handle countries list response
                if (countriesResponse?.status === 200) {
                    setCountries(countriesResponse.data);
                } else {
                    // Fallback in case the API fails
                    setCountries([{ code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' }]);
                    console.error("Could not load country list from backend.");
                }

            } catch (err) {
                setError("An unexpected error occurred while loading page data.");
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
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

    if (loading) {
        return <p className="text-center p-10 text-lg text-gray-600 dark:text-gray-400">Loading your payment settings...</p>;
    }
    
    if (error === "You must complete your profile before setting up payments.") {
        return (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center max-w-lg mx-auto">
                <h1 className="text-2xl font-bold mb-3 text-red-600 dark:text-red-400">Profile Setup Required</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6">You must create and save your user profile before you can connect a Stripe account.</p>
                <Link href="/dashboard/profile" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg">Go to Profile Setup</Link>
            </div>
        );
    }
    
    if (stripeAccountStatus?.onboardingComplete) {
        return (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center max-w-lg mx-auto">
            <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h1 className="text-2xl font-bold mb-3">Stripe Account Connected!</h1>
            <p className="text-green-600 font-medium mb-6">Your account is fully set up to receive payments.</p>
            <Link href="/dashboard" className="text-blue-600 hover:underline font-semibold">Back to Dashboard</Link>
          </div>
        );
    }
    
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
                        disabled={countries.length === 0}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-black dark:text-white bg-white dark:bg-gray-700 disabled:bg-gray-200"
                    >
                        {countries.length > 0 ? (
                            countries.map(country => (
                                <option key={country.code} value={country.code}>
                                    {country.name}
                                </option>
                            ))
                        ) : (
                            <option>Loading countries...</option>
                        )}
                    </select>
                </div>

                {error && <p className="text-red-500 p-3 bg-red-100 dark:bg-red-900/30 rounded text-sm">{error}</p>}
                
                <button
                    type="submit"
                    disabled={isActionPending || countries.length === 0}
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