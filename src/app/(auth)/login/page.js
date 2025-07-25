// frontend/src/app/(auth)/login/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    // This is crucial to prevent the form from doing a full page reload
    e.preventDefault(); 
    
    console.log("Login form submitted. handleLogin called."); // 1. Check if the function is even starting

    setLoading(true);
    setError(null);
    
    try {
      console.log(`Attempting Supabase login with email: ${email}`); // 2. Check the data being sent

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Supabase signInWithPassword response:", { data, signInError }); // 3. See what Supabase returns

      if (signInError) {
        // If Supabase returns an error (e.g., "Invalid login credentials"), throw it
        throw signInError;
      }

      if (data.session) {
        console.log("Supabase login successful, session received. Attempting redirect to /dashboard."); // 4. Confirm success
        // On successful login, the Supabase client library automatically sets the session cookie.
        // We need to refresh the page/route for Next.js Server Components (like our layout) to re-evaluate.
        router.push('/dashboard');
        router.refresh(); // This tells Next.js to fetch new data for the new route
      } else {
        // This case is unlikely if there's no error, but a good safeguard.
        throw new Error("Login was successful but no session data was received. Please try again.");
      }

    } catch (err) {
      console.error("Error during login process:", err.message); // 5. Log any caught errors
      setError(err.message || "An unknown error occurred.");
    } finally {
      // This block will run regardless of success or failure
      console.log("Login process finished. Setting loading to false."); // 6. Confirm the function completes
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-100">
      <div className="p-8 bg-white shadow-xl rounded-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Log In to TributeToro</h1>
        {error && <p className="text-red-500 mb-4 p-3 bg-red-100 rounded text-sm text-center">{error}</p>}
        
        {/* The onSubmit handler is attached to the <form> element */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-black"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-black"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}