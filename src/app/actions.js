// frontend/src/app/actions.js
'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { fetchProtectedDataFromServer } from '@/lib/server-api';

// SERVER ACTION 1: Update User Profile
export async function updateProfile(formData) {
  try {
    const profileData = {
      // Get all fields from the FormData object passed from the client form
      username: formData.get('username'),
      displayName: formData.get('displayName'),
      bio: formData.get('bio'),
      profileImageUrl: formData.get('profileImageUrl'),
      bannerImageUrl: formData.get('bannerImageUrl'),
      profileBackgroundColor: formData.get('profileBackgroundColor'),
    };

    // Use the server-side fetch helper to securely call your backend API
    await fetchProtectedDataFromServer('/users/profile', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(profileData),
    });

    // Invalidate caches for relevant pages so they refetch with new data on next visit
    revalidatePath('/dashboard/profile');
    if (profileData.username) {
        revalidatePath(`/${profileData.username}`);
    }

    return { success: true, message: 'Profile updated successfully!' };
  } catch (error) {
    console.error("Error in updateProfile server action:", error);
    // Return a user-friendly error message from the caught error
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
  revalidatePath('/', 'layout'); // Revalidate all pages to clear user-specific server component data
  redirect('/login');
}

// SERVER ACTION 3: Create Stripe Checkout Session for Tipping
export async function createCheckoutSession(formData) {
  try {
    // This action can be called by anyone (not just logged-in users),
    // so we don't need a session check here.
    const tipData = {
      amount: parseFloat(formData.get('amount')),
      recipientUsername: formData.get('recipientUsername'),
      donorName: formData.get('donorName'),
    };

    if (isNaN(tipData.amount) || !tipData.recipientUsername) {
      return { success: false, message: 'Invalid data provided for tip.' };
    }

    // Since this is a Server Action running on the Next.js server,
    // it makes a direct `fetch` call to your backend API.
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL; // e.g., http://localhost:3001/api
    const url = `${apiBaseUrl}/stripe/create-checkout-session`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tipData),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create checkout session.' }));
      console.error("Server Action: API error creating checkout session:", errorData);
      return { success: false, message: errorData.message || 'Could not initiate payment.' };
    }

    const session = await response.json();
    if (!session.id) {
      return { success: false, message: 'Invalid session data received from server.' };
    }

    // The Server Action returns the session ID to the client component.
    return { success: true, sessionId: session.id };
    
  } catch (error) {
    console.error("Error in createCheckoutSession action:", error);
    return { success: false, message: 'An unexpected server error occurred.' };
  }
}