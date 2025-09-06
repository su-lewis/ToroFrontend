import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import Link from 'next/link';
// We are NOT importing FaqSection or Footer for this test

export default async function HomePage() {
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

  return (
    <main>
      {/* Section 1: Hero (Simplified for the test) */}
      <div className="h-screen flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-800">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
              Tribute
            </span>
            {' '}
            <span className="dark:text-white text-gray-800">
              Toro
            </span>
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-10">
            This is the hero section. Scroll down to see the test box.
          </p>
        </div>
      </div>

      {/* --- THIS IS THE DIAGNOSTIC TEST --- */}
      {/* A giant, 1000px tall, bright red box. */}
      {/* If you can scroll and see this, the layout is fine and the components are the problem. */}
      {/* If you CANNOT scroll to see this, the layout/CSS is fundamentally broken. */}
      <div className="h-[1000px] bg-red-500 flex items-center justify-center">
        <h1 className="text-white text-4xl font-bold">
          IF YOU CAN SEE THIS, THE SCROLLING WORKS.
        </h1>
      </div>
    </main>
  );
}