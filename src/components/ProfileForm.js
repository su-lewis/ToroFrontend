'use client';

import { useState, useTransition, useRef } from 'react';
import { updateProfile } from '@/app/actions';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

export default function ProfileForm({ initialData: profile, serverError }) {
  const [error, setError] = useState(serverError?.message || '');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.profileImageUrl || null);
  const [bannerUrl, setBannerUrl] = useState(profile?.bannerImageUrl || null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const formRef = useRef(null);
  const avatarFileInputRef = useRef(null);
  const bannerFileInputRef = useRef(null);

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

    // --- THIS IS THE FIX (Part 1) ---
    // Create a consistent, predictable file path instead of a random one.
    const fileExt = file.name.split('.').pop();
    // The path will now always be the same for a user's avatar or banner.
    const filePath = `${userId}/${type}.${fileExt}`;

    // --- THIS IS THE FIX (Part 2) ---
    // Use the `update` method with the `upsert: true` option.
    // `upsert: true` means: if the file exists, update it. If it doesn't exist, create it.
    // This handles both the first upload and all subsequent updates in a single, clean command.
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600', // Optional: tell browsers to cache the image for an hour
        upsert: true, // This is the key!
      });
      
    if (error) {
      console.error("Upload failed for path:", filePath);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Since the path might be updated with a new timestamp by Supabase CDN,
    // we need to construct the public URL manually with a cache-busting query parameter.
    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    // Add a timestamp to the URL to break the browser/CDN cache and show the new image instantly.
    const cacheBusterUrl = `${publicUrlData.publicUrl}?t=${new Date().getTime()}`;
    
    return cacheBusterUrl;
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setError(''); setSuccess('');
    
    let finalAvatarUrl = avatarUrl;
    let finalBannerUrl = bannerUrl;

    const formData = new FormData(event.currentTarget);
    const avatarFile = formData.get('avatarFile');
    const bannerFile = formData.get('bannerFile');

    startTransition(async () => {
      try {
        if ((avatarFile && avatarFile.size > 0) || (bannerFile && bannerFile.size > 0)) {
          setUploading(true);
          try {
            if (avatarFile && avatarFile.size > 0) {
              finalAvatarUrl = await uploadFile(avatarFile, 'avatar');
            }
            if (bannerFile && bannerFile.size > 0) {
              finalBannerUrl = await uploadFile(bannerFile, 'banner');
            }
          } catch (uploadError) {
            setError(uploadError.message);
            setUploading(false);
            return;
          }
          setUploading(false);
        }

        const actionFormData = new FormData(formRef.current);
        actionFormData.set('profileImageUrl', finalAvatarUrl || '');
        actionFormData.set('bannerImageUrl', finalBannerUrl || '');
        
        const result = await updateProfile(actionFormData);
        
        if (result.success) {
          setSuccess(result.message);
          // Update the component's state with the new data returned from the server action
          if (result.data) {
            setAvatarUrl(result.data.profileImageUrl || null);
            setBannerUrl(result.data.bannerImageUrl || null);
            // Clear previews so the newly saved images are displayed from the URL
            setAvatarPreview(null);
            setBannerPreview(null);
            // Clear the file inputs to prevent re-uploading the same file
            if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
            if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
          }
        } else {
          setError(result.message);
        }
      } catch (error) {
        console.error('Form submission error:', error);
        setError('An unexpected error occurred. Please try again.');
      }
    });
  }

  const displayAvatar = avatarPreview || avatarUrl;
  const displayBanner = bannerPreview || bannerUrl;

  return (
    <div className="bg-white dark:bg-gray-800 p-8 md:p-16 rounded-xl shadow-lg max-w-4xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-100 text-center">
        {profile?.username ? 'Edit Your Profile' : 'Create Your Profile'}
      </h1>
      {error && <p className="text-red-500 dark:text-red-300 mb-4 p-3 bg-red-100 dark:bg-red-900/30 rounded text-sm text-center">{error}</p>}
      {success && <p className="text-green-600 dark:text-green-300 mb-4 p-3 bg-green-100 dark:bg-green-900/30 rounded text-sm text-center">{success}</p>}
      
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2">
          <label htmlFor="bannerUploadButton" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Banner Image (Recommended: 1200x400)</label>
          <div className="w-full max-w-3xl mx-auto aspect-[3/1] rounded-lg relative bg-gray-200 dark:bg-gray-700/50 border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden">
            {displayBanner ? (
              <Image src={displayBanner} alt="Banner Preview" layout="fill" className="object-cover" key={displayBanner} />
            ) : (
              <span className="text-gray-500 dark:text-gray-400">No banner uploaded</span>
            )}
          </div>
          <input type="file" name="bannerFile" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} className="hidden" id="bannerUploadButton" ref={bannerFileInputRef} />
          <button type="button" onClick={() => bannerFileInputRef.current?.click()} disabled={uploading} className="mt-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50">
            {uploading ? 'Uploading...' : 'Change Banner'}
          </button>
        </div>

        <div className="flex flex-col items-center space-y-3">
          <label htmlFor="avatarUploadButton" className="block text-sm font-medium text-gray-700 dark:text-gray-300 self-start">Profile Picture</label>
          {displayAvatar ? (
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
              <Image src={displayAvatar} alt="Profile Avatar Preview" width={128} height={128} className="w-32 h-32 rounded-full object-cover border-2 border-gray-300 shadow-sm" key={displayAvatar} />
            </div>
          ) : ( 
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-4xl border-2 border-gray-300 shadow-sm">
              {profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : (profile?.username ? profile.username.charAt(0).toUpperCase() : '?')}
            </div> 
          )}
          <input type="file" name="avatarFile" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} className="hidden" id="avatarUploadButton" ref={avatarFileInputRef} />
          <button type="button" onClick={() => avatarFileInputRef.current?.click()} disabled={uploading} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"> 
            {uploading ? 'Uploading...' : 'Change Avatar'}
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
            <input type="text" name="username" id="username" defaultValue={profile?.username || ''} required minLength="3" maxLength="20" pattern="^[a-zA-Z0-9_.-]+$" title="3-20 chars. Letters, numbers, _, ., -." className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-black dark:text-gray-300 bg-white dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
            <input type="text" name="displayName" id="displayName" defaultValue={profile?.displayName || ''} className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-black dark:text-gray-300 bg-white dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
            <textarea name="bio" id="bio" defaultValue={profile?.bio || ''} rows="4" className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-black dark:text-gray-300 bg-white dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500" placeholder="A little about yourself..."></textarea>
          </div>
          
          <div>
            <label htmlFor="profileBackgroundColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Background Color</label>
            <div className="mt-1 flex items-center gap-4">
              <input type="color" name="profileBackgroundColor" id="profileBackgroundColor" defaultValue={profile?.profileBackgroundColor || '#FFFFFF'} className="w-14 h-10 p-1 border border-gray-300 rounded-md cursor-pointer" />
              <input type="text" value={formRef.current?.profileBackgroundColor.value || profile?.profileBackgroundColor || '#FFFFFF'} readOnly className="w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700" />
            </div>
          </div>
        </div>
        
        <button type="submit" disabled={isPending || uploading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70">
          {(isPending || uploading) ? 'Saving Profile...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}