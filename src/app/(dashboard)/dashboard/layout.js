// File: frontend/src/app/(dashboard)/dashboard/layout.js (Final Corrected Version)

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
    ChartBarIcon, 
    LinkIcon as LinkIconOutline, 
    Cog6ToothIcon, 
    ArrowRightOnRectangleIcon, 
    UserCircleIcon,
    CreditCardIcon, // For the "Setup Payments" link
    ExclamationTriangleIcon, // For the warning banner
    KeyIcon
} from '@heroicons/react/24/outline';
import { fetchProtectedDataFromServer } from '@/lib/server-api';
import { handleLogout } from '@/app/actions';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export default async function DashboardLayout({ children }) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { redirect('/login'); }
  
  let userProfile = null;
  try {
    userProfile = await fetchProtectedDataFromServer('/users/me');
  } catch (error) {
    if (error.status === 404) {
      // If profile is not found, force user to the creation page
      return redirect('/dashboard/profile');
    }
    console.error("DashboardLayout: Error fetching user profile:", error.message);
    // If there's another error, we can show a generic error state or redirect
    // For now, redirecting to login might be safest
    return redirect('/login?error=profile_fetch_failed');
  }
  
  if (!userProfile) {
    return redirect('/dashboard/profile');
  }

  const isStripeOnboardingComplete = userProfile.stripeOnboardingComplete;
  
  // Your existing navigation links, now in an array for easier management
  const navLinks = [
      { name: 'My Profile', href: '/dashboard/profile', icon: UserCircleIcon },
      { name: 'Manage Links', href: '/dashboard/links', icon: LinkIconOutline },
      { 
        name: isStripeOnboardingComplete ? 'Payments' : 'Setup Payments', 
        href: isStripeOnboardingComplete ? '/dashboard/payments' : '/dashboard/connect-stripe', 
        icon: isStripeOnboardingComplete ? ChartBarIcon : CreditCardIcon,
        needsSetup: !isStripeOnboardingComplete 
      },
      { name: 'Account Security', href: '/dashboard/account-settings', icon: KeyIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      
      {/* Sidebar: Fixed position, flex column */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col flex-shrink-0">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <Link href="/dashboard" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            TributeToro
          </Link>
          <ThemeSwitcher />
        </div>
        <nav className="flex-grow p-4 space-y-2">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href} className="group flex items-center space-x-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-white rounded-md transition-colors">
              <link.icon className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-white" />
              <span className="font-medium">{link.name}</span>
              {link.needsSetup && (
                <span className="ml-auto text-xs font-semibold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50 px-2 py-0.5 rounded-full">
                  Action
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
          <form action={handleLogout}>
            <button type="submit" className="group flex items-center space-x-3 w-full px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors">
              <ArrowRightOnRectangleIcon className="h-6 w-6 text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" /> 
              <span className="font-medium">Log Out</span>
            </button>
          </form>
           {session?.user?.email && ( <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 p-2 text-center break-all">{session.user.email}</p> )}
        </div>
      </aside>

      {/* --- THIS IS THE SCROLLING FIX --- */}
      {/* This new div wraps the main content and handles all scrolling */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <main className="flex-1 p-6 md:p-10">
          {/* Persistent Warning Banner */}
          {!isStripeOnboardingComplete && (
              <div className="mb-8 p-4 bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 rounded-lg flex items-center">
                  <ExclamationTriangleIcon className="h-6 w-6 mr-3 flex-shrink-0" />
                  <div>
                      <h3 className="font-bold">Complete Your Payment Setup</h3>
                      <p className="text-sm">You must connect Stripe to receive payments and access your analytics.</p>
                      <Link href="/dashboard/connect-stripe" className="mt-2 inline-block text-sm font-bold text-yellow-900 dark:text-yellow-200 underline hover:no-underline">
                          Continue Setup &rarr;
                      </Link>
                  </div>
              </div>
          )}
          {/* The page content (e.g., ProfileForm) is rendered here and can now scroll freely */}
          {children}
        </main>
      </div>
      
    </div>
  );
}