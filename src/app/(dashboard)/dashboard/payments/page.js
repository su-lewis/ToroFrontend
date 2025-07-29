// frontend/src/app/(dashboard)/dashboard/payments/page.js
'use client';

import { useState, useEffect, useTransition } from 'react';
import { 
    getPaymentStats, 
    getPaymentHistory, 
    createStripeDashboardLink,
    triggerInstantPayout,
    toggleAutoPayouts
} from '@/app/actions';
import { fetchProtectedDataFromServer } from '@/lib/server-api'; // To get initial user settings
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { Switch } from '@headlessui/react';

const formatCurrency = (cents, currency = 'USD') => {
    // Gracefully handle null/undefined currency
    const displayCurrency = currency ? currency.toUpperCase() : 'USD';
    try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: displayCurrency }).format(cents / 100);
    } catch (error) {
        // Fallback for invalid currency codes
        console.warn(`Invalid currency code provided to formatCurrency: ${currency}`);
        return `$${(cents / 100).toFixed(2)}`;
    }
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Server action to get the user's settings, callable from this client component
async function getUserSettings() {
    'use server';
    try {
        const user = await fetchProtectedDataFromServer('/users/me');
        return { success: true, data: user };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

export default function PaymentsPage() {
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [user, setUser] = useState(null); // To store user's payout preference
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isPending, startTransition] = useTransition(); // A general pending state
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);

    useEffect(() => {
        // We use a single transition for the initial data load
        startTransition(async () => {
            setError(null);
            const [statsResult, historyResult, userResult] = await Promise.all([
                getPaymentStats(),
                getPaymentHistory(),
                getUserSettings() // Also fetch user settings like stripeAutoPayoutsEnabled
            ]);

            if (statsResult.success) setStats(statsResult.data);
            else setError(statsResult.message || "Failed to load stats.");

            if (historyResult.success) setHistory(historyResult.data);
            else setError(prev => `${prev || ''} ${historyResult.message || "Failed to load history."}`.trim());

            if (userResult.success) setUser(userResult.data);
            else setError(prev => `${prev || ''} ${userResult.message || "Failed to load user settings."}`.trim());
            
            setIsLoadingInitial(false);
        });
    }, []); // Empty dependency array, runs once on mount

    const handleViewStripeDashboard = () => {
        startTransition(async () => {
            setError(null); setSuccess(null);
            const result = await createStripeDashboardLink();
            if (result.success && result.url) {
                window.open(result.url, '_blank', 'noopener,noreferrer');
            } else { setError(result.message); }
        });
    };
    
    const handlePayoutNow = () => {
        if (!window.confirm("This will attempt to instantly pay out your entire available Stripe balance. Stripe's 1% fee applies. Continue?")) return;
        startTransition(async () => {
            setError(null); setSuccess(null);
            const result = await triggerInstantPayout();
            if (result.success) {
                setSuccess(result.data.message);
                // After a short delay, refresh the page to update stats
                setTimeout(() => window.location.reload(), 3000);
            } else { setError(result.message); }
        });
    };

    const handleToggleAutoPayouts = (enabled) => {
        startTransition(async () => {
            setError(null); setSuccess(null);
            const result = await toggleAutoPayouts(enabled);
            if (result.success) {
                setUser(prev => ({ ...prev, stripeAutoPayoutsEnabled: enabled }));
                setSuccess(result.data.message);
            } else { setError(result.message); }
        });
    };

    if (isLoadingInitial) return <div className="text-center p-10 text-gray-500 dark:text-gray-400">Loading payment analytics...</div>;

    return (
        <div className="space-y-10">
            {error && <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md shadow">{error}</div>}
            {success && <div className="p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md shadow">{success}</div>}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Payment & Payouts</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">View your revenue and manage how you get paid.</p>
                </div>
                <button
                    onClick={handleViewStripeDashboard}
                    disabled={isPending}
                    className="w-full md:w-auto inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md text-sm disabled:opacity-70"
                >
                    {isPending ? 'Loading...' : 'Manage on Stripe'}
                    <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4"/>
                </button>
            </div>
            
            {/* Payouts Section */}
            <div>
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Payouts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Request Instant Payout</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-4">
                            Instantly pay out your total available Stripe balance to your debit card.
                        </p>
                        <button 
                            onClick={handlePayoutNow}
                            disabled={isPending}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
                        >
                            {isPending ? 'Processing...' : 'Payout Now'}
                        </button>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">A 1% fee is applied by Stripe for instant payouts.</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Automatic Daily Payouts</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-4">
                            Enable to have your balance automatically paid out daily. Disable for manual payouts.
                        </p>
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                            <span className="font-medium text-gray-700 dark:text-gray-200">
                                {user?.stripeAutoPayoutsEnabled ? 'Auto Payouts: ON' : 'Auto Payouts: OFF'}
                            </span>
                            <Switch
                                checked={user?.stripeAutoPayoutsEnabled || false}
                                onChange={handleToggleAutoPayouts}
                                disabled={isPending}
                                className={`${user?.stripeAutoPayoutsEnabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50`}
                            >
                                <span className="sr-only">Enable automatic payouts</span>
                                <span className={`${user?.stripeAutoPayoutsEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                            </Switch>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Section */}
            <div>
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Statistics</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">All-Time Revenue</h3>
                        <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">{formatCurrency(stats?.allTime?.revenueCents || 0)}</p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">from {stats?.allTime?.giftCount || 0} gifts</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Last 30 Days</h3>
                        <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">{formatCurrency(stats?.last30Days?.revenueCents || 0)}</p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">from {stats?.last30Days?.giftCount || 0} gifts</p>
                    </div>
                </div>
            </div>

            {/* Gift History Section */}
            <div>
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Gift History</h2>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date & Time</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">From</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount Received</th></tr></thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {history.length > 0 ? (
                                    history.map((p) => (<tr key={p.id}><td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{formatDate(p.createdAt)}</td><td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{p.payerName || 'Anonymous'}</td><td className="px-6 py-4 text-right font-semibold text-green-600 dark:text-green-400">{formatCurrency(p.netAmountToRecipient, p.currency)}</td></tr>))
                                ) : (
                                    <tr><td colSpan="3" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">You haven't received any gifts yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}