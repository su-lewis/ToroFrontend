// frontend/src/app/actions.js
'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';

// --- FIX: Import the CORRECTLY NAMED function from your server-api.js file ---
import { fetchProtectedDataFromServer } from '@/lib/server-api'; 

// SERVER ACTION 1: Update User Profile
export async function updateProfile(formData) {
  const profileData = {
    // Get all fields from the FormData object
    username: formData.get('username'),
    displayName: formData.get('displayName'),
    bio: formData.get('bio'),
    profileImageUrl: formData.get('profileImageUrl'),
    bannerImageUrl: formData.get('bannerImageUrl'),
    profileBackgroundColor: formData.get('profileBackgroundColor'),
  };

  try {
    // --- FIX: Call the CORRECTLY NAMED function ---
    // The path '/users/profile' is relative to your API base URL.
    await fetchProtectedDataFromServer('/users/profile', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(profileData),
    });

    // Revalidate paths to show updated data immediately on navigation
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/profile');
    if (profileData.username) {
        revalidatePath(`/${profileData.username}`);
    }

    return { success: true, message: 'Profile updated successfully!' };
  } catch (error) {
    console.error("Error in updateProfile action:", error);
    // Use error.bodyText or error.message for better error reporting from our fetch helper
    return { success: false, message: error.bodyText || error.message || 'An unknown error occurred while saving.' };
  }
}


// SERVER ACTION 2: Handle User Logout
export async function handleLogout() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set(name, value, options) { try { cookieStore.set({ name, value, ...options }); } catch (error) {} },
        remove(name, options) { try { cookieStore.set({ name, value: '', ...options }); } catch (error) {} },
      },
    }
  );
  
  await supabase.auth.signOut();
  
  // Revalidate the root layout to ensure user-specific data is cleared server-side
  revalidatePath('/', 'layout'); 
  
  // Redirect to the login page
  redirect('/login');
}