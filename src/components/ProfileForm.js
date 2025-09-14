'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { updateProfile, updateProfileImages } from '@/app/actions';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import { SketchPicker } from 'react-color';

// A curated palette of 24 colors for the picker
const presetColors = [
  '#111827', '#1F2937', '#374151', '#4B5563', // Slate Greys
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', // Red, Orange, Amber, Lime
  '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6', // Green, Teal, Cyan, Blue
  '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', // Indigo, Violet, Purple, Fuchsia
  '#EC4899', '#F43F5E', '#FFFFFF', '#000000', // Pink, Rose, White, Black
  '#FEF2F2', '#FFFBEB', '#F0F9FF', '#F5F3FF', // Very light tints
];

export default function ProfileForm({ initialData: profile, serverError }) {
  const [error, setError] = useState(serverError?.message || '');
  const [success, setSuccess] = useState(null);
  const [isPending, startTransition] = useTransition();

  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isBannerUploading, setIsBannerUploading] = useState(false);

  // States to hold the current profile data, which will be updated by the auto-save
  const [currentProfile, setCurrentProfile] = useState(profile);
  
  // State for the color picker
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState(profile?.profileBackgroundColor || '#111827');

  const formRef = useRef(null);
  const avatarFileInputRef = useRef(null);
  const bannerFileInputRef = useRef(null);

  // Keep local state in sync if initialData changes
  useEffect(() => {
    setCurrentProfile(profile);
    setBackgroundColor(profile?.profileBackgroundColor || '#111827');
  }, [profile]);

  const uploadFile = async (file, type) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Authentication required for upload.");
    const userId = session.user.id;

    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${type}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
      
    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return `${publicUrlData.publicUrl}?t=${new Date().getTime()}`;
  };
  
  const handleFileChange = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setSuccess(null);

    if (file.size > 5 * 1024 * 1024) { setError("File is too large (Max 5MB)."); return; }
    if (!file.type.startsWith('image/')) { setError("Invalid file type (Images only)."); return; }

    const setLoading = type === 'avatar' ? setIsAvatarUploading : setIsBannerUploading;
    setLoading(true);

    try {
      const newUrl = await uploadFile(file, type);
      
      const payload = type === 'avatar' 
        ? { profileImageUrl: newUrl } 
        : { bannerImageUrl: newUrl };
      
      const result = await updateProfileImages(payload);

      if (result.success && result.data) {
        setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`);
        setCurrentProfile(result.data); // Update the local profile state with the new data
      } else {
        throw new Error(result.message);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      if (e.target) e.target.value = ''; // Clear the file input
    }
  };
  
  async function handleSubmit(event) {
    event.preventDefault();
    setError(''); setSuccess(null);
    
    startTransition(async () => {
      try {
        const formData = new FormData(formRef.current);
        // The image URLs are now part of the `currentProfile` state
        formData.set('profileImageUrl', currentProfile.profileImageUrl || '');
        formData.set('bannerImageUrl', currentProfile.bannerImageUrl || '');
        // The background color is handled by its own state
        formData.set('profileBackgroundColor', backgroundColor);
        
        const result = await updateProfile(formData);
        
        if (result.success && result.data) {
          setSuccess(result.message);
          setCurrentProfile(result.data); // Update with the final saved data
        } else {
          setError(result.message);
        }
      } catch (error) {
        setError('An unexpected error occurred.');
      }
    });
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-8 md:p-16 rounded-xl shadow-lg max-w-4xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-100 text-center">Edit Profile</h1>
      {error && <p className="text-red-500 dark:text-red-300 mb-4 p-3 bg-red-100 dark:bg-red-900/30 rounded text-sm text-center">{error}</p>}
      {success && <p className="text-green-600 dark:text-green-300 mb-4 p-3 bg-green-100 dark:bg-green-900/30 rounded text-sm text-center">{success}</p>}
      
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Banner Image (Recommended: 1200x400)</label>
          <div className="mt-2 w-full max-w-3xl mx-auto aspect-[3/1] rounded-lg relative bg-gray-200 dark:bg-gray-700/50 border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden">
            {currentProfile?.bannerImageUrl ? <Image src={currentProfile.bannerImageUrl} alt="Banner Preview" layout="fill" className="object-cover" key={currentProfile.bannerImageUrl} /> : <span className="text-gray-500">No banner</span>}
          </div>
          <input type="file" id="banner-upload" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} className="hidden" />
          <button type="button" onClick={() => document.getElementById('banner-upload').click()} disabled={isBannerUploading} className="mt-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 disabled:opacity-50">
            {isBannerUploading ? 'Uploading...' : 'Upload New Banner'}
          </button>
        </div>

        <div className="flex flex-col items-center space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 self-start">Profile Picture</label>
          <div className="w-32 h-32 rounded-full overflow-hidden relative bg-gray-200 border-2 border-gray-300 shadow-sm">
            {currentProfile?.profileImageUrl ? <Image src={currentProfile.profileImageUrl} alt="Avatar Preview" layout="fill" className="object-cover" key={currentProfile.profileImageUrl} /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">?</div>}
          </div>
          <input type="file" id="avatar-upload" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} className="hidden" />
          <button type="button" onClick={() => document.getElementById('avatar-upload').click()} disabled={isAvatarUploading} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 disabled:opacity-50"> 
            {isAvatarUploading ? 'Uploading...' : 'Upload New Avatar'}
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
            <input type="text" name="username" id="username" defaultValue={currentProfile?.username || ''} required className="mt-1 block w-full px-4 py-3 border rounded-md" />
          </div>
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
            <input type="text" name="displayName" id="displayName" defaultValue={currentProfile?.displayName || ''} className="mt-1 block w-full px-4 py-3 border rounded-md" />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
            <textarea name="bio" id="bio" defaultValue={currentProfile?.bio || ''} rows="4" className="mt-1 block w-full px-4 py-3 border rounded-md"></textarea>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Background Color</label>
            <div className="mt-1 flex items-center gap-4">
              <div onClick={() => setShowColorPicker(p => !p)} className="w-14 h-10 p-1 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer" style={{ backgroundColor: backgroundColor }}></div>
              <input type="text" name="profileBackgroundColor" value={backgroundColor.toUpperCase()} readOnly className="w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md" />
            </div>
            {showColorPicker && (
              <div className="absolute z-10 mt-2">
                <div className="fixed inset-0" onClick={() => setShowColorPicker(false)} />
                <SketchPicker
                  color={backgroundColor}
                  onChange={(color) => setBackgroundColor(color.hex)}
                  presetColors={presetColors}
                />
              </div>
            )}
          </div>
        </div>
        
        <button type="submit" disabled={isPending || isAvatarUploading || isBannerUploading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70">
          {(isPending || isAvatarUploading || isBannerUploading) ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </form>
    </div>
  );
}