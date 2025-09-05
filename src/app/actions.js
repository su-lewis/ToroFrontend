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
    await fetchProtectedDataFromServer('/users/profile', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(profileData),
    });
    revalidatePath('/dashboard/profile');
    if (profileData.username) {
        revalidatePath(`/${profileData.username}`);
    }
    return { success: true, message: 'Profile updated successfully!' };
  } catch (error) {
    console.error("Error in updateProfile action:", error);
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
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function updateUserPassword(formData) {
    try {
        const payload = {
            currentPassword: formData.get('currentPassword'),
            newPassword: formData.get('newPassword'),
        };
        // This is an authenticated call to our custom backend route
        const response = await fetchProtectedDataFromServer('/users/update-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return { success: true, message: response.message };
    } catch (error) {
        // The error from fetchProtectedDataFromServer will have a bodyText property
        return { success: false, message: error.bodyText || error.message || "Failed to update password." };
    }
}

export async function updateUserEmail(formData) {
    try {
        const payload = {
            currentPassword: formData.get('currentPassword'),
            newEmail: formData.get('newEmail'),
        };
        const response = await fetchProtectedDataFromServer('/users/update-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return { success: true, message: response.message };
    } catch (error) {
        return { success: false, message: error.bodyText || error.message || "Failed to update email." };
    }
}

export async function sendPasswordReset(formData) {
    const email = formData.get('email');
    if (!email) {
        return { success: false, message: "Email is required." };
    }
    
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
    );

    const redirectTo = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}/auth/reset-password`
        : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`;
    
    // console.log("Sending password reset email. Redirecting to:", redirectTo);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
    });

    if (error) {
        console.error("Password reset error:", error);
        return { success: false, message: "Could not send password reset email. Please try again." };
    }
    
    return { success: true, message: "If an account with this email exists, a password reset link has been sent." };
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
      const errorData = await response.json().catch(() => ({}));
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

export async function getStripeStatus() {
    try {
        const status = await fetchProtectedDataFromServer('/stripe/connect/account-status');
        return { success: true, data: status };
    } catch (error) {
        if (error.status === 404) { return { success: true, data: null }; }
        return { success: false, message: error.bodyText || error.message || "Failed to get Stripe status." };
    }
}

// --- MODIFY THIS ACTION ---
export async function createStripeOnboardLink(formData) { // <-- It now accepts formData
    try {
        const country = formData.get('country'); // <-- Get the country from the form data
        if (!country) {
            return { success: false, message: 'Country selection is required.' };
        }

        const response = await fetchProtectedDataFromServer('/stripe/connect/onboard-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ country: country }), // <-- Pass the country in the body
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
        if (response.url) { return { success: true, url: response.url }; } 
        else { throw new Error("Dashboard URL not found in API response."); }
    } catch (error) {
        return { success: false, message: error.bodyText || error.message || 'Could not open Stripe dashboard.' };
    }
}

export async function triggerInstantPayout() {
    try {
        const response = await fetchProtectedDataFromServer('/stripe/payouts/instant', {
            method: 'POST',
        });
        return { success: true, data: response };
    } catch (error) {
        return { success: false, message: error.bodyText || error.message || "Failed to trigger instant payout." };
    }
}


// --- ACTION #1: For the Payment Currency Toggle ---
export async function updateUserPayoutsInUsd(enabled) {
  if (typeof enabled !== 'boolean') {
    return { success: false, message: 'Invalid value for payout setting.' };
  }
  try {
    await fetchProtectedDataFromServer('/users/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payoutsInUsd: enabled }),
    });
    revalidatePath('/dashboard/payments');
    return { success: true, message: `Payment currency set to ${enabled ? 'USD' : 'Native Currency'}.` };
  } catch (error) {
    return { success: false, message: error.bodyText || 'Failed to update currency preference.' };
  }
}

// --- ACTION #2: For the Payout Schedule Toggle ---
export async function setInstantPayoutMode(enabled) {
  if (typeof enabled !== 'boolean') {
    return { success: false, message: 'Invalid value.' };
  }
  try {
    await fetchProtectedDataFromServer('/stripe/payouts/toggle-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instantPayoutsEnabled: enabled }),
    });
    revalidatePath('/dashboard/payments');
    return { success: true, message: 'Payout mode updated.' };
  } catch (error) {
    return { success: false, message: error.bodyText || 'Failed to update payout mode.' };
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
        revalidatePath('/', 'layout');
        return { success: true, data: response, message: 'Links saved successfully!' };
    } catch (error) {
        return { success: false, message: error.bodyText || error.message || 'Failed to save links.' };
    }
}

// --- PAYMENT ANALYTICS & USER SETTINGS ACTIONS ---
export async function getPaymentStats(period, currency) {
    try {
        const stats = await fetchProtectedDataFromServer(`/payments/stats?period=${period}&currency=${currency}`);
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

export async function getUserSettings() {
    try {
        const user = await fetchProtectedDataFromServer('/users/me');
        return { success: true, data: user };
    } catch (error) {
        return { 
            success: false, 
            message: error.bodyText || error.message || "Failed to fetch user settings.",
            status: error.status
        };
    }
}

export async function getStripeBalance() {
    try {
        const balance = await fetchProtectedDataFromServer('/stripe/balance');
        return { success: true, data: balance };
    } catch (error) {
        if (error.status === 404) {
            return { success: true, data: null };
        }
        return { success: false, message: error.bodyText || error.message || "Failed to fetch Stripe balance." };
    }
}

export async function getUnifiedHistory() {
    try {
        // Note: This now calls the new unified endpoint in payments.js
        const history = await fetchProtectedDataFromServer('/payments/history');
        return { success: true, data: history };
    } catch (error) {
        return { success: false, message: error.bodyText || error.message || "Failed to fetch transaction history." };
    }
}