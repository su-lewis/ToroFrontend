// frontend/src/components/ProfileForm.js
'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { updateProfile } from '@/app/actions'; // Import the server action
import { supabase } from '@/lib/supabaseClient'; // Import client-side Supabase FOR UPLOADS ONLY
import Image from 'next/image';

// The 'initialData' prop is passed from the parent Server Component ('profile/page.js')
export default function ProfileForm({ initialData, serverError }) {
  // State for Server Action feedback and pending status
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  // State for client-side operations (like file uploads)
  const [uploading, setUploading] = useState(false);
  
  // These states hold the FINAL URLs that will be submitted
  const [avatarUrl, setAvatarUrl] = useState(initialData?.profileImageUrl || null);
  const [bannerUrl, setBannerUrl] = useState(initialData?.bannerImageUrl || null);
  
  // These states hold temporary previews for selected files
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const formRef = useRef(null); // Ref to access the form element
  const avatarInputRef = useRef(null); // Ref for the avatar file input
  const bannerInputRef = useRef(null); // Ref for the banner file input

  useEffect(() => {
    // Display server-side fetching errors on initial load
    if (serverError) {
      setError(`Error loading initial profile: ${serverError.message}`);
    }
    // This effect ensures if the parent component re-renders with new initialData,
    // our form's URL state is updated.
    setAvatarUrl(initialData?.profileImageUrl || null);
    setBannerUrl(initialData?.bannerImageUrl || null);
  }, [initialData, serverError]);

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

    // Step 1: Handle any file uploads first on the client-side
    if (avatarFile?.size > 0 || bannerFile?.size > 0) {
        setUploading(true);
        try {
          if (avatarFile && avatarFile.size > 0) {
            finalAvatarUrl = await uploadFile(avatarFile, 'avatar');
            setAvatarUrl(finalAvatarUrl);
            setAvatarPreview(null);
          }
          if (bannerFile && bannerFile.size > 0) {
            finalBannerUrl = await uploadFile(bannerFile, 'banner');
            setBannerUrl(finalBannerUrl);
            setBannerPreview(null);
          }
        } catch (uploadError) {
          setError(uploadError.message);
          setUploading(false);
          return;
        }
        setUploading(false);
    }
    
    // Step 2: Prepare FormData for the Server Action
    const actionFormData = new FormData(formRef.current);
    actionFormData.set('profileImageUrl', finalAvatarUrl || '');
    actionFormData.set('bannerImageUrl', finalBannerUrl || '');
    
    // Step 3: Call the Server Action
    startTransition(async () => {
      const result = await updateProfile(actionFormData);
      if (result.success) {
        setSuccess(result.message);
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

        {/* --- RESTORED BANNER UPLOAD UI --- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Banner Image</label>
          <div className="w-full aspect-[3/1] rounded-lg bg-gray-100 dark:bg-gray-700 relative flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
            {(bannerPreview || bannerUrl) && <Image src={bannerPreview || bannerUrl} alt="Banner Preview" layout="fill" className="object-cover rounded-lg" />}
            <button type="button" onClick={() => bannerInputRef.current?.click()} className="z-10 bg-white bg-opacity-70 dark:bg-black/50 hover:bg-opacity-90 dark:hover:bg-opacity-70 text-black dark:text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all">
                {uploading ? 'Uploading...' : 'Change Banner'}
            </button>
            <input type="file" name="bannerFile" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" className="hidden" />
          </div>
        </div>

        {/* --- RESTORED AVATAR UPLOAD UI --- */}
        <div className="flex flex-col items-center space-y-4">
            <div className="relative w-32 h-32">
                {(avatarPreview || avatarUrl) ? (
                <Image src={avatarPreview || avatarUrl} alt="Avatar Preview" width={128} height={128} className="w-32 h-32 rounded-full object-cover border-2 border-gray-300 shadow-sm" />
                ) : ( <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-4xl border-2 border-gray-300 shadow-sm">?</div> )}
                <label htmlFor="avatarFile" className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 text-white text-xs font-semibold rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                Change
                </label>
                <input type="file" name="avatarFile" id="avatarFile" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" className="hidden" />
            </div>
        </div>

        {/* Text and Color Fields */}
        <div className="space-y-6">
          <div>
            <label htmlFor="bgColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Background Color</label>
            <div className="mt-1 flex items-center gap-4">
              <input type="color" name="profileBackgroundColor" id="bgColor" defaultValue={initialData?.profileBackgroundColor || '#FFFFFF'} className="w-12 h-10 p-1 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"/>
              {/* This text input is just for display, the color picker handles the value */}
              <input type="text" value={initialData?.profileBackgroundColor || '#FFFFFF'} readOnly className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700"/>
            </div>
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
            <input type="text" name="username" id="username" defaultValue={initialData?.username || ''} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-black dark:text-white bg-white dark:bg-gray-700"/>
          </div>
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
            <input type="text" name="displayName" id="displayName" defaultValue={initialData?.displayName || ''} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-black dark:text-white bg-white dark:bg-gray-700"/>
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
            <textarea name="bio" id="bio" rows="4" defaultValue={initialData?.bio || ''} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-black dark:text-white bg-white dark:bg-gray-700"></textarea>
          </div>
        </div>

        <button type="submit" disabled={isPending || uploading} className="w-full flex justify-center py-3 px-4 border rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70">
          {(isPending || uploading) ? 'Saving...' : 'Save Profile'}
        </button>
    </form>
  );
}