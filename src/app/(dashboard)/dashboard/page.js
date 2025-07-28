// frontend/src/app/(dashboard)/dashboard/page.js
import Link from 'next/link';
import { fetchProtectedDataFromServer } from '@/lib/server-api';
import { 
  UserCircleIcon, 
  LinkIcon as LinkIconOutline, 
  Cog6ToothIcon, 
  ChartBarIcon,
} from '@heroicons/react/24/outline';

async function getAppUserProfileDataForOverview() {
  try {
    const profileData = await fetchProtectedDataFromServer('/users/me');
    return { userProfile: profileData, error: null };
  } catch (error) {
    return { userProfile: null, error };
  }
}

export default async function DashboardOverviewPage() {
  const { userProfile, error } = await getAppUserProfileDataForOverview();

  // Determine if Stripe is set up
  const isStripeOnboarded = userProfile?.stripeOnboardingComplete === true;
  const paymentsLinkUrl = isStripeOnboarded ? '/dashboard/payments' : '/connect-stripe';

  if (error && error.status !== 404 && error.status !== 401) { 
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Dashboard</h1>
        <p className="text-gray-700 mb-4">
          Details: {error.bodyText || error.message || "Please try again later."}
        </p>
      </div>
    );
  }
  
  const greetingName = userProfile?.displayName || userProfile?.username || 'User';
  const isProfileIncomplete = !userProfile || error?.status === 404 || (userProfile && !userProfile.username);

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
      <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gray-800">Welcome, {greetingName}!</h1>
      <p className="text-md md:text-lg text-gray-600 mb-10">Manage your public presence and payment settings.</p>
      
      {isProfileIncomplete && (
        <div className="p-4 md:p-5 mb-8 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 rounded-md shadow">
          <h2 className="font-bold text-lg mb-2">Complete Your Profile</h2>
          <p className="mb-3 text-sm md:text-base">
            Set up your username and other details to activate your public page and features.
          </p>
          <Link href="/dashboard/profile" className="inline-block bg-yellow-400 hover:bg-yellow-500 text-yellow-800 font-semibold py-2 px-4 rounded-md transition-colors text-sm">
            Go to Profile Setup
          </Link>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="group p-6 bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <UserCircleIcon className="h-10 w-10 text-blue-500 mb-3" />
          <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-700 group-hover:text-blue-600">Your Public Page</h2>
          {userProfile?.username ? (
            <>
              <p className="text-gray-600 mb-3 text-sm md:text-base">View and share your page.</p>
              <Link href={`/${userProfile.username}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-5 rounded-lg text-sm">
                View Page (/{userProfile.username})
              </Link>
            </>
          ) : (<p className="text-gray-500 text-sm md:text-base">Set username in profile to activate.</p>)}
        </div>

        <div className="group p-6 bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <LinkIconOutline className="h-10 w-10 text-green-500 mb-3" />
          <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-700 group-hover:text-green-600">Manage Links</h2>
          <p className="text-gray-600 mb-3 text-sm md:text-base">Add or edit your links.</p>
          <Link href="/dashboard/links" className="inline-block bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 px-5 rounded-lg text-sm">Go to Links</Link>
        </div>

        <div className="group p-6 bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <Cog6ToothIcon className="h-10 w-10 text-indigo-500 mb-3" />
          <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-700 group-hover:text-indigo-600">Edit Profile</h2>
          <p className="text-gray-600 mb-3 text-sm md:text-base">Update your profile details.</p>
          <Link href="/dashboard/profile" className="inline-block bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2.5 px-5 rounded-lg text-sm">Go to Profile</Link>
        </div>
        
        <div className="group p-6 bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <ChartBarIcon className="h-10 w-10 text-purple-500 mb-3" />
          <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-700 group-hover:text-purple-600">
            Payments
          </h2>
          {isStripeOnboarded ? (
            <>
              <p className="text-gray-600 mb-3 text-sm md:text-base">
                View your gift history and revenue stats.
              </p>
              <Link href={paymentsLinkUrl} className="inline-block bg-purple-500 hover:bg-purple-600 text-white font-medium py-2.5 px-5 rounded-lg text-sm">
                View Analytics
              </Link>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-3 text-sm md:text-base">
                Connect your Stripe account to receive payments.
              </p>
              <Link href={paymentsLinkUrl} className="inline-block bg-purple-500 hover:bg-purple-600 text-white font-medium py-2.5 px-5 rounded-lg text-sm">
                Go to Setup
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}