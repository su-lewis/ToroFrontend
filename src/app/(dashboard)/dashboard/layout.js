import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { fetchProtectedDataFromServer } from '@/lib/server-api';
// --- THIS IS THE FIX ---
// Import the new sidebar component
import DashboardSidebar from '@/components/DashboardSidebar';

export default async function DashboardLayout({ children }) {
  // All this server-side data fetching and session checking remains here
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { get(name) { return cookieStore.get(name)?.value; }, set(name, value, options) { try { cookieStore.set({ name, value, ...options }); } catch (error) {} }, remove(name, options) { try { cookieStore.set({ name, value: '', ...options }); } catch (error) {} }, } }
  );
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { redirect('/login'); }
  
  let userProfile = null;
  try {
    userProfile = await fetchProtectedDataFromServer('/users/me');
  } catch (error) {
    if (error.status !== 404) { console.error("DashboardLayout: Error fetching user profile:", error.message); }
  }
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100 dark:bg-gray-900">
      
      {/* --- THIS IS THE FIX --- */}
      {/* Replace the entire <aside> block with the new component, passing data as props */}
      <DashboardSidebar userProfile={userProfile} session={session} />
      
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}