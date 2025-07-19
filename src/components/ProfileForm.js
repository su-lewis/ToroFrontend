// frontend/src/components/ProfileForm.js
'use client';

import { useState, useEffect, useRef } from 'react';
import apiClient from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function ProfileForm({ initialData, serverError }) {
  // Form State
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profileBackgroundColor, setProfileBackgroundColor] = useState('#FFFFFF');
  
  // Image State
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(null);
  const [currentBannerUrl, setCurrentBannerUrl] = useState(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState(null);
  const [selectedBannerFile, setSelectedBannerFile] = useState(null);
  const [previewBannerUrl, setPreviewBannerUrl] = useState(null);
  
  // Control State
  const [isInitialDataSet, setIsInitialDataSet] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (serverError && serverError.status !== 404) {
      setFormError(`Error loading profile: ${serverError.message || "Server error"}`);
    }
    if (initialData && !isInitialDataSet) {
      setUsername(initialData.username || '');
      setDisplayName(initialData.displayName || '');
      setBio(initialData.bio || '');
      setCurrentAvatarUrl(initialData.profileImageUrl || null);
      setCurrentBannerUrl(initialData.bannerImageUrl || null);
      setProfileBackgroundColor(initialData.profileBackgroundColor || '#FFFFFF');
      setIsInitialDataSet(true);
    } else if (!initialData && !serverError && !isInitialDataSet) {
      setIsInitialDataSet(true); 
    }
  }, [initialData, serverError, isInitialDataSet]);

  const createChangeHandler = (setter, previewSetter) => (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setFormError("File is too large. Maximum 5MB.");
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        setFormError("Invalid file type. Please select an image.");
        return;
      }
      setter(file);
      previewSetter(URL.createObjectURL(file));
      setFormError(null);
    }
  };

  const handleAvatarChange = createChangeHandler(setSelectedAvatarFile, setPreviewAvatarUrl);
  const handleBannerChange = createChangeHandler(setSelectedBannerFile, setPreviewBannerUrl);
  
  const uploadFile = async (file, bucketName) => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) throw new Error("User not authenticated for upload.");
    const userId = sessionData.session.user.id;
    const folder = bucketName === 'avatars' ? userId : `${userId}/banner`;
    const fileName = `${folder}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(uploadData.path);
    if (!urlData?.publicUrl) throw new Error("Could not get public URL for uploaded image.");
    return urlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true); setFormError(null); setFormSuccess(null);
    if (!username.trim() || !/^[a-zA-Z0-9_.-]{3,20}$/.test(username.trim())) {
        setFormError("Username must be 3-20 valid characters."); setFormLoading(false); return;
    }

    let uploadedAvatarUrl = currentAvatarUrl;
    let uploadedBannerUrl = currentBannerUrl;

    try {
      if (selectedAvatarFile) {
        uploadedAvatarUrl = await uploadFile(selectedAvatarFile, 'avatars');
      }
      if (selectedBannerFile) {
        uploadedBannerUrl = await uploadFile(selectedBannerFile, 'avatars'); // Still 'avatars' bucket
      }
      
      const profilePayload = {
        username: username.trim(),
        displayName: displayName.trim(),
        bio: bio.trim(),
        profileImageUrl: uploadedAvatarUrl,
        bannerImageUrl: uploadedBannerUrl,
        profileBackgroundColor: profileBackgroundColor,
      };
      
      const response = await apiClient.post('/users/profile', profilePayload);
      setFormSuccess('Profile saved successfully!');
      
      if (response.data) {
          setUsername(response.data.username || '');
          setDisplayName(response.data.displayName || '');
          setBio(response.data.bio || '');
          setCurrentAvatarUrl(response.data.profileImageUrl || null);
          setCurrentBannerUrl(response.data.bannerImageUrl || null);
          setProfileBackgroundColor(response.data.profileBackgroundColor || '#FFFFFF');
          // Clear previews after successful save
          setPreviewAvatarUrl(null);
          setPreviewBannerUrl(null);
          setSelectedAvatarFile(null);
          setSelectedBannerFile(null);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'An error occurred.');
    } finally {
      setFormLoading(false);
    }
  };

  const currentDisplayAvatar = previewAvatarUrl || currentAvatarUrl;
  const currentDisplayBanner = previewBannerUrl || currentBannerUrl;

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 text-center">
        {initialData && initialData.username ? 'Edit Your Profile' : 'Create Your Profile'}
      </h1>
      {formError && <p className="text-red-500 mb-4 p-3 bg-red-100 rounded text-sm text-center">{formError}</p>}
      {formSuccess && <p className="text-green-600 mb-4 p-3 bg-green-100 rounded text-sm text-center">{formSuccess}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Banner Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image</label>
          <div className="w-full h-48 rounded-lg bg-gray-200 relative flex items-center justify-center border-2 border-dashed">
            {currentDisplayBanner && <Image src={currentDisplayBanner} alt="Banner Preview" layout="fill" className="object-cover rounded-lg" key={currentDisplayBanner}/>}
            <button type="button" onClick={() => bannerInputRef.current?.click()} className="z-10 bg-white bg-opacity-70 hover:bg-opacity-90 text-black font-semibold py-2 px-4 rounded-lg shadow-md transition-all">Change Banner</button>
            <input type="file" ref={bannerInputRef} onChange={handleBannerChange} accept="image/*" className="hidden"/>
          </div>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-4">
          {currentDisplayAvatar ? (
            <Image src={currentDisplayAvatar} alt="Profile Avatar Preview" width={128} height={128} className="w-32 h-32 rounded-full object-cover border-2 border-gray-300 shadow-sm" key={currentDisplayAvatar}/>
          ) : ( <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-4xl border-2 border-gray-300 shadow-sm">?</div> )}
          <button type="button" onClick={() => avatarInputRef.current?.click()} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Change Avatar</button>
          <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden"/>
        </div>

        {/* Text Fields Section */}
        <div className="space-y-6">
          <div>
            <label htmlFor="bgColor" className="block text-sm font-medium text-gray-700">Profile Background Color</label>
            <div className="mt-1 flex items-center gap-4">
              <input type="color" id="bgColor" value={profileBackgroundColor} onChange={(e) => setProfileBackgroundColor(e.target.value)} className="w-12 h-10 p-1 border border-gray-300 rounded-md cursor-pointer"/>
              <input type="text" value={profileBackgroundColor} onChange={(e) => setProfileBackgroundColor(e.target.value)} placeholder="#FFFFFF" className="flex-grow px-3 py-2 border border-gray-300 rounded-md text-black"/>
            </div>
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required minLength="3" maxLength="20" pattern="^[a-zA-Z0-9_.-]+$" title="3-20 characters. Letters, numbers, _, ., -." className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-black"/>
          </div>
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">Display Name</label>
            <input type="text" id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-black"/>
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows="4" className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-black" placeholder="A little about yourself..."></textarea>
          </div>
        </div>

        <button type="submit" disabled={formLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70">
          {formLoading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}