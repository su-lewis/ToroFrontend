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
    const [countries, setCountries] = useState([]);

    const searchParams = useSearchParams();

    useEffect(() => {
        const loadInitialData = async () => {
            setError(null);
            
            // --- THIS IS THE FIX ---
            // We separate the API calls to make debugging easier and handle errors gracefully.
            
            // Fetch Countries First
            try {
                const countriesResponse = await apiClient.get('/public/stripe-supported-countries');
                if (countriesResponse.data) {
                    setCountries(countriesResponse.data);
                } else {
                    // This is a real error - the endpoint returned no data
                    throw new Error("Country list is empty.");
                }
            } catch (err) {
                console.error("Failed to fetch country list:", err);
                setError("Could not load the list of supported countries. Please refresh the page.");
                setCountries([]); // Ensure countries list is empty on error
            }

            // Fetch Account Status
            try {
                const statusResponse = await apiClient.get('/stripe/connect/account-status');
                setStripeAccountStatus(statusResponse.data);
            } catch (err) {
                if (err.response?.status === 403) {
                    setError("You must complete your profile before setting up payments.");
                } else if (err.response?.status !== 404) {
                    setError(prevError => prevError || err.response?.data?.message || "Could not retrieve Stripe account status.");
                }
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
                            <option disabled>Loading countries...</option>
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