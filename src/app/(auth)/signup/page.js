// frontend/src/app/(auth)/signup/page.js
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import SignUpForm from '@/components/SignUpForm';

export default async function SignUpPageServerWrapper() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
      },
    }
  );
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    redirect('/dashboard');
  }
  
  return <SignUpForm />;
}