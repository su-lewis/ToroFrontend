// frontend/src/components/ProfileForm.js
'use client';

import { useState, useTransition } from 'react';
import { updateProfile } from '@/app/actions';

// This is a Client Component for interactivity
export default function ProfileForm({ initialData: profile, serverError }) { // Renamed prop for clarity
  const [error, setError] = useState(serverError?.message || '');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  // The form's submit action handler
  async function handleSubmit(formData) {
    setError('');
    setSuccess('');
    startTransition(async () => {
        const result = await updateProfile(formData);
        if (result.success) {
            setSuccess(result.message);
        } else {
            setError(result.message);
        }
    });
  }

  return (
    // Form container now has dark mode background
    <form action={handleSubmit} className="space-y-6 max-w-2xl bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
      {error && <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">{error}</div>}
      {success && <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md">{success}</div>}
      
      {/* Note: This version does not handle file uploads, only URL inputs, per your provided code */}
      
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
        {/* --- RESTORED USERNAME LAYOUT and FORCED LIGHT THEME on inputs --- */}
        <div className="mt-1 flex rounded-md shadow-sm">
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
            your-page.com/
          </span>
          <input
            type="text"
            name="username"
            id="username"
            defaultValue={profile?.username || ''}
            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 text-black bg-white"
            placeholder="your-unique-username"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
        {/* --- FORCED LIGHT THEME on input --- */}
        <input
          type="text"
          name="displayName"
          id="displayName"
          defaultValue={profile?.displayName || ''}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
          placeholder="Your Full Name"
        />
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
        {/* --- FORCED LIGHT THEME on textarea --- */}
        <textarea
          name="bio"
          id="bio"
          rows="3"
          defaultValue={profile?.bio || ''}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
          placeholder="A short description about yourself."
        ></textarea>
      </div>

      <div>
        <label htmlFor="profileImageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Image URL</label>
        {/* --- FORCED LIGHT THEME on input --- */}
        <input
          type="url"
          name="profileImageUrl"
          id="profileImageUrl"
          defaultValue={profile?.profileImageUrl || ''}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
          placeholder="https://your-image-host.com/image.png"
        />
      </div>

       {/* Add Banner Image URL and Background Color inputs */}
       <div>
        <label htmlFor="bannerImageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Banner Image URL</label>
        <input type="url" name="bannerImageUrl" id="bannerImageUrl" defaultValue={profile?.bannerImageUrl || ''} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black bg-white" placeholder="https://..."/>
      </div>

      <div>
        <label htmlFor="bgColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Background Color</label>
        <input type="color" name="profileBackgroundColor" id="bgColor" defaultValue={profile?.profileBackgroundColor || '#FFFFFF'} className="mt-1 w-full h-10 p-1 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"/>
      </div>


      <div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
        >
          {isPending ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}