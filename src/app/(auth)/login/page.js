// frontend/src/app/(auth)/login/page.js
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/LoginForm'; // Import the client component

export default async function LoginPageServerWrapper() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        // We only need 'get' for getSession, but it's good practice to have all
        set(name, value, options) { try { cookieStore.set({ name, value, ...options }); } catch (error) {} },
        remove(name, options) { try { cookieStore.set({ name, value: '', ...options }); } catch (error) {} },
      },
    }
  );

  // Check for an active session on the server
  const { data: { session } } = await supabase.auth.getSession();

  // If a session exists, the user is already logged in. Redirect them away from the login page.
  if (session) {
    redirect('/dashboard');
  }

  // If no session, render the LoginForm client component.
  return <LoginForm />;
}