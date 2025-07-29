// frontend/src/components/ProfileForm.js
'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { updateProfile } from '@/app/actions';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

export default function ProfileForm({ initialData: profile, serverError }) {
  const [error, setError] = useState(serverError?.message || '');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  
  // State for form fields, controlled to sync color picker and text input
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profileBackgroundColor, setProfileBackgroundColor] = useState('#FFFFFF');

  // State for image URLs and previews
  const [avatarUrl, setAvatarUrl] = useState(profile?.profileImageUrl || null);
  const [bannerUrl, setBannerUrl] = useState(profile?.bannerImageUrl || null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  
  const formRef = useRef(null);
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  
  useEffect(() => {
    // Populate state from initial server-fetched data
    if (profile) {
      setUsername(profile.username || '');
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.profileImageUrl || null);
      setBannerUrl(profile.bannerImageUrl || null);
      setProfileBackgroundColor(profile.profileBackgroundColor || '#0D1117'); // Default to a dark color
    }
  }, [profile]);

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
    
    const actionFormData = new FormData();
    actionFormData.append('username', username);
    actionFormData.append('displayName', displayName);
    actionFormData.append('bio', bio);
    actionFormData.append('profileBackgroundColor', profileBackgroundColor);
    actionFormData.append('profileImageUrl', finalAvatarUrl || '');
    actionFormData.append('bannerImageUrl', finalBannerUrl || '');
    
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

  const displayAvatar = avatarPreview || avatarUrl;
  const displayBanner = bannerPreview || bannerUrl;

  return (
    // Form container with the dark background from your screenshot
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl w-full mx-auto bg-[#161b22] border border-gray-700 text-white p-8 rounded-xl">
      <h2 className="text-2xl font-bold text-center text-gray-100">
        Edit Your Profile
      </h2>
      {error && <div className="p-3 text-center bg-red-900/50 border border-red-700 text-red-300 rounded-md">{error}</div>}
      {success && <div className="p-3 text-center bg-green-900/50 border border-green-700 text-green-300 rounded-md">{success}</div>}
      
      {/* Banner Upload UI */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">Banner Image (Recommended: 1200x400)</label>
        <div className="w-full aspect-[3/1] rounded-lg bg-gray-700/50 relative flex items-center justify-center border border-dashed border-gray-600">
          {displayBanner && <Image src={displayBanner} alt="Banner Preview" layout="fill" className="object-cover rounded-lg" />}
        </div>
        <input type="file" name="bannerFile" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" className="hidden" />
        <button type="button" onClick={() => bannerInputRef.current?.click()} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-md text-sm font-medium text-gray-300">
            {uploading ? 'Uploading...' : 'Change Banner'}
        </button>
      </div>
      
      {/* Avatar Upload UI */}
      <div className="flex flex-col items-center space-y-3">
          <label className="block text-sm font-medium text-gray-300 self-center">Profile Picture</label>
          <div className="relative w-32 h-32">
              {displayAvatar ? (
              <Image src={displayAvatar} alt="Avatar Preview" width={128} height={128} className="w-32 h-32 rounded-full object-cover border-2 border-gray-600 shadow-sm" />
              ) : ( <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center text-gray-500 text-4xl border-2 border-gray-600 shadow-sm">?</div> )}
          </div>
           <button type="button" onClick={() => avatarInputRef.current?.click()} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-md text-sm font-medium text-gray-300">
              {uploading ? 'Uploading...' : 'Change Avatar'}
            </button>
          <input type="file" name="avatarFile" id="avatarFile" onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" className="hidden" />
      </div>

      {/* Text Fields and Color Picker */}
      <div className="space-y-6">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-300">Username</label>
          <input type="text" name="username" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required 
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black bg-white" />
        </div>
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-300">Display Name</label>
          <input type="text" name="displayName" id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} 
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black bg-white" />
        </div>
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-300">Bio</label>
          <textarea name="bio" id="bio" rows="3" value={bio} onChange={(e) => setBio(e.target.value)} 
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black bg-white"></textarea>
        </div>
        <div>
          <label htmlFor="bgColor" className="block text-sm font-medium text-gray-300">Profile Background Color</label>
          <div className="mt-1 flex items-center gap-4">
            <input type="color" name="profileBackgroundColor" id="bgColor" value={profileBackgroundColor} onChange={(e) => setProfileBackgroundColor(e.target.value)} 
                   className="w-12 h-10 p-1 border-gray-600 rounded-md cursor-pointer"/>
            <input type="text" value={profileBackgroundColor} onChange={(e) => setProfileBackgroundColor(e.target.value)}
                   className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black bg-white"/>
          </div>
        </div>
      </div>
      
      <div>
        <button
          type="submit"
          disabled={isPending || uploading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400/50"
        >
          {(isPending || uploading) ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}