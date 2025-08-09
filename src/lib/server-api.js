// frontend/src/lib/server-api.js
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function fetchProtectedDataFromServer(relativePath, options = {}) {
  const cookieStore = cookies(); 
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set(name, value, opts) { try { cookieStore.set({ name, value, ...opts }); } catch (error) {} },
        remove(name, opts) { try { cookieStore.set({ name, value: '', ...opts }); } catch (error) {} },
      },
    }
  );

  // --- THIS IS THE FIX ---
  // Change from getSession() to getUser().
  // getUser() is more robust as it will try to refresh an expired token.
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  // If getUser() fails or returns no user, the session is truly invalid.
  if (userError || !user) {
    console.warn("[fetchProtectedDataFromServer] Supabase getUser() error or no user:", userError?.message || "No user found");
    const error = new Error('Auth session missing or invalid. Please log in again.');
    error.status = 401; // Unauthorized
    throw error;
  }
  
  // To make an authenticated API call, we need the access token.
  // We get this from getSession() AFTER getUser() has ensured the session is fresh.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
      // This should theoretically not happen if getUser() succeeded, but as a safeguard.
      const error = new Error('Could not retrieve session details after validation.');
      error.status = 401;
      throw error;
  }


  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) {
    const error = new Error('API base URL not configured.');
    error.status = 500;
    throw error;
  }

  const url = `${apiBaseUrl}${relativePath}`; 

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${session.access_token}`, // Use the fresh access token
        'Content-Type': options.headers?.['Content-Type'] || 'application/json',
      },
      cache: 'no-store',
    });
  } catch (networkError) {
      const error = new Error(`Network error calling API: ${networkError.message}`);
      error.status = 503; 
      throw error;
  }

  if (!response.ok) {
    let errorBodyText = `API Error (${response.status}) for ${url}.`;
    let errorJson = null;
    try { 
      const tempBody = await response.text();
      try {
        errorJson = JSON.parse(tempBody);
        errorBodyText = errorJson.message || tempBody.substring(0, 200);
      } catch (parseError) {
        errorBodyText = tempBody.substring(0, 200) || `Status ${response.status}`;
      }
    } catch (e) { /* ignore */ }
    
    const error = new Error(`API call to ${relativePath} failed: ${errorBodyText}`);
    error.status = response.status;
    error.body = errorJson; 
    error.bodyText = errorBodyText; 
    throw error;
  }

  if (response.status === 204) return null;
  
  try {
    return await response.json();
  } catch (jsonError) {
    const error = new Error(`Invalid JSON response from API for ${url}`);
    error.status = 502;
    throw error;
  }
}