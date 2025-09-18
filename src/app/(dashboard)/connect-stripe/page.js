// frontend/src/app/(dashboard)/connect-stripe/page.js

'use client';

import { useState, useEffect, Suspense, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { createStripeOnboardLink, createStripeDashboardLink } from '@/app/actions'; // Assuming dashboard link action is available
import { supportedCountries } from '@/lib/stripe-countries';
import { ArrowTopRightOnSquareIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

function ConnectStripeContent() {
    const [statusLoading, setStatusLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stripeAccountStatus, setStripeAccountStatus] = useState(null);
    const [isActionPending, startTransition] = useTransition();
    const [selectedCountry, setSelectedCountry] = useState('US');
    
    const searchParams = useSearchParams();

    useEffect(() => {
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

    const handleAction = (actionFn, ...args) => {
        setError(null);
        startTransition(async () => {
            const result = await actionFn(...args);
            if (result.success && result.url) {
                if (actionFn === createStripeDashboardLink) {
                    window.open(result.url, '_blank', 'noopener,noreferrer');
                } else {
                    window.location.href = result.url;
                }
            } else {
                setError(result.message || 'An unexpected error occurred.');
            }
        });
    };

    if (statusLoading) {
        return <p className="text-center p-10 text-lg text-gray-600 dark:text-gray-400">Loading your payment settings...</p>;
    }
    
    // --- RENDER BLOCK FOR INCOMPLETE PROFILE ---
    if (error === "You must complete your profile before setting up payments.") {
      return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-lg mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4 text-yellow-600 dark:text-yellow-400">Profile Setup Required</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
                Please set up your username and other profile details before connecting Stripe. This ensures your public page is ready to go.
            </p>
            <Link href="/dashboard/profile" className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors">
                Go to Profile Setup
            </Link>
        </div>
      );
    }

    // --- RENDER BLOCK FOR COMPLETED ONBOARDING ---
    if (stripeAccountStatus?.onboardingComplete) {
      return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-lg mx-auto text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-4">You're All Set!</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
                Your Stripe account is connected and ready to receive payments. You can manage your payout details or view your balance on the Stripe dashboard.
            </p>
            <button
                onClick={() => handleAction(createStripeDashboardLink)}
                disabled={isActionPending}
                className="w-full inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors disabled:opacity-70"
            >
                {isActionPending ? 'Loading...' : 'Open Stripe Dashboard'}
                <ArrowTopRightOnSquareIcon className="ml-2 h-5 w-5" />
            </button>
        </div>
      );
    }
    
    // The main onboarding page with the full country list
    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-lg mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">
                {stripeAccountStatus?.detailsSubmitted ? 'Complete Your Payout Setup' : 'Connect Stripe to Receive Payments'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
                First, select your country. Then, click the button to securely connect with Stripe to verify your identity and link your bank account for payouts.
            </p>
            
            <form action={(formData) => handleAction(createStripeOnboardLink, formData)} className="space-y-6">
                <div>
                    <label htmlFor="country" className="block text-sm font-medium text-left text-gray-700 dark:text-gray-300 mb-1">Country</label>
                    <select
                        id="country"
                        name="country"
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-black dark:text-white bg-white dark:bg-gray-700"
                    >
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