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

  // --- FIX: Create a function to handle closing the menu ---
  const handleLinkClick = () => {
    setIsMenuOpen(false); // This will close the menu
  };

  const isStripeOnboarded = userProfile?.stripeOnboardingComplete === true;
  const paymentsLinkUrl = isStripeOnboarded ? '/dashboard/payments' : '/connect-stripe';

  return (
    // On mobile, this container is a simple header. On desktop, it becomes the full sidebar.
    <aside className="w-full bg-white dark:bg-gray-800 shadow-lg md:w-64 md:flex md:flex-col md:h-screen md:p-4">
      
      {/* HEADER: Always visible on all screen sizes */}
      <div className="flex justify-between items-center p-4">
        <Link href="/dashboard" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          TributeToro
        </Link>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          
          {/* Hamburger/Close Button: Only visible on mobile */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="p-1 rounded-md md:hidden" // md:hidden is crucial
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
                <XMarkIcon className="h-7 w-7 text-gray-800 dark:text-gray-200" />
            ) : (
                <Bars3Icon className="h-7 w-7 text-gray-800 dark:text-gray-200" />
            )}
          </button>
        </div>
      </div>

      {/* --- THIS IS THE CORRECTED COLLAPSIBLE SECTION --- */}
      {/* It's a normal block in the flow, not absolutely positioned. */}
      <div className={`
          flex-col justify-between flex-grow
          ${isMenuOpen ? 'flex' : 'hidden'}  /* On mobile: display:flex if open, display:none if closed */
          md:flex                           /* On desktop: ALWAYS display:flex, overriding the mobile 'hidden' state */
        `}
      >
        <nav className="space-y-1 p-4 pt-0 md:p-0 md:mt-4">
         <Link href="/dashboard" onClick={handleLinkClick} className="group flex items-center space-x-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md">
            <UserCircleIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" /> 
            <span className="font-medium">Overview</span>
          </Link>
          <Link href="/dashboard/profile" onClick={handleLinkClick} className="group flex items-center space-x-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md">
            <Cog6ToothIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" /> 
            <span className="font-medium">Profile Settings</span>
          </Link>
          <Link href="/dashboard/links" onClick={handleLinkClick} className="group flex items-center space-x-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md">
            <LinkIconOutline className="h-5 w-5 text-gray-500 dark:text-gray-400" /> 
            <span className="font-medium">Manage Links</span>
          </Link>
          <Link href={paymentsLinkUrl} onClick={handleLinkClick} className="group flex items-center space-x-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md">
            <ChartBarIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <span className="font-medium">Payments</span>
          </Link>
          <Link href="/dashboard/account-settings" onClick={handleLinkClick} className="group flex items-center space-x-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md">
            <KeyIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" /> 
            <span className="font-medium">Account Security</span>
          </Link>
        </nav>

        <div className="p-4 pt-0 md:p-0 md:pt-6 md:border-t border-gray-200 dark:border-gray-700">
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