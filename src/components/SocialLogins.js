// frontend/src/components/SocialLogins.js

'use client';

import { supabase } from '@/lib/supabaseClient';
import { FaGoogle } from 'react-icons/fa';

export default function SocialLogins() {

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // --- THIS IS THE FIX ---
        // This line explicitly tells Supabase where to send the user back to
        // within your Vercel application after they approve the Google login.
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
            Or continue with
          </span>
        </div>
      </div>
      
      <button
        onClick={handleGoogleLogin}
        className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <FaGoogle className="h-5 w-5 mr-2" />
        Continue with Google
      </button>
    </>
  );
}