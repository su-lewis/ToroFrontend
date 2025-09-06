'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUserSettings } from '@/app/actions';
import { 
    UserCircleIcon, 
    LinkIcon as LinkIconOutline, 
    Cog6ToothIcon, 
    ChartBarIcon, 
    ShareIcon, 
    CheckIcon 
} from '@heroicons/react/24/outline';

export default function DashboardOverviewPage() {
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function getAppUserProfileDataForOverview() {
      // Use the server action to fetch data on the client
      const result = await getUserSettings();
      
      if (result.success) {
        setUserProfile(result.data);
      } else {
        // Handle cases where the profile might not be found (404) vs. a real server error
        if (result.status !== 404 && result.status !== 401) {
          setError(result.message || "Error loading dashboard data.");
        }
      }
      setIsLoading(false);
    }
    getAppUserProfileDataForOverview();
  }, []);

  const handleCopyLink = () => {
    if (!userProfile?.username) return;
    // Construct the full URL using the browser's window object
    const url = `${window.location.origin}/${userProfile.username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    // Reset the "Copied" state after 2 seconds for better user feedback
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return <div className="text-center p-10 text-gray-500 dark:text-gray-400">Loading dashboard...</div>;
  }

  if (error) { 
    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error Loading Dashboard</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-4">Details: {error}</p>
      </div>
    );
  }

  const isStripeOnboarded = userProfile?.stripeOnboardingComplete === true;
  const paymentsLinkUrl = isStripeOnboarded ? '/dashboard/payments' : '/connect-stripe';
  const greetingName = userProfile?.displayName || userProfile?.username || 'User';
  const isProfileIncomplete = !userProfile || (userProfile && !userProfile.username);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg">
      <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gray-800 dark:text-gray-100">Welcome, {greetingName}!</h1>
      <p className="text-md md:text-lg text-gray-600 dark:text-gray-400 mb-10">Manage your public presence and payment settings.</p>
      
      {isProfileIncomplete && (
        <div className="p-4 md:p-5 mb-8 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-300 rounded-md shadow">
          <h2 className="font-bold text-lg mb-2">Complete Your Profile</h2>
          <p className="mb-3 text-sm md:text-base">Set up your username and other details to activate your public page and features.</p>
          <Link href="/dashboard/profile" className="inline-block bg-yellow-400 hover:bg-yellow-500 text-yellow-800 font-semibold py-2 px-4 rounded-md transition-colors text-sm">Go to Profile Setup</Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="group p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <UserCircleIcon className="h-10 w-10 text-blue-500 dark:text-blue-400 mb-3" />
          <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">Your Public Page</h2>
          {userProfile?.username ? (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm md:text-base">View and share your page.</p>
              <div className="flex items-center space-x-2">
                <Link href={`/${userProfile.username}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-5 rounded-lg text-sm">View Page</Link>
                <button 
                  onClick={handleCopyLink} 
                  className="p-2.5 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  aria-label="Copy profile link"
                >
                  {copied ? <CheckIcon className="h-5 w-5 text-green-500" /> : <ShareIcon className="h-5 w-5 text-gray-700 dark:text-gray-200" />}
                </button>
              </div>
            </>
          ) : (<p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">Set username in profile to activate.</p>)}
        </div>
        <div className="group p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <LinkIconOutline className="h-10 w-10 text-green-500 dark:text-green-400 mb-3" />
          <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-700 dark:text-gray-200 group-hover:text-green-600 dark:group-hover:text-green-400">Manage Links</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm md:text-base">Add or edit your links.</p>
          <Link href="/dashboard/links" className="inline-block bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 px-5 rounded-lg text-sm">Go to Links</Link>
        </div>
        <div className="group p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <Cog6ToothIcon className="h-10 w-10 text-indigo-500 dark:text-indigo-400 mb-3" />
          <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-700 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Edit Profile</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm md:text-base">Update your profile details.</p>
          <Link href="/dashboard/profile" className="inline-block bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2.5 px-5 rounded-lg text-sm">Go to Profile</Link>
        </div>
        <div className="group p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <ChartBarIcon className="h-10 w-10 text-purple-500 dark:text-purple-400 mb-3" />
          <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-700 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">Payments</h2>
          {isStripeOnboarded ? (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm md:text-base">View your gift history and stats.</p>
              <Link href={paymentsLinkUrl} className="inline-block bg-purple-500 hover:bg-purple-600 text-white font-medium py-2.5 px-5 rounded-lg text-sm">View Analytics</Link>
            </>
          ) : (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm md:text-base">Connect your Stripe account.</p>
              <Link href={paymentsLinkUrl} className="inline-block bg-purple-500 hover:bg-purple-600 text-white font-medium py-2.5 px-5 rounded-lg text-sm">Go to Setup</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}