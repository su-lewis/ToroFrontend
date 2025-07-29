// frontend/src/components/LoginForm.js
'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { sendPasswordReset } from '@/app/actions'; // Import the new action

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // For reset message
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLogin = async (e) => { /* ... same as before ... */ };
  
  const handlePasswordReset = async () => {
    if (!email) {
        setError("Please enter your email address to reset your password.");
        return;
    }
    setError(null); setSuccess(null);
    const formData = new FormData();
    formData.append('email', email);

    startTransition(async () => {
        const result = await sendPasswordReset(formData);
        if (result.success) setSuccess(result.message);
        else setError(result.message);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-100 dark:bg-gray-900">
      <div className="p-8 bg-white dark:bg-gray-800 shadow-xl rounded-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Log In</h1>
        {error && <p className="text-red-500 mb-4 p-3 bg-red-100 rounded text-sm">{error}</p>}
        {success && <p className="text-green-600 mb-4 p-3 bg-green-100 rounded text-sm">{success}</p>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="..."/>
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="..."/>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm">
                <button type="button" onClick={handlePasswordReset} disabled={isPending} className="font-medium text-blue-600 hover:text-blue-500">
                    Forgot your password?
                </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full ...">
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>
        <p className="mt-8 text-center text-sm">
          Don't have an account? <Link href="/signup" className="font-medium text-blue-600">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}