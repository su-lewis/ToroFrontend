// frontend/src/app/(dashboard)/dashboard/account-settings/page.js
'use client';

import { useState, useTransition, useRef } from 'react'; // Added useRef
import { updateUserEmail, updateUserPassword } from '@/app/actions';

// --- Change Email Form Component ---
function ChangeEmailForm() {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isPending, startTransition] = useTransition();
    const formRef = useRef(null); // To clear the form on success

    const handleSubmit = async (formData) => {
        setError(''); setSuccess('');
        const newEmail = formData.get('newEmail');
        const confirmNewEmail = formData.get('confirmNewEmail');
        if (newEmail !== confirmNewEmail) {
            setError("New email addresses do not match.");
            return;
        }

        startTransition(async () => {
            const result = await updateUserEmail(formData);
            if (result.success) {
                setSuccess(result.message);
                formRef.current?.reset();
            } else {
                setError(result.message);
            }
        });
    };
    
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Change Email Address</h2>
            {error && <p className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm">{error}</p>}
            {success && <p className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-sm">{success}</p>}
            <form ref={formRef} action={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="currentPasswordEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                    {/* --- FIX: Added dark mode classes --- */}
                    <input type="password" name="currentPassword" id="currentPasswordEmail" required 
                           className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-black dark:text-white bg-white dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                    <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Email</label>
                    {/* --- FIX: Added dark mode classes --- */}
                    <input type="email" name="newEmail" id="newEmail" required 
                           className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-black dark:text-white bg-white dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                    <label htmlFor="confirmNewEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Email</label>
                    <input type="email" name="confirmNewEmail" id="confirmNewEmail" required 
                           className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-black dark:text-white bg-white dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50">
                    {isPending ? 'Updating...' : 'Update Email'}
                </button>
            </form>
        </div>
    );
}

// --- Change Password Form Component ---
function ChangePasswordForm() {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isPending, startTransition] = useTransition();
    const formRef = useRef(null); // To clear the form on success

    const handleSubmit = async (formData) => {
        setError(''); setSuccess('');
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');
        if (newPassword !== confirmPassword) { setError("New passwords do not match."); return; }
        if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }

        startTransition(async () => {
            const result = await updateUserPassword(formData);
            if (result.success) {
                setSuccess(result.message);
                formRef.current?.reset();
            } else {
                setError(result.message);
            }
        });
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Change Password</h2>
            {error && <p className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm">{error}</p>}
            {success && <p className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-sm">{success}</p>}
            <form ref={formRef} action={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                    {/* --- FIX: Added dark mode classes --- */}
                    <input type="password" name="currentPassword" id="currentPassword" required 
                           className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-black dark:text-white bg-white dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                    {/* --- FIX: Added dark mode classes --- */}
                    <input type="password" name="newPassword" id="newPassword" required minLength="6" 
                           className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-black dark:text-white bg-white dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                    {/* --- FIX: Added dark mode classes --- */}
                    <input type="password" name="confirmPassword" id="confirmPassword" required minLength="6" 
                           className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-black dark:text-white bg-white dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50">
                    {isPending ? 'Updating...' : 'Update Password'}
                </button>
            </form>
        </div>
    );
}

// --- Main Page Component ---
export default function AccountSettingsPage() {
    return (
        <div className="space-y-10 max-w-2xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Account Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your login details.</p>
            </div>
            
            <ChangeEmailForm />
            <ChangePasswordForm />
        </div>
    );
}