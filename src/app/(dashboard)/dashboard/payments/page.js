// frontend/src/app/(dashboard)/dashboard/payments/page.js
'use client';

import { useState, useEffect, useTransition } from 'react';
// Import Server Actions from the central actions file
import { getPaymentStats, getPaymentHistory, createStripeDashboardLink } from '@/app/actions';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation'; // useRouter is not used here but good to keep if needed later

const formatCurrency = (cents, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
};
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function PaymentsPage() {
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);
    const [isPending, startTransition] = useTransition();
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);

    useEffect(() => {
        startTransition(async () => {
            setError(null);
            const [statsResult, historyResult] = await Promise.all([
                getPaymentStats(),
                getPaymentHistory()
            ]);

            if (statsResult.success) {
                setStats(statsResult.data);
            } else {
                setError(statsResult.message || "Failed to load payment stats.");
            }

            if (historyResult.success) {
                setHistory(historyResult.data);
            } else {
                setError(prev => `${prev || ''} ${historyResult.message || "Failed to load payment history."}`.trim());
            }
            setIsLoadingInitial(false);
        });
    }, []);

    const handleViewStripeDashboard = () => {
        startTransition(async () => {
            setError(null);
            const result = await createStripeDashboardLink();
            if (result.success && result.url) {
                window.open(result.url, '_blank', 'noopener,noreferrer');
            } else {
                setError(result.message || 'Could not open Stripe dashboard.');
            }
        });
    };

    if (isLoadingInitial) return <div className="text-center p-10 text-gray-500 dark:text-gray-400">Loading payment analytics...</div>;
    if (error) return <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">{error}</div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Payment Analytics</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">View your revenue and gift history from supporters.</p>
                </div>
                <button
                    onClick={handleViewStripeDashboard}
                    disabled={isPending}
                    className="w-full md:w-auto inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md text-sm disabled:opacity-70"
                >
                    {isPending ? 'Loading...' : 'Manage Payouts on Stripe'}
                    <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4"/>
                </button>
            </div>
            
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

            <div>
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Gift History</h2>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">From</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount Received</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {history.length > 0 ? (
                                    history.map((payment) => (
                                        <tr key={payment.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatDate(payment.createdAt)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">{payment.payerName || 'Anonymous'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600 dark:text-green-400">
                                                {formatCurrency(payment.netAmountToRecipient, payment.currency)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">You haven't received any gifts yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}