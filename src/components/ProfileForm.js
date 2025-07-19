// frontend/src/components/ProfileForm.js
'use client';

import { useState, useRef, useTransition } from 'react';
import { updateProfile } from '@/app/actions'; // Import the server action

// This is a Client Component for form interactivity and feedback
export default function ProfileForm({ profile }) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // useTransition is a React hook for pending states with server actions
  const [isPending, startTransition] = useTransition();
  const formRef = useRef(null); // To reset the form if needed

  // The form's submit action handler
  async function handleSubmit(formData) {
    // The 'formData' object is automatically passed by the form
    setError('');
    setSuccess('');
    
    startTransition(async () => {
      const result = await updateProfile(formData);

      if (result.success) {
        setSuccess(result.message);
        // Optionally, reset the form after successful submission if fields were uncontrolled
        // formRef.current?.reset();
        // Or more likely, you want the form to just show the new defaultValues on next render
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 text-center">
        {profile && profile.username ? 'Edit Your Profile' : 'Create Your Profile'}
      </h1>
      {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
      {success && <div className="p-3 mb-4 bg-green-100 text-green-700 rounded-md text-sm">{success}</div>}
      
      {/* The `action` prop on the form directly calls the server action */}
      <form ref={formRef} action={handleSubmit} className="space-y-8">
        
        {/* NOTE ON IMAGE UPLOADS with Server Actions:
            Direct file uploads with server actions require a more advanced setup.
            For now, these fields will save a URL that you paste in.
            We can add a separate upload component later. */}

        <div>
            <label htmlFor="bannerImageUrl" className="block text-sm font-medium text-gray-700">Banner Image URL</label>
            <input
                type="url"
                name="bannerImageUrl"
                id="bannerImageUrl"
                defaultValue={profile?.bannerImageUrl || ''}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black"
                placeholder="https://your-image-host.com/banner.png"
            />
        </div>

        <div>
            <label htmlFor="profileImageUrl" className="block text-sm font-medium text-gray-700">Profile Image URL</label>
            <input
                type="url"
                name="profileImageUrl"
                id="profileImageUrl"
                defaultValue={profile?.profileImageUrl || ''}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black"
                placeholder="https://your-image-host.com/avatar.png"
            />
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="bgColor" className="block text-sm font-medium text-gray-700">Profile Background Color</label>
            <div className="mt-1 flex items-center gap-4">
              <input
                type="color"
                name="profileBackgroundColor"
                id="bgColor"
                defaultValue={profile?.profileBackgroundColor || '#FFFFFF'}
                className="w-12 h-10 p-1 border border-gray-300 rounded-md cursor-pointer"
              />
              {/* This text input allows users to paste a hex code directly */}
              <input
                type="text"
                name="profileBackgroundColorInput" // Use a different name to avoid conflict, or handle state
                defaultValue={profile?.profileBackgroundColor || '#FFFFFF'}
                onChange={(e) => {
                  // This requires state to sync the color picker and text input
                  // For a simple server action form, it's often better to have one or the other
                  // Or just rely on the color picker's `name` attribute.
                }}
                placeholder="#FFFFFF"
                className="flex-grow px-3 py-2 border border-gray-300 rounded-md text-black"
              />
            </div>
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
                type="text"
                name="username"
                id="username"
                defaultValue={profile?.username || ''}
                required
                minLength="3"
                maxLength="20"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black"
            />
          </div>
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">Display Name</label>
            <input
                type="text"
                name="displayName"
                id="displayName"
                defaultValue={profile?.displayName || ''}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black"
            />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
                name="bio"
                id="bio"
                rows="4"
                defaultValue={profile?.bio || ''}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black"
                placeholder="A little about yourself..."
            ></textarea>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70"
        >
          {isPending ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}