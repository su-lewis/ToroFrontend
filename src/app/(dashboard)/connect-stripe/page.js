// frontend/src/app/(dashboard)/connect-stripe/page.js
'use client';

import { useState, useEffect, Suspense } from 'react';
import apiClient from '@/lib/api';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// This is the main component logic, wrapped in Suspense below
function ConnectStripeContent() {
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState(null);
    const [stripeAccountStatus, setStripeAccountStatus] = useState(null);
    
    // Form state for pre-onboarding
    const [countryCode, setCountryCode] = useState('US');
    const [phone, setPhone]           = useState('');

    const searchParams = useSearchParams();
    const router = useRouter(); // If you need to programmatically navigate

    // On page load, fetch the user's current Stripe account status
    useEffect(() => {
        const fetchAccountStatus = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.get('/stripe/connect/account-status');
                setStripeAccountStatus(response.data);
                if (response.data?.accountCountry) {
                    setCountryCode(response.data.accountCountry);
                }
            } catch (err) {
                if (err.response?.status !== 404) {
                    console.error("Error fetching Stripe status:", err);
                    setError(err.response?.data?.message || "Could not retrieve your Stripe account status.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchAccountStatus();
        if (searchParams.get('reauth')) {
            setError("Your previous session expired. Please try connecting again.");
        }
    }, [searchParams]);

    // This function is called when the user submits your pre-onboarding form
    const handleStartOnboarding = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // This POST request sends the collected country/phone to your backend
            const response = await apiClient.post('/stripe/connect/onboard-user', {
                countryCode,
                phone, // Now this is required and will be sent
            });
            if (response.data.url) {
                window.location.href = response.data.url; // Redirect user to Stripe
            } else {
                throw new Error('Failed to get Stripe onboarding URL from the server.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to initiate Stripe connection. Please try again.');
            setLoading(false);
        }
    };

    if (loading) {
        return <p className="text-center p-10 text-lg text-gray-600">Loading payment settings...</p>;
    }
    
    // SCENARIO 1: User is fully onboarded and ready to receive payments
    if (stripeAccountStatus?.onboardingComplete) {
        return (
          <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-lg mx-auto">
            <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h1 className="text-2xl font-bold mb-3 text-gray-800">Stripe Account Connected!</h1>
            <p className="text-green-600 font-medium mb-6">Your account is fully set up and ready to receive payments.</p>
            <Link href="/dashboard" className="text-blue-600 hover:underline font-semibold">
              Back to Dashboard
            </Link>
          </div>
        );
    }
    
    // SCENARIO 2: User is not fully onboarded, show the pre-onboarding form
    return (
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg mx-auto">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">
                {stripeAccountStatus?.detailsSubmitted ? 'Complete Your Payout Setup' : 'Connect Stripe to Receive Payments'}
            </h1>
            <p className="text-gray-600 mb-6">
                To receive payouts, you'll be redirected to our secure payment partner, Stripe. They will ask for identity and bank information required by financial regulations.
            </p>
            {error && <p className="text-red-500 mb-4 p-3 bg-red-100 rounded text-sm">{error}</p>}
            
            {stripeAccountStatus?.detailsSubmitted && !stripeAccountStatus?.payoutsEnabled && (
                <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-md border border-blue-200">
                    <p className="font-semibold">Almost there!</p>
                    <p className="text-sm">Your personal details have been submitted to Stripe. The final step is usually to add or verify your bank account for payouts. Click below to continue.</p>
                </div>
            )}
            
            <form onSubmit={handleStartOnboarding} className="space-y-6">
                <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">Your Country</label>
                    <select
                        id="country"
                        name="country"
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black focus:ring-indigo-500 focus:border-indigo-500"
                        required
                        disabled={!!stripeAccountStatus?.accountCountry}
                    >
                        <option value="US">United States</option>
                        <option value="GB">United Kingdom</option>
                        <option value="CA">Canada</option>
                        <option value="AU">Australia</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="ES">Spain</option>
                        <option value="IT">Italy</option>
                    </select>
                </div>
                <div>
                    {/* UPDATED: Removed "(Optional)" and added 'required' */}
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number (for verification)</label>
                    <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 555 123 4567"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500"
                        required 
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? 'Processing...' : 'Securely Continue to Stripe'}
                </button>
            </form>
        </div>
    );
}

// Wrap with Suspense because useSearchParams() is used
export default function ConnectStripePageWrapper() {
    return (
        <Suspense fallback={<p className="text-center p-10">Loading...</p>}>
            <ConnectStripeContent />
        </Suspense>
    );
}