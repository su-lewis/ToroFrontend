// frontend/src/app/actions.js
'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { fetchProtectedDataFromServer } from '@/lib/server-api'; // For calling your backend from a server context

// --- USER PROFILE ACTIONS ---
export async function updateProfile(formData) {
  const profileData = {
    username: formData.get('username'),
    displayName: formData.get('displayName'),
    bio: formData.get('bio'),
    profileImageUrl: formData.get('profileImageUrl'),
    bannerImageUrl: formData.get('bannerImageUrl'),
    profileBackgroundColor: formData.get('profileBackgroundColor'),
  };
  try {
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

// --- AUTH ACTIONS ---
export async function handleLogout() {
  const cookieStore = cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies: { get(name) { return cookieStore.get(name)?.value; }, set(name, value, options) { try { cookieStore.set({ name, value, ...options }); } catch (error) {} }, remove(name, options) { try { cookieStore.set({ name, value: '', ...options }); } catch (error) {} } } });
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

// --- STRIPE & PAYMENT ACTIONS ---
export async function createCheckoutSession(formData) {
  try {
    const tipData = {
      amount: parseFloat(formData.get('amount')),
      recipientUsername: formData.get('recipientUsername'),
      donorName: formData.get('donorName'),
    };
    if (isNaN(tipData.amount) || !tipData.recipientUsername) {
      return { success: false, message: 'Invalid data provided for tip.' };
    }
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const url = `${apiBaseUrl}/stripe/create-checkout-session`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tipData),
      cache: 'no-store',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create checkout session.' }));
      return { success: false, message: errorData.message || 'Could not initiate payment.' };
    }
    const session = await response.json();
    if (!session.id) {
      return { success: false, message: 'Invalid session data received from server.' };
    }
    return { success: true, sessionId: session.id };
  } catch (error) {
    console.error("Error in createCheckoutSession action:", error);
    return { success: false, message: 'An unexpected server error occurred.' };
  }
}

export async function createStripeOnboardLink() {
    try {
        const response = await fetchProtectedDataFromServer('/stripe/connect/onboard-user', {
            method: 'POST',
            // No body needed for the simplified flow
        });
        // The fetch helper returns parsed JSON
        if (response.url) {
            return { success: true, url: response.url };
        } else {
            throw new Error("Onboarding URL not found in response.");
        }
    } catch (error) {
        console.error("Error in createStripeOnboardLink action:", error);
        return { success: false, message: error.bodyText || error.message || 'Failed to start Stripe connection.' };
    }
}

// --- LINK ACTIONS ---
export async function saveLinks(linksToSave) {
    try {
        await fetchProtectedDataFromServer('/links/bulk-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ links: linksToSave }),
        });
        revalidatePath('/dashboard/links');
        // Also revalidate the public profile page
        // We need the username, which isn't available here directly.
        // A better approach might be to revalidate the layout.
        revalidatePath('/', 'layout');
        return { success: true, message: 'Links saved successfully!' };
    } catch (error) {
        console.error("Error in saveLinks action:", error);
        return { success: false, message: error.bodyText || error.message || 'Failed to save links.' };
    }
}