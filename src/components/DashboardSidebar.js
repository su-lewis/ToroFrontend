'use client';

import { useState } from 'react';
import Link from 'next/link';
import { handleLogout } from '@/app/actions';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { 
    ChartBarIcon, 
    Cog6ToothIcon, 
    ArrowRightOnRectangleIcon, 
    UserCircleIcon,
    KeyIcon,
    Bars3Icon,
    XMarkIcon,
    QuestionMarkCircleIcon,
    PencilSquareIcon // <-- New Icon for the editor
} from '@heroicons/react/24/outline';

export default function DashboardSidebar({ userProfile, session }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  const isProfileIncomplete = !userProfile || !userProfile.username;
  const paymentsLinkUrl = isProfileIncomplete 
    ? '/dashboard/profile'
    : (userProfile?.stripeOnboardingComplete ? '/dashboard/payments' : '/connect-stripe');

  return (
    <aside className="w-full bg-white dark:bg-gray-800 shadow-lg md:flex md:flex-col md:h-screen md:p-4 md:fixed md:top-0 md:left-0 md:w-64">
      <div className="flex justify-between items-center p-4 md:p-0">
        <Link href="/dashboard" onClick={handleLinkClick}>
          <div className="text-2xl font-bold">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
              Tribute
            </span>
            {' '}
            <span className="text-gray-800 dark:text-white">
              Toro
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 rounded-md md:hidden" aria-label="Toggle menu">
            {isMenuOpen ? (
                <XMarkIcon className="h-7 w-7 text-gray-800 dark:text-gray-200" />
            ) : (
                <Bars3Icon className="h-7 w-7 text-gray-800 dark:text-gray-200" />
            )}
          </button>
        </div>
      </div>
      
      <div className={`flex flex-col justify-between flex-grow ${isMenuOpen ? 'flex' : 'hidden'} md:flex`}>
        <nav className="space-y-1 p-4 pt-0 md:p-0 md:mt-4">
          <Link href="/dashboard" onClick={handleLinkClick} className="group flex items-center space-x-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md">
            <UserCircleIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" /> 
            <span className="font-medium">Overview</span>
          </Link>
          <Link href="/dashboard/profile" onClick={handleLinkClick} className="group flex items-center space-x-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md">
            <Cog6ToothIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" /> 
            <span className="font-medium">Profile Settings</span>
          </Link>
          
          {/* --- THIS IS THE UPDATED LINK --- */}
          <Link href="/dashboard/page-editor" onClick={handleLinkClick} className="group flex items-center space-x-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md">
            <PencilSquareIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" /> 
            <span className="font-medium">Page Editor</span>
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

        <div>
          <nav className="px-4 pb-4 md:px-0 md:pb-6">
            <Link href="/dashboard/support" onClick={handleLinkClick} className="group flex items-center space-x-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md">
              <QuestionMarkCircleIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" /> 
               <span className="font-medium">Support</span>
            </Link>
          </nav>

          <div className="p-4 pt-0 md:p-0 md:pt-4 md:border-t border-gray-200 dark:border-gray-700">
            <form action={handleLogout}>
              <button type="submit" className="group flex items-center space-x-3 w-full px-3 py-2.5 rounded-md ...">
                <ArrowRightOnRectangleIcon className="h-6 w-6 ..." /> 
                <span className="font-medium">Log Out</span>
              </button>
            </form>
            {session?.user?.email && ( 
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 p-2 text-center break-all">
                    {session.user.email}
                </p> 
            )}

            <div className="px-4 pt-4 md:px-3 text-center text-xs space-x-3 text-gray-500 dark:text-gray-400">
                <Link href="/privacy-policy" className="hover:underline">Privacy</Link>
                <Link href="/terms-of-service" className="hover:underline">Terms</Link>
                <Link href="/refund-policy" className="hover:underline">Refunds</Link>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}