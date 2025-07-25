// frontend/src/app/(dashboard)/dashboard/payments/page.js
'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { ArrowTopRightOnSquareIcon, BanknotesIcon, GiftIcon } from '@heroicons/react/24/outline';

// Helper to format cents into a currency string
const formatCurrency = (cents, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(cents / 100);
};

// Helper to format date
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

export default function PaymentsPage() {
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [stripeLinkLoading, setStripeLinkLoading] = useState(false);
    const [stripeLinkError, setStripeLinkError] = useState(null);
    
    useEffect(() => {
        const fetchPaymentData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch stats and history in parallel
                const [statsResponse, historyResponse] = await Promise.all([
                    apiClient.get('/payments/stats'),
                    apiClient.get('/payments/history')
                ]);
                setStats(statsResponse.data);
                setHistory(historyResponse.data);
            } catch (err) {
                console.error("Error fetching payment data:", err);
                setError(err.response?.data?.message || "Failed to load payment data.");
            } finally {
                setLoading(false);
            }
        };
        fetchPaymentData();
    }, []);

    const handleViewStripeDashboard = async () => {
        setStripeLinkLoading(true);
        setStripeLinkError(null);
        try {
            const response = await apiClient.post('/stripe/create-express-dashboard-link');
            if (response.data.url) {
                window.open(response.data.url, '_blank'); // Open in new tab
            } else {
                throw new Error('Failed to get Stripe dashboard URL.');
            }
        } catch (err) {
            setStripeLinkError(err.response?.data?.message || 'Could not open Stripe dashboard.');
        } finally {
            setStripeLinkLoading(false);
        }
    };

    if (loading) return <div className="text-center p-10">Loading payment analytics...</div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Payments</h1>
                    <p className="text-gray-500 mt-1">View your revenue and gift history.</p>
                </div>
                <button
                    onClick={handleViewStripeDashboard}
                    disabled={stripeLinkLoading}
                    className="mt-4 md:mt-0 inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md text-sm disabled:opacity-70"
                >
                    {stripeLinkLoading ? 'Loading...' : 'View Payouts on Stripe'}
                    <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4"/>
                </button>
            </div>
            {stripeLinkError && <p className="text-red-500 text-sm">{stripeLinkError}</p>}
            
            {/* Stats Section */}
            <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Statistics</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                        <h3 className="text-gray-500 text-sm font-medium">All-Time Revenue</h3>
                        <p className="text-3xl font-bold text-gray-800 mt-2">
                            {formatCurrency(stats.allTime.revenueCents)}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">from {stats.allTime.giftCount} gifts</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                        <h3 className="text-gray-500 text-sm font-medium">Last 30 Days</h3>
                        <p className="text-3xl font-bold text-gray-800 mt-2">
                            {formatCurrency(stats.last30Days.revenueCents)}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">from {stats.last30Days.giftCount} gifts</p>
                    </div>
                </div>
            </div>

            {/* History Section */}
            <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Gift History</h2>
                <div className="bg-white rounded-xl shadow-md border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Received</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {history.length > 0 ? (
                                    history.map((payment) => (
                                        <tr key={payment.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(payment.createdAt)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.payerName || 'Anonymous'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                                                {formatCurrency(payment.netAmountToRecipient, payment.currency)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-10 text-center text-gray-500">You haven't received any gifts yet.</td>
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