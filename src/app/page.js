import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import FaqSection from '@/components/FaqSection';
import Footer from '@/components/Footer';

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

  // Use a <main> tag for the primary content of the page
  return (
    <main className="bg-gray-50 dark:bg-gray-900">
      
      {/* Section 1: Hero */}
      {/* --- THIS IS THE KEY CHANGE --- */}
      {/* We REMOVE min-h-screen and use padding to create the large hero feel. */}
      {/* This section now takes up only as much space as it needs, allowing the page to scroll. */}
      <section id="hero" className="relative flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-800 pt-32 pb-20">
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
            Create a personalized page to share all your important links and allow your audience to support you directly.
          </p>
          <div className="space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="/signup"
              className="inline-block w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg text-lg shadow-md hover:shadow-lg transition duration-200 ease-in-out transform hover:-translate-y-0.5"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="inline-block w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 font-semibold py-3 px-8 rounded-lg text-lg shadow-md hover:shadow-lg transition duration-200 ease-in-out transform hover:-translate-y-0.5"
            >
              Log In
            </Link>
          </div>
        </div>
        
        {/* The scroll-down hint is now more useful than ever */}
        <div className="absolute bottom-10">
          <a href="#faq" aria-label="Scroll to FAQ" className="animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>
      </section>

      {/* Section 2: FAQ Section - This will now be visible on scroll */}
      <FaqSection />

      {/* Section 3: Footer - This will now be visible at the end of the page */}
      <Footer />
    </main>
  );
}