// frontend/src/components/ProfileForm.js
'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { updateProfile, updateProfileImages } from '@/app/actions';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import { SketchPicker } from 'react-color';
import { XMarkIcon } from '@heroicons/react/24/solid';

// A curated palette of 24 colors for the picker
const presetColors = [
  '#111827', '#1F2937', '#374151', '#4B5563', '#6B7280', '#9CA3AF', // Greys
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E', // Reds to Greens
  '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', // Greens to Blues
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#FFFFFF', // Purples to Pinks
];

export default function ProfileForm({ initialData: profile, serverError }) {
  const [error, setError] = useState(serverError?.message || '');
  const [success, setSuccess] = useState(null);
  const [isPending, startTransition] = useTransition();

  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isBannerUploading, setIsBannerUploading] = useState(false);

  const [currentProfile, setCurrentProfile] = useState(profile);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState(profile?.profileBackgroundColor || '#111827');

  const formRef = useRef(null);

  useEffect(() => {
    document.body.style.setProperty('--profile-bg-color', backgroundColor);
  }, [backgroundColor]);

  const uploadFile = async (file, type) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Authentication required for upload.");
    const userId = session.user.id;

    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${type}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (error) throw new Error(`Upload failed: ${error.message}`);

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
      const payload = type === 'avatar' ? { profileImageUrl: newUrl } : { bannerImageUrl: newUrl };
      const result = await updateProfileImages(payload);

      if (result.success && result.data) {
        setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`);
        setCurrentProfile(result.data);
      } else { throw new Error(result.message); }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveImage = async (type) => {
    const setLoading = type === 'avatar' ? setIsAvatarUploading : setIsBannerUploading;
    setLoading(true);
    setError(''); setSuccess(null);

    try {
      const payload = type === 'avatar' ? { profileImageUrl: '' } : { bannerImageUrl: '' };
      const result = await updateProfileImages(payload);
      if (result.success && result.data) {
        setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} removed.`);
        setCurrentProfile(result.data);
      } else { throw new Error(result.message); }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setError(''); setSuccess(null);

    startTransition(async () => {
      try {
        const formData = new FormData(formRef.current);
        formData.set('profileImageUrl', currentProfile.profileImageUrl || '');
        formData.set('bannerImageUrl', currentProfile.bannerImageUrl || '');
        formData.set('profileBackgroundColor', backgroundColor);

        const result = await updateProfile(formData);

        if (result.success && result.data) {
          setSuccess(result.message);
          setCurrentProfile(result.data);
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
      {success && <p className="text-green-700 dark:text-green-300 mb-4 p-3 bg-green-100 dark:bg-green-900/30 rounded text-sm text-center">{success}</p>}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Banner Image (Recommended: 1200x400)</label>
          <div
            className="mt-2 w-full max-w-3xl mx-auto aspect-[3/1] rounded-lg relative bg-gray-200 dark:bg-gray-700/50 border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden transition-colors"
            style={{ backgroundColor: currentProfile?.bannerImageUrl ? 'transparent' : backgroundColor }}
          >
            {currentProfile?.bannerImageUrl ? (
              <Image src={currentProfile.bannerImageUrl} alt="Banner Preview" layout="fill" className="object-cover" key={currentProfile.bannerImageUrl} />
            ) : (
              <span className="text-gray-500 dark:text-gray-400 opacity-50 text-xs">No banner</span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input type="file" id="banner-upload" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} className="hidden" />
            <button type="button" onClick={() => document.getElementById('banner-upload').click()} disabled={isBannerUploading} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 disabled:opacity-50">
              {isBannerUploading ? 'Uploading...' : 'Upload New Banner'}
            </button>
            {currentProfile?.bannerImageUrl && (
              <button type="button" onClick={() => handleRemoveImage('banner')} disabled={isBannerUploading} className="p-2 bg-red-100 dark:bg-red-900/30 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50">
                <XMarkIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 self-start">Profile Picture</label>
          <div className="w-32 h-32 rounded-full overflow-hidden relative border-2 border-gray-300 dark:border-gray-700 shadow-sm flex items-center justify-center">
            {currentProfile?.profileImageUrl ? (
              <Image src={currentProfile.profileImageUrl} alt="Avatar Preview" layout="fill" className="object-cover" key={currentProfile.profileImageUrl} />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white text-6xl font-bold transition-colors"
                style={{ backgroundColor: backgroundColor }}
              >
                {currentProfile?.displayName ? currentProfile.displayName.charAt(0).toUpperCase() : (currentProfile?.username ? currentProfile.username.charAt(0).toUpperCase() : '?')}
              </div>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input type="file" id="avatar-upload" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} className="hidden" />
            <button type="button" onClick={() => document.getElementById('avatar-upload').click()} disabled={isAvatarUploading} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 disabled:opacity-50">
              {isAvatarUploading ? 'Uploading...' : 'Upload New Avatar'}
            </button>
            {currentProfile?.profileImageUrl && (
              <button type="button" onClick={() => handleRemoveImage('avatar')} disabled={isAvatarUploading} className="p-2 bg-red-100 dark:bg-red-900/30 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50">
                <XMarkIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
            <input type="text" name="username" id="username" defaultValue={currentProfile?.username || ''} required className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-black dark:text-white bg-white dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
            <input type="text" name="displayName" id="displayName" defaultValue={currentProfile?.displayName || ''} className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-black dark:text-white bg-white dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
            <textarea name="bio" id="bio" defaultValue={currentProfile?.bio || ''} rows="4" className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-black dark:text-white bg-white dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500" placeholder="A little about yourself..."></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Background Color</label>
            <div className="mt-1 flex items-center gap-4">
              <div onClick={() => setShowColorPicker(p => !p)} className="w-14 h-10 p-1 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer" style={{ backgroundColor: backgroundColor }}></div>
              <input
                type="text"
                name="profileBackgroundColor"
                value={backgroundColor.toUpperCase()}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-black dark:text-white bg-white dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
              />
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