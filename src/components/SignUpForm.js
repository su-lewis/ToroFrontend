// frontend/src/components/SignUpForm.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient'; // Use the shared client
import Link from 'next/link';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage('');

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/dashboard/profile`,
      },
    });

    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
    } else if (data.session) {
      setMessage('Sign up successful! Redirecting to setup your profile...');
      router.push('/dashboard/profile');
      router.refresh();
    } else if (data.user) {
      setMessage('Sign up successful! Please check your email inbox to confirm your account.');
    } else {
      setError('An unexpected error occurred during sign up.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-100 dark:bg-gray-900">
      <div className="p-8 bg-white dark:bg-gray-800 shadow-xl rounded-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">Create Your TributeToro Account</h1>
        
        {/* --- THIS IS LIKELY WHERE THE ERROR WAS --- */}
        {/* Corrected className with proper syntax for opacity */}
        {error && <p className="text-red-500 dark:text-red-400 mb-4 p-3 bg-red-100 dark:bg-red-900/[.30] rounded text-sm">{error}</p>}
        {message && <p className="text-green-600 dark:text-green-400 mb-4 p-3 bg-green-100 dark:bg-green-900/[.30] rounded text-sm">{message}</p>}
        {/* --- END OF FIX AREA --- */}

        <form onSubmit={handleSignUp} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
            <input
              id="email"
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
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
              className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black dark:text-white bg-white dark:bg-gray-700"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}