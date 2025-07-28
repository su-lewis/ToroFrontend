// frontend/src/app/(dashboard)/connect-stripe/page.js
'use client';

import { useState, useEffect, Suspense, useTransition } from 'react';
import { createStripeOnboardLink } from '@/app/actions';
import { fetchProtectedDataFromServer } from '@/lib/server-api'; // Still needed for initial GET
import Link from 'next/link';

// NOTE: This page now requires being a Client Component to use useTransition
// and handle the button click. We can fetch initial data with a server-side helper if needed,
// but it's simpler to do it client-side since this page is interactive.
// Let's create a server-side fetch function for this.

async function getStripeStatus() {
    'use server'; // This is a server action callable from a client component
    try {
        const status = await fetchProtectedDataFromServer('/stripe/connect/account-status');
        return { success: true, data: status };
    } catch (error) {
        if (error.status === 404) return { success: true, data: null }; // Not an error, just not found
        return { success: false, message: error.message };
    }
}

function ConnectStripeContent() {
    const [error, setError] = useState(null);
    const [stripeAccountStatus, setStripeAccountStatus] = useState(null);
    const [isPending, startTransition] = useTransition(); // For the button action

    useEffect(() => {
        startTransition(async () => {
            const result = await getStripeStatus();
            if (result.success) {
                setStripeAccountStatus(result.data);
            } else {
                setError(result.message);
            }
        });
    }, []);

    const handleStartOnboarding = () => {
        startTransition(async () => {
            const result = await createStripeOnboardLink();
            if (result.success && result.url) {
                window.location.href = result.url;
            } else {
                setError(result.message || 'Failed to start Stripe connection.');
            }
        });
    };

    if (isPending && !stripeAccountStatus) {
        return <p className="text-center p-10">Loading payment settings...</p>;
    }
    
    if (stripeAccountStatus?.onboardingComplete) {
        return (
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <h1 className="text-2xl font-bold">Stripe Account Connected!</h1>
            <p className="text-green-600 mb-6">Your account is ready to receive payments.</p>
            <Link href="/dashboard" className="text-blue-600 hover:underline">Back to Dashboard</Link>
          </div>
        );
    }
    
    return (
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">{stripeAccountStatus?.detailsSubmitted ? 'Complete Payout Setup' : 'Connect Stripe'}</h1>
            <p className="text-gray-600 mb-8">Click below to securely connect with Stripe to set up your payout account.</p>
            {error && <p className="text-red-500 mb-4 p-3 bg-red-100 rounded text-sm">{error}</p>}
            <button onClick={handleStartOnboarding} disabled={isPending} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg disabled:opacity-70">
                {isPending ? 'Processing...' : 'Securely Connect with Stripe'}
            </button>
        </div>
    );
}

export default function ConnectStripePageWrapper() {
    return (<Suspense fallback={<p>Loading...</p>}><ConnectStripeContent /></Suspense>);
}