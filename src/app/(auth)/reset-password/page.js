// frontend/src/app/auth/reset-password/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let recoverySessionEstablished = false;

    // Set up the listener for the PASSWORD_RECOVERY event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        console.log("Password recovery session established.");
        setIsValidSession(true);
        recoverySessionEstablished = true;
      }
    });

    // After a short delay, check if the recovery event was fired.
    // If not, it's highly likely the link is invalid or expired.
    const verificationTimer = setTimeout(() => {
      if (!recoverySessionEstablished) {
        setError("Invalid or expired password reset link. Please request a new one.");
        setIsValidSession(false);
      }
    }, 1000); // A 1-second delay provides a good balance.

    // Cleanup function to unsubscribe and clear the timer when the component unmounts.
    return () => {
      subscription.unsubscribe();
      clearTimeout(verificationTimer);
    };
  }, []); // The empty dependency array ensures this runs only once.

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsPending(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }
      
      setSuccess("Your password has been reset successfully! You can now log in.");
      // Optional: Redirect to login after a delay
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err) {
      console.error("Error updating password:", err);
      setError(err.message || "Failed to update password.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-100 dark:bg-gray-900">
      <div className="p-8 bg-white dark:bg-gray-800 shadow-xl rounded-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">Reset Your Password</h1>
        
        {error && <p className="text-red-500 mb-4 p-3 bg-red-100 rounded text-sm">{error}</p>}
        {success && <p className="text-green-600 mb-4 p-3 bg-green-100 rounded text-sm">{success}</p>}
        
        {isValidSession && !success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
              <input 
                type="password" 
                name="newPassword" 
                id="newPassword" 
                required 
                minLength="6" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-black dark:text-white bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
              <input 
                type="password" 
                name="confirmPassword" 
                id="confirmPassword" 
                required 
                minLength="6" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-black dark:text-white bg-white dark:bg-gray-700"
              />
            </div>
            <button 
              type="submit" 
              disabled={isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
            >
              {isPending ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {!isValidSession && !error && (
            <p className="text-center text-gray-500">Verifying reset link...</p>
        )}
        
        {(success || (!isValidSession && error)) && (
            <div className="mt-6 text-center">
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                    Back to Login
                </Link>
            </div>
        )}
      </div>
    </div>
  );
}