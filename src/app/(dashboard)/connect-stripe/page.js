// frontend/src/app/(dashboard)/connect-stripe/page.js
'use client';

import { useState, useEffect, Suspense, useTransition } from 'react';
import { getStripeStatus, createStripeOnboardLink } from '@/app/actions'; // Import from actions.js
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ConnectStripeContent() {
    const [error, setError] = useState(null);
    const [stripeAccountStatus, setStripeAccountStatus] = useState(null);
    const [isPending, startTransition] = useTransition();
    const searchParams = useSearchParams();

    useEffect(() => {
        startTransition(async () => {
            const result = await getStripeStatus();
            if (result.success) {
                setStripeAccountStatus(result.data);
            } else {
                setError(result.message);
            }
        });
        if (searchParams.get('reauth')) {
            setError("Your previous session expired. Please try again.");
        }
    }, [searchParams]);

    const handleStartOnboarding = () => {
        startTransition(async () => {
            setError(null);
            const result = await createStripeOnboardLink();
            if (result.success && result.url) {
                window.location.href = result.url;
            } else {
                setError(result.message);
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