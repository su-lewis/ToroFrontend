// frontend/src/app/actions.js
'use server';
import { revalidatePath } from 'next/cache';
import { fetchProtectedDataFromServer } from '@/lib/server-api';

export async function updateProfile(formData) {
  const profileData = {
    username: formData.get('username'),
    displayName: formData.get('displayName'),
    bio: formData.get('bio'),
    profileImageUrl: formData.get('profileImageUrl'), // Now gets the URL from the modified form data
    bannerImageUrl: formData.get('bannerImageUrl'),   // Now gets the URL from the modified form data
    profileBackgroundColor: formData.get('profileBackgroundColor'),
  };
  
  try {
    // Call your backend API to save the data
    await fetchProtectedDataFromServer('/users/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    
    revalidatePath('/dashboard/profile');
    if (profileData.username) revalidatePath(`/${profileData.username}`);
    
    return { success: true, message: 'Profile updated successfully!' };
  } catch (error) {
    console.error("Error in updateProfile action:", error);
    return { success: false, message: error.bodyText || error.message || 'An unknown error occurred.' };
  }
}