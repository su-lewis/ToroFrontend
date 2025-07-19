// frontend/src/app/actions.js
'use server';

import { revalidatePath } from 'next/cache';
// --- FIX: Import the CORRECT function name ---
import { fetchProtectedDataFromServer } from '@/lib/server-api'; 

export async function updateProfile(formData) {
  const profileData = {
    username: formData.get('username'),
    displayName: formData.get('displayName'),
    bio: formData.get('bio'),
    profileImageUrl: formData.get('profileImageUrl'),
    // Add bannerImageUrl and profileBackgroundColor if your form submits them
    bannerImageUrl: formData.get('bannerImageUrl'),
    profileBackgroundColor: formData.get('profileBackgroundColor'),
  };

  try {
    // --- FIX: Call the CORRECT function name ---
    // And use the correct relative path for the API call
    await fetchProtectedDataFromServer('/users/profile', { 
      method: 'POST',
      // headers are handled by fetchProtectedDataFromServer, but Content-Type is good to be explicit
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(profileData),
    });

    // Revalidate paths to show updated data immediately
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/profile');
    if (profileData.username) {
        revalidatePath(`/${profileData.username}`);
    }

    return { success: true, message: 'Profile updated successfully!' };
  } catch (error) {
    console.error("Error in updateProfile action:", error);
    // Use error.bodyText or error.message for better error reporting
    return { success: false, message: error.bodyText || error.message || 'An unknown error occurred.' };
  }
}