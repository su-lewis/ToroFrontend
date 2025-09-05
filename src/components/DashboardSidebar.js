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
    // The main <aside> is always present, but its contents will be controlled.
    // It is a flex container with a direction of column.
    <aside className="w-full md:w-64 bg-white dark:bg-gray-800 shadow-lg p-4 flex flex-col">
      <div className="flex justify-between items-center">
        <Link href="/dashboard" className="text-2xl font-bold text-blue-600 dark:text-blue-400 p-2 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
          TributeToro
        </Link>
        
        <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 md:hidden"
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

      {/* --- THIS IS THE CORRECTED LOGIC --- */}
      {/* 
        This div wraps all collapsible content.
        - `hidden`: It is hidden by default (mobile-first approach).
        - `md:flex`: On medium screens and up, it becomes a flex container.
        - `flex-grow flex-col justify-between`: These classes describe its layout when it IS visible.
        - `${isMenuOpen ? 'flex' : 'hidden'}`: This dynamically adds 'flex' (making it visible) or 'hidden'
          on mobile, based on the `isMenuOpen` state. On desktop, `md:flex` will always take precedence over `hidden`.
      */}
      <div className={`mt-4 flex-grow flex-col justify-between ${isMenuOpen ? 'flex' : 'hidden'} md:flex`}>
        <nav className="space-y-1">
          {/* Your Link components go here... no changes needed */}
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

        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
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