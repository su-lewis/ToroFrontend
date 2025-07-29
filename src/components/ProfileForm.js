// frontend/src/components/ProfileForm.js
'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { updateProfile } from '@/app/actions';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

// The 'initialData' prop is passed from the parent Server Component ('profile/page.js')
export default function ProfileForm({ initialData, serverError }) {
  // State for Server Action feedback and pending status
  const [error, setError] = useState(serverError?.message || '');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  // State for client-side operations (like file uploads)
  const [uploading, setUploading] = useState(false);
  
  // State for the final image URLs that will be submitted
  const [avatarUrl, setAvatarUrl] = useState(initialData?.profileImageUrl || null);
  const [bannerUrl, setBannerUrl] = useState(initialData?.bannerImageUrl || null);
  
  // State for temporary previews of selected files
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const formRef = useRef(null);

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("File is too large (Max 5MB)."); return; }
    if (!file.type.startsWith('image/')) { setError("Invalid file type (Images only)."); return; }
    
    const previewUrl = URL.createObjectURL(file);
    if (type === 'avatar') setAvatarPreview(previewUrl);
    else setBannerPreview(previewUrl);

    setError('');
  };
  
  const uploadFile = async (file, type) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Authentication required for upload.");
    const userId = session.user.id;
    const filePath = `${userId}/${type}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    
    const { data, error } = await supabase.storage.from('avatars').upload(filePath, file);
    if (error) throw new Error(`Upload failed: ${error.message}`);
    
    return supabase.storage.from('avatars').getPublicUrl(data.path).data.publicUrl;
  };

  async function handleFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(''); setSuccess('');
    
    let finalAvatarUrl = avatarUrl;
    let finalBannerUrl = bannerUrl;
    const avatarFile = formData.get('avatarFile');
    const bannerFile = formData.get('bannerFile');

    if (avatarFile?.size > 0 || bannerFile?.size > 0) {
        setUploading(true);
        try {
          if (avatarFile && avatarFile.size > 0) finalAvatarUrl = await uploadFile(avatarFile, 'avatar');
          if (bannerFile && bannerFile.size > 0) finalBannerUrl = await uploadFile(bannerFile, 'banner');
        } catch (uploadError) {
          setError(uploadError.message); setUploading(false); return;
        }
        setUploading(false);
    }
    
    const actionFormData = new FormData(formRef.current);
    actionFormData.set('profileImageUrl', finalAvatarUrl || '');
    actionFormData.set('bannerImageUrl', finalBannerUrl || '');
    
    startTransition(async () => {
      const result = await updateProfile(actionFormData);
      if (result.success) {
        setSuccess(result.message);
        setAvatarPreview(null); setBannerPreview(null);
        setAvatarUrl(finalAvatarUrl); setBannerUrl(finalBannerUrl);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-8 max-w-3xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100">{initialData?.username ? 'Edit Profile' : 'Create Your Profile'}</h1>
        {error && <div className="p-3 text-center bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm">{error}</div>}
        {success && <div className="p-3 text-center bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-sm">{success}</div>}

        {/* Banner Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Banner Image</label>
          <div className="w-full aspect-[3/1] rounded-lg bg-gray-100 dark:bg-gray-700 relative flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
            {(bannerPreview || bannerUrl) && <Image src={bannerPreview || bannerUrl} alt="Banner Preview" layout="fill" className="object-cover rounded-lg" />}
            <input type="file" name="bannerFile" onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <span className="z-10 p-2 bg-white/70 dark:bg-black/50 text-gray-600 dark:text-gray-200 rounded-md pointer-events-none">Change Banner</span>
          </div>
        </div>

        {/* Avatar Upload */}
        <div className="flex flex-col items-center space-y-4">
            <div className="relative w-32 h-32">
                {(avatarPreview || avatarUrl) ? (
                <Image src={avatarPreview || avatarUrl} alt="Avatar Preview" width={128} height={128} className="w-32 h-32 rounded-full object-cover border-2 border-gray-300 shadow-sm" />
                ) : ( <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-4xl border-2 border-gray-300 shadow-sm">?</div> )}
                <label htmlFor="avatarFile" className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 text-white text-xs font-semibold rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                Change
                </label>
                <input type="file" name="avatarFile" id="avatarFile" onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" className="hidden" />
            </div>
        </div>

        {/* Text and Color Fields */}
        <div className="space-y-6">
          <div>
            <label htmlFor="bgColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Background Color</label>
            <input type="color" name="profileBackgroundColor" id="bgColor" defaultValue={initialData?.profileBackgroundColor || '#FFFFFF'} className="mt-1 w-full h-10 p-1 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"/>
          </div>

          {/* RESTORED USERNAME LAYOUT */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                your-page.com/
              </span>
              <input
                type="text"
                name="username"
                id="username"
                defaultValue={initialData?.username || ''}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 text-black bg-white"
                placeholder="your-unique-username"
                required
              />
            </div>
          </div>
          
          {/* RESTORED DISPLAY NAME & BIO LAYOUT */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
            <input
              type="text"
              name="displayName"
              id="displayName"
              defaultValue={initialData?.displayName || ''}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
              placeholder="Your Full Name"
            />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
            <textarea
              name="bio"
              id="bio"
              rows="3"
              defaultValue={initialData?.bio || ''}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
              placeholder="A short description about yourself."
            ></textarea>
          </div>
        </div>

        {/* RESTORED BUTTON LAYOUT */}
        <div>
            <button
            type="submit"
            disabled={isPending || uploading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
            {(isPending || uploading) ? 'Saving...' : 'Save Profile'}
            </button>
        </div>
    </form>
  );
}