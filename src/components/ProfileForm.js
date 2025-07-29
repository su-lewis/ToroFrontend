// frontend/src/components/ProfileForm.js
'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { updateProfile } from '@/app/actions'; // Import the server action
import apiClient from '@/lib/api'; // Your client-side Axios API helper
import { supabase } from '@/lib/supabaseClient'; // For client-side uploads
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// This component receives the pre-fetched 'profile' data from its parent Server Component
export default function ProfileForm({ initialData: profile, serverError }) {
  const [error, setError] = useState(serverError?.message || '');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();
  
  // Form state management
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.profileImageUrl || null);
  const [bannerUrl, setBannerUrl] = useState(profile?.bannerImageUrl || null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [selectedBannerFile, setSelectedBannerFile] = useState(null);
  
  const [isInitialDataSet, setIsInitialDataSet] = useState(false);
  const formRef = useRef(null);
  const avatarFileInputRef = useRef(null);
  const bannerFileInputRef = useRef(null);
  const router = useRouter();

  // Initialize form data from profile
  useEffect(() => {
    if (serverError && serverError.status !== 404 && serverError.code !== 'PROFILE_NOT_FOUND') {
      setError(`Error loading profile: ${serverError.message || serverError.bodyText || "Server error"}`);
    }
    if (profile && !isInitialDataSet) {
      setUsername(profile.username || '');
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.profileImageUrl || null);
      setBannerUrl(profile.bannerImageUrl || null);
      setBgColor(profile.profileBackgroundColor || '#FFFFFF');
      setIsInitialDataSet(true);
    } else if (!profile && !serverError && !isInitialDataSet) {
      // New user, profile might be {} if PROFILE_NOT_FOUND was handled in server component
      setIsInitialDataSet(true); 
    }
  }, [profile, serverError, isInitialDataSet]);

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("File is too large (Max 5MB)."); return; }
    if (!file.type.startsWith('image/')) { setError("Invalid file type (Images only)."); return; }
    const previewUrl = URL.createObjectURL(file);
    
    if (type === 'avatar') {
      setSelectedAvatarFile(file);
      setAvatarPreview(previewUrl);
    } else {
      setSelectedBannerFile(file);
      setBannerPreview(previewUrl);
    }
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
    
    // Validate username
    const usernameValue = formData.get('username')?.trim();
    if (!usernameValue) { setError("Username cannot be empty."); return; }
    if (!/^[a-zA-Z0-9_.-]{3,20}$/.test(usernameValue)) { setError("Username: 3-20 chars (letters, numbers, _, ., -)."); return; }
    
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
        // Update local state
        setUsername(actionFormData.get('username') || '');
        setDisplayName(actionFormData.get('displayName') || '');
        setBio(actionFormData.get('bio') || '');
        setBgColor(actionFormData.get('profileBackgroundColor') || '#FFFFFF');
      } else {
        setError(result.message);
      }
    });
  }

  const displayAvatar = avatarPreview || avatarUrl;
  const displayBanner = bannerPreview || bannerUrl;

  if (serverError && !profile && serverError.status !== 404 && serverError.code !== 'PROFILE_NOT_FOUND') {
    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-6 text-red-700">Profile Error</h1>
            <p className="text-red-500 p-3 bg-red-100 rounded text-sm">
                Could not load your profile data: {serverError.message || serverError.bodyText || "An unexpected server error occurred."}
            </p>
             <button onClick={() => router.refresh()} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                Try Again
            </button>
        </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white text-center">
        {profile && profile.username ? 'Edit Your Profile' : 'Create Your Profile'}
      </h1>
      {error && <p className="text-red-500 mb-4 p-3 bg-red-100 rounded text-sm text-center">{error}</p>}
      {success && <p className="text-green-600 mb-4 p-3 bg-green-100 rounded text-sm text-center">{success}</p>}
      
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
        {/* Banner Image Upload Section */}
        <div className="space-y-2">
          <label htmlFor="bannerUploadButton" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Banner Image (Recommended: 1200x400 or similar 3:1 ratio)</label>
          {displayBanner ? (
            <div className="w-full aspect-[3/1] relative rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700">
              <Image src={displayBanner} alt="Banner Preview" fill={true} className="object-cover" key={displayBanner} />
            </div>
          ) : (
            <div className="w-full aspect-[3/1] bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-300 border border-dashed border-gray-300 dark:border-gray-600">
              <span>No banner uploaded</span>
            </div>
          )}
          <input type="file" id="bannerUploadInput" name="bannerFile" accept="image/png, image/jpeg, image/gif, image/webp" onChange={(e) => handleFileChange(e, 'banner')} className="hidden" ref={bannerFileInputRef} />
          <button id="bannerUploadButton" type="button" onClick={() => bannerFileInputRef.current?.click()} disabled={uploading} className="mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
            {uploading ? 'Uploading...' : (bannerUrl || bannerPreview ? 'Change Banner' : 'Upload Banner')}
          </button>
        </div>

        {/* Avatar Upload Section */}
        <div className="flex flex-col items-center space-y-3">
          <label htmlFor="avatarUploadButton" className="block text-sm font-medium text-gray-700 dark:text-gray-300 self-start">Profile Picture</label>
          {displayAvatar ? (
            <Image src={displayAvatar} alt="Profile Avatar Preview" width={128} height={128} className="w-32 h-32 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600 shadow-sm" onError={() => {setAvatarUrl(null); setAvatarPreview(null);}} key={displayAvatar} />
          ) : ( 
            <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-300 text-4xl border-2 border-gray-300 dark:border-gray-600 shadow-sm"> 
              {displayName ? displayName.charAt(0).toUpperCase() : (username ? username.charAt(0).toUpperCase() : '?')} 
            </div> 
          )}
          <input type="file" id="avatarUploadInput" name="avatarFile" accept="image/png, image/jpeg, image/gif, image/webp" onChange={(e) => handleFileChange(e, 'avatar')} className="hidden" ref={avatarFileInputRef} />
          <button id="avatarUploadButton" type="button" onClick={() => avatarFileInputRef.current?.click()} disabled={uploading} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"> 
            {uploading ? 'Uploading...' : (avatarUrl || avatarPreview ? 'Change Avatar' : 'Upload Avatar')}
          </button>
        </div>

        {/* Text Fields and Color Picker */}
        <div className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
              <input 
                type="text" 
                id="username" 
                name="username"
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                minLength="3" 
                maxLength="20" 
                pattern="^[a-zA-Z0-9_.-]+$" 
                title="3-20 chars. Letters, numbers, _, ., -." 
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-black bg-white focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
              <input 
                type="text" 
                id="displayName" 
                name="displayName"
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)} 
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-black bg-white focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
              <textarea 
                id="bio" 
                name="bio"
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                rows="4" 
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-black bg-white focus:ring-blue-500 focus:border-blue-500" 
                placeholder="A little about yourself..."
              ></textarea>
            </div>
        
            {/* Color picker section */}
            <div>
              <label htmlFor="bgColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Background Color</label>
              <div className="mt-1 flex items-center gap-4">
                <input 
                  type="color" 
                  id="bgColor" 
                  name="profileBackgroundColor"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-14 h-10 p-1 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
                />
                <input 
                  type="text"
                  value={bgColor}
                  readOnly
                  className="w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 focus:ring-0 focus:border-gray-300"
                />
              </div>
            </div>
        </div>
        
        <button 
          type="submit" 
          disabled={isPending || uploading} 
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70"
        >
          {(isPending || uploading) ? 'Saving Profile...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}