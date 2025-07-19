// frontend/src/components/ProfileForm.js
'use client';
import { useState, useEffect, useRef, useTransition } from 'react';
import { updateProfile } from '@/app/actions'; // Import the server action
import { supabase } from '@/lib/supabaseClient'; // Import client-side Supabase for uploads
import Image from 'next/image';

export default function ProfileForm({ profile }) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  // State to hold the final image URLs
  const [avatarUrl, setAvatarUrl] = useState(profile?.profileImageUrl || null);
  const [bannerUrl, setBannerUrl] = useState(profile?.bannerImageUrl || null);
  
  // State for image previews
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    // This helps reset the URLs if the initial profile prop changes.
    setAvatarUrl(profile?.profileImageUrl || null);
    setBannerUrl(profile?.bannerImageUrl || null);
  }, [profile]);
  
  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // ... (Add your file validation for size/type here if you want)
    const previewUrl = URL.createObjectURL(file);
    if (type === 'avatar') {
      setAvatarPreview(previewUrl);
    } else {
      setBannerPreview(previewUrl);
    }
  };

  async function handleFormSubmit(formData) {
    setError(''); setSuccess('');
    setUploading(true); // Show a general loading state for uploads

    const avatarFile = formData.get('avatarFile');
    const bannerFile = formData.get('bannerFile');
    
    let finalAvatarUrl = avatarUrl;
    let finalBannerUrl = bannerUrl;

    try {
      // --- Step 1: Handle File Uploads (if any) ---
      if (avatarFile && avatarFile.size > 0) {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session.user.id;
        const filePath = `${userId}/avatar/${Date.now()}_${avatarFile.name}`;
        const { data, error } = await supabase.storage.from('avatars').upload(filePath, avatarFile);
        if (error) throw new Error(`Avatar upload failed: ${error.message}`);
        finalAvatarUrl = supabase.storage.from('avatars').getPublicUrl(data.path).data.publicUrl;
        setAvatarUrl(finalAvatarUrl); // Update state for UI
        setAvatarPreview(null); // Clear preview
      }
      if (bannerFile && bannerFile.size > 0) {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session.user.id;
        const filePath = `${userId}/banner/${Date.now()}_${bannerFile.name}`;
        const { data, error } = await supabase.storage.from('avatars').upload(filePath, bannerFile);
        if (error) throw new Error(`Banner upload failed: ${error.message}`);
        finalBannerUrl = supabase.storage.from('avatars').getPublicUrl(data.path).data.publicUrl;
        setBannerUrl(finalBannerUrl); // Update state for UI
        setBannerPreview(null); // Clear preview
      }
    } catch (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return; // Stop if uploads fail
    }
    
    setUploading(false); // Finished uploading

    // --- Step 2: Submit Text Data + New URLs via Server Action ---
    // We create a new FormData object to pass to the server action
    const actionFormData = new FormData(formRef.current);
    actionFormData.set('profileImageUrl', finalAvatarUrl || ''); // Use the new or existing URL
    actionFormData.set('bannerImageUrl', finalBannerUrl || '');   // Use the new or existing URL
    
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
    <form ref={formRef} action={handleFormSubmit} className="space-y-8 ...">
      {/* ... (success/error messages) ... */}
      
      {/* Banner Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image</label>
        <div className="w-full h-48 rounded-lg bg-gray-200 relative ...">
          {(bannerPreview || bannerUrl) && <Image src={bannerPreview || bannerUrl} alt="Banner Preview" layout="fill" className="object-cover rounded-lg" />}
          <input type="file" name="bannerFile" onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" className="..." />
          {/* You'd style the input or use a button to trigger it */}
        </div>
      </div>

      {/* Avatar Upload */}
      <div className="flex flex-col items-center space-y-4">
        {(avatarPreview || avatarUrl) ? (
          <Image src={avatarPreview || avatarUrl} alt="Avatar Preview" width={128} height={128} className="..." />
        ) : ( <div className="w-32 h-32 rounded-full bg-gray-200 ...">?</div> )}
        <input type="file" name="avatarFile" onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" className="..." />
      </div>

      {/* ... (inputs for color, username, displayName, bio using `defaultValue` and `name`) ... */}
      <div>
        <label htmlFor="bgColor">Profile Background Color</label>
        <input type="color" name="profileBackgroundColor" id="bgColor" defaultValue={profile?.profileBackgroundColor || '#FFFFFF'} />
      </div>
      <div>
        <label htmlFor="username">Username</label>
        <input type="text" name="username" id="username" defaultValue={profile?.username || ''} required />
      </div>
      {/* ... etc for displayName and bio ... */}

      <button type="submit" disabled={isPending || uploading} className="...">
        {isPending || uploading ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
}