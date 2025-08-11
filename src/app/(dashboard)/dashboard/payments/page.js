// frontend/src/app/(dashboard)/dashboard/payments/page.js
'use client';
import { useState, useEffect, useTransition, useRef } from 'react'; // Add useRef
import { 
    getPaymentStats, 
    getPaymentHistory, 
    createStripeDashboardLink,
    triggerInstantPayout,
    toggleAutoPayouts,
    getUserSettings,
    getStripeBalance,
    updateUserCurrency 
} from '@/app/actions';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { Switch } from '@headlessui/react';

const formatCurrency = (cents, currency = 'USD') => {
    const displayCurrency = currency ? currency.toUpperCase() : 'USD';
    try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: displayCurrency }).format(cents / 100);
    } catch (error) {
        // Fallback for invalid currency codes, which can happen if data is missing
        console.warn(`Invalid currency code provided to formatCurrency: ${currency}`);
        return `$${(cents / 100).toFixed(2)}`;
    }
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

export default function PaymentsPage() {
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [user, setUser] = useState(null);
    const [balance, setBalance] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isPending, startTransition] = useTransition(); // General pending state for actions
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);

    const [timeframe, setTimeframe] = useState('30d');

// --- ADD THIS NEW COMPONENT INSIDE THE FILE ---
function CurrencySettings({ user, isPending, setSuccess, setError }) {
    const [_, startTransition] = useTransition();
    const formRef = useRef(null);

    const handleCurrencyChange = (event) => {
        const formData = new FormData(formRef.current);
        startTransition(async () => {
            setError(null); setSuccess(null);
            const result = await updateUserCurrency(formData);
            if (result.success) {
                setSuccess(result.message);
            } else {
                setError(result.message);
            }
        });
    };

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Currency Settings</h2>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <form ref={formRef}>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Preferred Payment Currency
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2">
                        This is the currency donors will see and pay in on your public profile.
                    </p>
                    <select
                        id="currency"
                        name="currency"
                        defaultValue={user?.preferredCurrency || 'usd'}
                        onChange={handleCurrencyChange}
                        disabled={isPending}
                        className="mt-1 block w-full md:w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-black dark:text-white bg-white dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="usd">USD ($)</option>
                        <option value="eur">EUR (€)</option>
                        <option value="gbp">GBP (£)</option>
                        <option value="cad">CAD (C$)</option>
                        <option value="aud">AUD (A$)</option>
                        {/* Add more currencies here that you want to support */}
                    </select>
                </form>
            </div>
        </div>
    );
}

    // Effect for initial data load
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoadingInitial(true);
            setError(null);
            try {
                // First, get user settings to determine their currency
                const userResult = await getUserSettings();
                if (!userResult.success) throw new Error(userResult.message);
                setUser(userResult.data);
                const userCurrency = userResult.data?.defaultCurrency || 'usd';

                // Then, fetch all other data in parallel
                const [statsResult, historyResult, balanceResult] = await Promise.all([
                    getPaymentStats(timeframe, userCurrency),
                    getPaymentHistory(),
                    getStripeBalance()
                ]);

                if (statsResult.success) setStats(statsResult.data);
                if (historyResult.success) setHistory(historyResult.data);
                if (balanceResult.success) setBalance(balanceResult.data);

            } catch (err) {
                setError(err.message || 'Failed to load initial payment data. Please refresh the page.');
            } finally {
                setIsLoadingInitial(false);
            }
        };

        startTransition(async () => {
            loadInitialData();
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only on initial mount

    const handleTimeframeChange = (newTimeframe) => {
        setTimeframe(newTimeframe);
        const userCurrency = user?.defaultCurrency || 'usd';
        startTransition(async () => {
            setError(null);
            const result = await getPaymentStats(newTimeframe, userCurrency);
            if (result.success) {
                setStats(result.data);
            } else {
                setError(result.message);
            }
        });
    };

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
        if (!window.confirm("This will attempt to instantly pay out your available Stripe balance. Stripe's 1% fee applies. Continue?")) return;
        startTransition(async () => {
            setError(null); setSuccess(null);
            const result = await triggerInstantPayout();
            if (result.success) {
                setSuccess(result.data.message + " Refreshing balance...");
                // Re-fetch only the balance instead of reloading the whole page for a smoother UX.
                const balanceResult = await getStripeBalance();
                if (balanceResult.success) {
                    setBalance(balanceResult.data);
                }
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

    const availableBalance = balance?.available?.[0];
    const periodStats = stats?.period;

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
                <CurrencySettings user={user} isPending={isPending} setSuccess={setSuccess} setError={setError} />
                <button
                    onClick={handleViewStripeDashboard}
                    disabled={isPending}
                    className="w-full md:w-auto inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md text-sm disabled:opacity-70"
                >
                    {isPending ? 'Loading...' : 'Manage on Stripe'}
                    <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4"/>
                </button>
            </div>
            
            <div>
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Payouts & Balance</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Available for Payout</h3>
                            <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-2">
                                {availableBalance ? formatCurrency(availableBalance.amount, availableBalance.currency) : '$0.00'}
                            </p>
                             <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Your current Stripe balance.</p>
                        </div>
                    </div>
                    <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Request Instant Payout</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-4">
                            Instantly pay out your available balance.
                        </p>
                        <button onClick={handlePayoutNow} disabled={isPending || !availableBalance || availableBalance.amount <= 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
                            {isPending ? 'Processing...' : 'Payout Now'}
                        </button>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">Stripe applies a 1% fee.</p>
                    </div>
                    <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Automatic Payouts</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-4">
                            Enable for automatic daily standard payouts.
                        </p>
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                            <span className="font-medium text-gray-700 dark:text-gray-200">
                                {user?.stripeAutoPayoutsEnabled ? 'Auto Payouts: ON' : 'Auto Payouts: OFF'}
                            </span>
                            <Switch checked={user?.stripeAutoPayoutsEnabled || false} onChange={handleToggleAutoPayouts} disabled={isPending} className={`${user?.stripeAutoPayoutsEnabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50`}>
                                <span className={`${user?.stripeAutoPayoutsEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                            </Switch>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Statistics</h2>
                    <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                        {['Today', '7d', '30d'].map((periodLabel) => {
                            const periodValue = periodLabel.toLowerCase();
                            return (
                                <button
                                    key={periodValue}
                                    onClick={() => handleTimeframeChange(periodValue)}
                                    disabled={isPending}
                                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
                                        timeframe === periodValue
                                            ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'
                                    }`}
                                >
                                    {isPending && timeframe === periodValue ? '...' : periodLabel}
                                </button>
                            )
                        })}
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">All-Time Revenue</h3>
                        <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">{formatCurrency(stats?.allTime?.revenueCents || 0, stats?.allTime?.currency)}</p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">from {stats?.allTime?.giftCount || 0} gifts</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                            {timeframe === 'today' && 'Today'}
                            {timeframe === '7d' && 'Last 7 Days'}
                            {timeframe === '30d' && 'Last 30 Days'}
                        </h3>
                        <p className={`text-3xl font-bold mt-2 transition-colors ${isPending ? 'text-gray-400 animate-pulse' : 'text-gray-800 dark:text-gray-100'}`}>
                            {formatCurrency(periodStats?.revenueCents || 0, periodStats?.currency)}
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">from {periodStats?.giftCount || 0} gifts</p>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Gift History</h2>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">From</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th></tr></thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {history.length > 0 ? (
                                    history.map((p) => (<tr key={p.id}><td className="px-6 py-4 text-sm">{formatDate(p.createdAt)}</td><td className="px-6 py-4 font-medium">{p.payerName || 'Anonymous'}</td><td className="px-6 py-4 text-right font-semibold text-green-600 dark:text-green-400">{formatCurrency(p.netAmountToRecipient, p.currency)}</td></tr>))
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