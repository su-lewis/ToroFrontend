// frontend/src/app/(dashboard)/dashboard/payments/page.js
'use client';

import { useState, useEffect, useTransition } from 'react';
import { getPaymentStats, getPaymentHistory, createStripeDashboardLink } from '@/app/actions';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const formatCurrency = (cents, currency = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
const formatDate = (dateString) => new Date(dateString).toLocaleString();

export default function PaymentsPage() {
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        startTransition(async () => {
            const [statsResult, historyResult] = await Promise.all([
                getPaymentStats(),
                getPaymentHistory()
            ]);
            if (statsResult.success) setStats(statsResult.data);
            else setError(statsResult.message || "Failed to load stats.");
            if (historyResult.success) setHistory(historyResult.data);
            else setError(prev => `${prev || ''} ${historyResult.message || "Failed to load history."}`);
        });
    }, []);

    const handleViewStripeDashboard = () => {
        startTransition(async () => {
            const result = await createStripeDashboardLink();
            if (result.success && result.url) {
                window.open(result.url, '_blank', 'noopener,noreferrer');
            } else {
                setError(result.message);
            }
        });
    };

    if (isPending && !stats) return <div className="text-center p-10">Loading payment analytics...</div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Payment Analytics</h1>
                    <p className="text-gray-500 mt-1">View your revenue and gift history.</p>
                </div>
                <button onClick={handleViewStripeDashboard} disabled={isPending} className="inline-flex items-center bg-indigo-600 text-white py-2 px-4 rounded-md text-sm disabled:opacity-70">
                    {isPending ? 'Loading...' : 'Manage on Stripe'}
                    <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4"/>
                </button>
            </div>
            
            <div>
                <h2 className="text-xl font-semibold mb-4">Statistics</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-gray-500 text-sm">All-Time Revenue</h3>
                        <p className="text-3xl font-bold mt-2">{formatCurrency(stats?.allTime?.revenueCents || 0)}</p>
                        <p className="text-gray-400 text-xs mt-1">from {stats?.allTime?.giftCount || 0} gifts</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-gray-500 text-sm">Last 30 Days</h3>
                        <p className="text-3xl font-bold mt-2">{formatCurrency(stats?.last30Days?.revenueCents || 0)}</p>
                        <p className="text-gray-400 text-xs mt-1">from {stats?.last30Days?.giftCount || 0} gifts</p>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Gift History</h2>
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium uppercase">Date</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">From</th><th className="px-6 py-3 text-right text-xs font-medium uppercase">Amount</th></tr></thead>
                        <tbody className="divide-y divide-gray-200">
                            {history.length > 0 ? (
                                history.map((p) => (<tr key={p.id}><td className="px-6 py-4 text-sm">{formatDate(p.createdAt)}</td><td className="px-6 py-4 font-medium">{p.payerName || 'Anonymous'}</td><td className="px-6 py-4 text-right font-semibold text-green-600">{formatCurrency(p.netAmountToRecipient, p.currency)}</td></tr>))
                            ) : (
                                <tr><td colSpan="3" className="px-6 py-10 text-center text-gray-500">No gifts yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}