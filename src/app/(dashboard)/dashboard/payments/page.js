'use client';

import { useState, useEffect, useTransition } from 'react';
import { 
    getPaymentStats, 
    getUnifiedHistory,
    createStripeDashboardLink,
    triggerInstantPayout,
    getUserSettings,
    getStripeBalance,
    setInstantPayoutMode,
    updateUserPayoutsInUsd
} from '@/app/actions';
import { 
    ArrowTopRightOnSquareIcon,
    ArrowDownCircleIcon,
    ArrowUpCircleIcon,
    ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { Switch } from '@headlessui/react';

const formatCurrency = (cents, currency = 'USD') => {
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
    } catch (error) {
        return `$${(cents / 100).toFixed(2)}`;
    }
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
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
                    getUnifiedHistory(),
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

    const getTransactionRowDetails = (item) => {
        if (item.type === 'PAYMENT') {
            switch(item.status) {
                case 'SUCCEEDED': return { icon: ArrowDownCircleIcon, color: 'text-green-500', amountPrefix: '+', title: 'Gift Received' };
                case 'REFUNDED': return { icon: ExclamationCircleIcon, color: 'text-yellow-500', amountPrefix: '-', title: 'Payment Refunded' };
                case 'DISPUTED': return { icon: ExclamationCircleIcon, color: 'text-red-500', amountPrefix: '', title: 'Payment Disputed' };
            }
        }
        if (item.type === 'PAYOUT') {
            switch(item.status) {
                case 'PAID': return { icon: ArrowUpCircleIcon, color: 'text-blue-500', amountPrefix: '-', title: 'Payout Sent' };
                case 'FAILED': return { icon: ExclamationCircleIcon, color: 'text-red-500', amountPrefix: '', title: 'Payout Failed' };
            }
        }
        return { icon: ExclamationCircleIcon, color: 'text-gray-500', amountPrefix: '', title: 'Transaction' };
    };

    const availableBalance = balance?.available?.[0];
    const pendingBalance = balance?.pending?.[0];
    const periodStats = stats?.period;
    const isUsdNative = user?.stripeDefaultCurrency === 'usd';

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
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Use USD for Payments</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {isUsdNative || user?.payoutsInUsd ? 'Mode: USD' : 'Mode: Native Currency'}
                                </p>
                            </div>
                            <Switch
                                checked={isUsdNative || (user?.payoutsInUsd ?? true)}
                                onChange={(enabled) => handleAction(updateUserPayoutsInUsd, enabled)}
                                disabled={isActionLoading || isUsdNative}
                                className={`${isUsdNative || user?.payoutsInUsd ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-70 disabled:cursor-not-allowed`}
                            >
                                <span className={`${isUsdNative || user?.payoutsInUsd ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                            </Switch>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            {isUsdNative ? (
                                <p className="text-xs text-gray-500 dark:text-gray-400">Your payout currency is USD, so payments will always be processed in USD. This setting is locked.</p>
                            ) : user?.payoutsInUsd ? (
                                <p className="text-xs text-gray-500 dark:text-gray-400">When enabled, donors will pay in US Dollars ($). Recommended for a global audience.</p>
                            ) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400">When disabled, donors will pay in your native currency ({user?.stripeDefaultCurrency?.toUpperCase() || 'Not Set'}).</p>
                            )}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Turn on Stripe Instant Payouts?</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user?.autoInstantPayoutsEnabled ? 'Instant Payouts are ON' : 'Instant Payouts are OFF'}</p>
                            </div>
                            <Switch 
                                checked={user?.autoInstantPayoutsEnabled || false} 
                                onChange={(enabled) => handleAction(setInstantPayoutMode, enabled)} 
                                disabled={isActionLoading} 
                                className={`${user?.autoInstantPayoutsEnabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50`}
                            >
                                <span className={`${user?.autoInstantPayoutsEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                            </Switch>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                             {user?.autoInstantPayoutsEnabled ? (
                                <p className="text-xs text-gray-500 dark:text-gray-400">When ON, your available balance will be paid out to your bank automatically and instantly (~30 min). This service has a 1% fee charged by Stripe.</p>
                             ) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400">When OFF, automatic payouts are disabled. To receive your funds, you must use the "Payout Now" button for a standard payout.</p>
                             )}
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Payouts & Balance</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Available for Payout</h3>
                            <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-2">
                                {availableBalance ? formatCurrency(availableBalance.amount, availableBalance.currency) : formatCurrency(0, user?.stripeDefaultCurrency || 'usd')}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Funds that have cleared and can be paid out.</p>
                        </div>
                        <div>
                            <button 
                                onClick={() => handleAction(triggerInstantPayout)} 
                                disabled={isActionLoading || !availableBalance || availableBalance.amount <= 0} 
                                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isActionLoading ? 'Processing...' : 'Payout Now (Standard)'}
                            </button>
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">Free, arrives in 2-5 business days.</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Pending Balance</h3>
                        <p className="text-4xl font-bold text-gray-500 dark:text-gray-400 mt-2">
                            {pendingBalance ? formatCurrency(pendingBalance.amount, pendingBalance.currency) : formatCurrency(0, user?.stripeDefaultCurrency || 'usd')}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Funds from recent gifts that are currently clearing.</p>
                        <div className="mt-4 w-full bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-center text-xs font-medium py-2 px-4 rounded-md">
                            Typically available in 2-7 days.
                        </div>
                    </div>
                </div>
            </div>
            
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Statistics</h2>
                    <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                        {['today', '7d', '30d'].map((p) => (
                            <button
                                key={p}
                                onClick={() => handleTimeframeChange(p)}
                                disabled={isStatsLoading}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${timeframe === p ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'}`}
                            >{isStatsLoading && timeframe === p ? '...' : p.charAt(0).toUpperCase() + p.slice(1)}</button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">All-Time Revenue</h3>
                        <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">{formatCurrency(stats?.allTime?.revenueCents || 0, stats?.allTime?.currency)}</p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">from {stats?.allTime?.giftCount || 0} gifts</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{stats?.period.timeframe === 'today' ? 'Today' : `Last ${stats?.period.timeframe}`}</h3>
                        <p className={`text-3xl font-bold mt-2 transition-colors ${isStatsLoading ? 'text-gray-400 animate-pulse' : 'text-gray-800 dark:text-gray-100'}`}>{formatCurrency(stats?.period?.revenueCents || 0, stats?.period?.currency)}</p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">from {stats?.period?.giftCount || 0} gifts</p>
                    </div>
                </div>
            </div>
            
            <div>
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Transaction History</h2>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {history.length > 0 ? (
                            history.map((item) => {
                                const { icon: Icon, color, amountPrefix, title } = getTransactionRowDetails(item);
                                return (
                                    <div key={item.id} className="p-4 flex items-center justify-between space-x-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <div className="flex items-center space-x-4 min-w-0">
                                            <Icon className={`h-8 w-8 flex-shrink-0 ${color}`} />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{title}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.description} &middot; {formatDate(item.date)}</p>
                                            </div>
                                        </div>
                                        <p className={`text-lg font-semibold whitespace-nowrap ${color}`}>
                                            {amountPrefix}{formatCurrency(item.amount, item.currency)}
                                        </p>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">No transactions to display yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}