// frontend/src/app/actions.js
'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { fetchProtectedDataFromServer } from '@/lib/server-api';

// --- USER PROFILE ACTIONS ---
export async function updateProfile(formData) {
  try {
    const profileData = {
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

// --- AUTH ACTIONS ---
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

    // Since this is a Server Action, it makes a direct `fetch` call to your backend API.
    // This is not an "authenticated" fetch because the donor may not be logged in.
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

export async function getStripeStatus() {
    try {
        const status = await fetchProtectedDataFromServer('/stripe/connect/account-status');
        return { success: true, data: status };
    } catch (error) {
        if (error.status === 404) {
            // This is an expected state for a new user, not a hard error.
            return { success: true, data: null }; 
        }
        return { success: false, message: error.bodyText || error.message || "Failed to get Stripe status." };
    }
}

export async function createStripeOnboardLink() {
    try {
        const response = await fetchProtectedDataFromServer('/stripe/connect/onboard-user', {
            method: 'POST',
            // No body needed for the simplified flow
        });
        if (response.url) {
            return { success: true, url: response.url };
        } else {
            throw new Error("Onboarding URL not found in API response.");
        }
    } catch (error) {
        return { success: false, message: error.bodyText || error.message || 'Failed to start Stripe connection.' };
    }
}

export async function createStripeDashboardLink() {
    try {
        const response = await fetchProtectedDataFromServer('/stripe/create-express-dashboard-link', {
            method: 'POST',
        });
        if (response.url) {
            return { success: true, url: response.url };
        } else {
            throw new Error("Dashboard URL not found in API response.");
        }
    } catch (error) {
        return { success: false, message: error.bodyText || error.message || 'Could not open Stripe dashboard.' };
    }
}

// --- LINK ACTIONS ---
export async function getLinks() {
    try {
        const links = await fetchProtectedDataFromServer('/links');
        return { success: true, data: links };
    } catch (error) {
        return { success: false, message: error.bodyText || error.message || "Failed to fetch links." };
    }
}

export async function saveLinks(linksToSave) {
    try {
        const response = await fetchProtectedDataFromServer('/links/bulk-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ links: linksToSave }),
        });
        revalidatePath('/dashboard/links');
        revalidatePath('/', 'layout'); // Revalidate all public pages to show updated links
        return { success: true, data: response, message: 'Links saved successfully!' };
    } catch (error) {
        return { success: false, message: error.bodyText || error.message || 'Failed to save links.' };
    }
}

// --- PAYMENT ANALYTICS ACTIONS ---
export async function getPaymentStats() {
    try {
        const stats = await fetchProtectedDataFromServer('/payments/stats');
        return { success: true, data: stats };
    } catch (error) {
        return { success: false, message: error.bodyText || error.message || "Failed to fetch payment stats." };
    }
}

export async function getPaymentHistory() {
    try {
        const history = await fetchProtectedDataFromServer('/payments/history');
        return { success: true, data: history };
    } catch (error) {
        return { success: false, message: error.bodyText || error.message || "Failed to fetch payment history." };
    }
}