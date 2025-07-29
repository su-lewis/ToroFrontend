// frontend/src/components/ProfileForm.js
'use client';

import { useState, useTransition, useRef } from 'react';
import { updateProfile } from '@/app/actions';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

// This component receives the pre-fetched 'profile' data from its parent Server Component.
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
    const filePath = `${userId}/${type}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const { data, error } = await supabase.storage.from('avatars').upload(filePath, file);
    if (error) throw new Error(`Upload failed: ${error.message}`);
    return supabase.storage.from('avatars').getPublicUrl(data.path).data.publicUrl;
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setError(''); setSuccess('');
    
    let finalAvatarUrl = avatarUrl;
    let finalBannerUrl = bannerUrl;

    // Get files directly from the form data
    const formData = new FormData(event.currentTarget);
    const avatarFile = formData.get('avatarFile');
    const bannerFile = formData.get('bannerFile');

    // Start the transition immediately for better UX
    startTransition(async () => {
      try {
        // Upload files if they exist
        if ((avatarFile && avatarFile.size > 0) || (bannerFile && bannerFile.size > 0)) {
          setUploading(true);
          
          try {
            if (avatarFile && avatarFile.size > 0) {
              finalAvatarUrl = await uploadFile(avatarFile, 'avatar');
              setAvatarUrl(finalAvatarUrl);
              setAvatarPreview(null);
              // Clear the file input
              if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
            }
            if (bannerFile && bannerFile.size > 0) {
              finalBannerUrl = await uploadFile(bannerFile, 'banner');
              setBannerUrl(finalBannerUrl);
              setBannerPreview(null);
              // Clear the file input
              if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
            }
          } catch (uploadError) {
            setError(uploadError.message);
            setUploading(false);
            return;
          }
          setUploading(false);
        }

        // Create form data for the server action
        const actionFormData = new FormData(formRef.current);
        actionFormData.set('profileImageUrl', finalAvatarUrl || '');
        actionFormData.set('bannerImageUrl', finalBannerUrl || '');
        
        // Submit to server action
        const result = await updateProfile(actionFormData);
        
        if (result.success) {
          setSuccess(result.message);
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
    <div className="bg-white dark:bg-gray-800 p-8 md:p-16 rounded-xl shadow-lg max-w-8xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-100 text-center">
        {profile?.username ? 'Edit Your Profile' : 'Create Your Profile'}
      </h1>
      {error && <p className="text-red-500 dark:text-red-300 mb-4 p-3 bg-red-100 dark:bg-red-900/30 rounded text-sm text-center">{error}</p>}
      {success && <p className="text-green-600 dark:text-green-300 mb-4 p-3 bg-green-100 dark:bg-green-900/30 rounded text-sm text-center">{success}</p>}
      
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
        {/* Banner Image Upload Section */}
        <div className="space-y-2">
          <label htmlFor="bannerUploadButton" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Banner Image (Recommended: 1200x400 or similar 3:1 ratio)</label>
          {displayBanner ? (
            <div className="w-full aspect-[3/1] relative rounded-lg overflow-hidden border border-gray-300 bg-gray-100">
              <Image src={displayBanner} alt="Banner Preview" fill={true} className="object-cover" key={displayBanner} />
            </div>
          ) : (
            <div className="w-full aspect-[3/1] bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 border border-dashed border-gray-300">
              <span>No banner uploaded</span>
            </div>
          )}
          <input 
            type="file" 
            name="bannerFile" 
            accept="image/png, image/jpeg, image/gif, image/webp" 
            onChange={(e) => handleFileChange(e, 'banner')} 
            className="hidden" 
            ref={bannerFileInputRef} 
          />
          <button type="button" onClick={() => bannerFileInputRef.current?.click()} disabled={uploading} className="mt-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50">
            {uploading ? 'Uploading...' : 'Change Banner'}
          </button>
        </div>

        {/* Avatar Upload Section */}
        <div className="flex flex-col items-center space-y-3">
          <label htmlFor="avatarUploadButton" className="block text-sm font-medium text-gray-700 dark:text-gray-300 self-start">Profile Picture</label>
          {displayAvatar ? (
            <Image src={displayAvatar} alt="Profile Avatar Preview" width={128} height={128} className="w-32 h-32 rounded-full object-cover border-2 border-gray-300 shadow-sm" key={displayAvatar} />
          ) : ( 
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-4xl border-2 border-gray-300 shadow-sm">
              {profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : (profile?.username ? profile.username.charAt(0).toUpperCase() : '?')}
            </div> 
          )}
          <input 
            type="file" 
            name="avatarFile" 
            accept="image/png, image/jpeg, image/gif, image/webp" 
            onChange={(e) => handleFileChange(e, 'avatar')} 
            className="hidden" 
            ref={avatarFileInputRef} 
          />
          <button type="button" onClick={() => avatarFileInputRef.current?.click()} disabled={uploading} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"> 
            {uploading ? 'Uploading...' : 'Change Avatar'}
          </button>
        </div>

        {/* Text Fields and Color Picker */}
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
          
          {/* Profile Background Color */}
          <div>
            <label htmlFor="profileBackgroundColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Background Color</label>
            <div className="mt-1 flex items-center gap-4">
              <input 
                type="color" 
                name="profileBackgroundColor"
                id="profileBackgroundColor" 
                defaultValue={profile?.profileBackgroundColor || '#FFFFFF'}
                className="w-14 h-10 p-1 border border-gray-300 rounded-md cursor-pointer"
              />
              <input 
                type="text"
                defaultValue={profile?.profileBackgroundColor || '#FFFFFF'}
                readOnly
                className="w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 focus:ring-0 focus:border-gray-300"
              />
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