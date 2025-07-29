// frontend/src/components/LoginForm.js
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { sendPasswordReset } from '@/app/actions';
import Link from 'next/link';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // For password reset message
  const [loading, setLoading] = useState(false); // For email/password login
  const [isPending, startTransition] = useTransition(); // For password reset server action

  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault(); 
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      // On success, redirect to the dashboard. The layout will handle the rest.
      router.push('/dashboard');
      router.refresh(); // Important to re-fetch server components
    } catch (err) {
      setError(err.message || "Failed to log in. Please check your credentials.");
      setLoading(false);
    }
  };

  const handlePasswordReset = () => {
    if (!email) {
        setError("Please enter your email address above to reset your password.");
        return;
    }
    setError(null); setSuccess(null);
    const formData = new FormData();
    formData.append('email', email);

    startTransition(async () => {
        const result = await sendPasswordReset(formData);
        if (result.success) {
            setSuccess(result.message);
        } else {
            setError(result.message);
        }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-100 dark:bg-gray-900">
      <div className="p-8 bg-white dark:bg-gray-800 shadow-xl rounded-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">Log In to Your Account</h1>
        
        {error && <p className="text-red-500 dark:text-red-400 mb-4 p-3 bg-red-100 dark:bg-red-900/30 rounded text-sm text-center">{error}</p>}
        {success && <p className="text-green-600 dark:text-green-400 mb-4 p-3 bg-green-100 dark:bg-green-900/30 rounded text-sm text-center">{success}</p>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
            <input 
              id="email" 
              name="email"
              type="email" 
              placeholder="you@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black dark:text-white bg-white dark:bg-gray-700" 
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <input 
              id="password" 
              name="password"
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black dark:text-white bg-white dark:bg-gray-700" 
            />
          </div>
          
          <div className="flex items-center justify-end text-sm">
            <button 
              type="button" 
              onClick={handlePasswordReset} 
              disabled={isPending}
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
            >
              {isPending ? 'Sending...' : 'Forgot your password?'}
            </button>
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}