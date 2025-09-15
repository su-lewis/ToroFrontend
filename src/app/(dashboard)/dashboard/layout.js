import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { fetchProtectedDataFromServer } from '@/lib/server-api';
import DashboardSidebar from '@/components/DashboardSidebar';

export default async function DashboardLayout({ children }) {
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
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/login');
  }
  
  let userProfile = null;
  try {
    userProfile = await fetchProtectedDataFromServer('/users/me');
  } catch (error) {
    if (error.status !== 404) {
      console.error("DashboardLayout: Error fetching user profile:", error.message);
    }
  }
  
  return (
    // --- THIS IS THE FIX ---
    // Add the `overscroll-contain` class to the main layout container.
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100 dark:bg-gray-900 overscroll-contain">
      
      <div className="md:relative md:w-64 md:flex-shrink-0">
        <DashboardSidebar userProfile={userProfile} session={session} />
      </div>
      
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}