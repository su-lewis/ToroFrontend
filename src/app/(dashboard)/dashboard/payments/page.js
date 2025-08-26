// File: frontend/src/app/(dashboard)/dashboard/payments/page.js (Final Version with Both Toggles)

'use client';

import { useState, useEffect, useTransition } from 'react';
import {
    getPaymentStats,
    getPaymentHistory,
    createStripeDashboardLink,
    triggerInstantPayout,
    getUserSettings,
    getStripeBalance,
    setInstantPayoutMode,
    updateUserPayoutsInUsd
} from '@/app/actions';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { Switch } from '@headlessui/react';

const formatCurrency = (cents, currency = 'USD') => {
    const displayCurrency = currency ? currency.toUpperCase() : 'USD';
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: displayCurrency
        }).format(cents / 100);
    } catch (error) {
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
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isStatsLoading, setIsStatsLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [timeframe, setTimeframe] = useState('30d');
    const [_, startTransition] = useTransition();

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoadingInitial(true);
            setError(null);
            try {
                const userResult = await getUserSettings();
                if (!userResult.success) throw new Error(userResult.message);
                const currentUser = userResult.data;
                setUser(currentUser);
                const userCurrency = currentUser.payoutsInUsd ? 'usd' : (currentUser.stripeDefaultCurrency || 'usd');
                const [statsResult, historyResult, balanceResult] = await Promise.all([
                    getPaymentStats(timeframe, userCurrency),
                    getPaymentHistory(),
                    getStripeBalance()
                ]);
                if (statsResult.success) setStats(statsResult.data);
                if (historyResult.success) setHistory(historyResult.data);
                if (balanceResult.success) setBalance(balanceResult.data);
            } catch (err) {
                setError(err.message || 'Failed to load initial payment data.');
            } finally {
                setIsLoadingInitial(false);
            }
        };
        loadInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleTimeframeChange = (newTimeframe) => {
        setTimeframe(newTimeframe);
        setIsStatsLoading(true);
        setError(null);
        startTransition(async () => {
            const userCurrency = user.payoutsInUsd ? 'usd' : (user.stripeDefaultCurrency || 'usd');
            const result = await getPaymentStats(newTimeframe, userCurrency);
            if (result.success) setStats(result.data);
            else setError(result.message);
            setIsStatsLoading(false);
        });
    };

    const handleAction = async (actionFn, ...args) => {
        setIsActionLoading(true);
        setError(null); setSuccess(null);
        await startTransition(async () => {
            const result = await actionFn(...args);
            if (result.success) {
                if (result.url) window.open(result.url, '_blank', 'noopener,noreferrer');
                if (result.message) setSuccess(result.message);
                if (actionFn === triggerInstantPayout) {
                    const balanceResult = await getStripeBalance();
                    if (balanceResult.success) setBalance(balanceResult.data);
                }
                if (actionFn === setInstantPayoutMode || actionFn === updateUserPayoutsInUsd) {
                    const userResult = await getUserSettings();
                    if (userResult.success) setUser(userResult.data);
                }
            } else { setError(result.message || 'An unknown error occurred.'); }
            setIsActionLoading(false);
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
                <button
                    onClick={() => handleAction(createStripeDashboardLink)}
                    disabled={isActionLoading}
                    className="w-full md:w-auto inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md text-sm disabled:opacity-70"
                >
                    {isActionLoading ? 'Please wait...' : 'Manage on Stripe'}
                    <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4" />
                </button>
            </div>

            <div>
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Payouts & Balance</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Available for Payout</h3>
                        <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-2">{availableBalance ? formatCurrency(availableBalance.amount, availableBalance.currency) : '$0.00'}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Your current Stripe balance.</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Request Manual Payout</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-4">Instantly pay out your available balance now.</p>
                        <button onClick={() => handleAction(triggerInstantPayout)} disabled={isActionLoading || !availableBalance || availableBalance.amount <= 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
                            {isActionLoading ? 'Processing...' : 'Payout Now'}
                        </button>
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
                                    disabled={isStatsLoading}
                                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${timeframe === periodValue
                                            ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'
                                        }`}
                                >
                                    {isStatsLoading && timeframe === periodValue ? '...' : periodLabel}
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
                        <p className={`text-3xl font-bold mt-2 transition-colors ${isStatsLoading ? 'text-gray-400 animate-pulse' : 'text-gray-800 dark:text-gray-100'}`}>
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