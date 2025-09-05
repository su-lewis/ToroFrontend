'use client';

import { useState } from 'react';
import Link from 'next/link';
import { handleLogout } from '@/app/actions';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { 
    ChartBarIcon, 
    LinkIcon as LinkIconOutline, 
    Cog6ToothIcon, 
    ArrowRightOnRectangleIcon, 
    UserCircleIcon,
    KeyIcon,
    Bars3Icon,
    XMarkIcon
} from '@heroicons/react/24/outline';

export default function DashboardSidebar({ userProfile, session }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isStripeOnboarded = userProfile?.stripeOnboardingComplete === true;
  const paymentsLinkUrl = isStripeOnboarded ? '/dashboard/payments' : '/connect-stripe';

  return (
    // --- FIX 1: The main <aside> container ---
    // On mobile, this is just a block element whose height is determined by its content.
    // On desktop (md:), it becomes a flex container, filling the screen's height.
    <aside className="w-full md:w-64 bg-white dark:bg-gray-800 shadow-lg p-4 md:flex md:flex-col md:min-h-screen">
      
      {/* The header is always visible */}
      <div className="flex justify-between items-center">
        <Link href="/dashboard" className="text-2xl font-bold text-blue-600 dark:text-blue-400 p-2 hover:text-blue-700 dark:hover:text-blue-300">
          TributeToro
        </Link>
        <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="p-2 rounded-md md:hidden" // Only show on mobile
                aria-label="Toggle menu"
            >
                {isMenuOpen ? (
                    <XMarkIcon className="h-6 w-6 text-gray-800 dark:text-gray-200" />
                ) : (
                    <Bars3Icon className="h-6 w-6 text-gray-800 dark:text-gray-200" />
                )}
            </button>
        </div>
      </div>

      {/* --- FIX 2: The collapsible content wrapper --- */}
      {/* This is the key change. */}
      <div className={`
          flex-col justify-between flex-grow
          ${isMenuOpen ? 'flex' : 'hidden'}  /* On mobile: display: flex IF open, otherwise display: none */
          md:flex                          /* On desktop: ALWAYS display: flex, overriding the 'hidden' state */
        `}>
        <nav className="space-y-1 mt-4"> {/* Added mt-4 here for spacing */}
          <Link href="/dashboard" className="group flex items-center space-x-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md">
            <UserCircleIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" /> 
            <span className="font-medium">Overview</span>
          </Link>
          <Link href="/dashboard/profile" className="group flex items-center space-x-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md">
            <Cog6ToothIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" /> 
            <span className="font-medium">Profile Settings</span>
          </Link>
          <Link href="/dashboard/links" className="group flex items-center space-x-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md">
            <LinkIconOutline className="h-5 w-5 text-gray-500 dark:text-gray-400" /> 
            <span className="font-medium">Manage Links</span>
          </Link>
          <Link href={paymentsLinkUrl} className="group flex items-center space-x-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md">
            <ChartBarIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <span className="font-medium">Payments</span>
          </Link>
          <Link href="/dashboard/account-settings" className="group flex items-center space-x-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md">
            <KeyIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" /> 
            <span className="font-medium">Account Security</span>
          </Link>
        </nav>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"> {/* Added mt-4 */}
          <form action={handleLogout}>
            <button type="submit" className="group flex items-center space-x-3 w-full px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md">
              <ArrowRightOnRectangleIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" /> 
              <span className="font-medium">Log Out</span>
            </button>
          </form>
          {session?.user?.email && ( <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 p-2 text-center break-all">{session.user.email}</p> )}
        </div>
      </div>
    </aside>
  );
}