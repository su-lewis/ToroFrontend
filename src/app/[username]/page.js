// frontend/src/app/[username]/page.js
import { notFound } from 'next/navigation';
import Image from 'next/image';
import SendTipButton from '@/components/SendTipButton';
import ThemeSwitcher from '@/components/ThemeSwitcher';

// Data fetching function (no changes needed)
async function getPublicProfileData(username) {
  if (typeof username !== 'string' || !username) return null;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) { console.error("CRITICAL: NEXT_PUBLIC_API_BASE_URL is not defined."); return null; }
  const apiUrl = `${apiBaseUrl}/public/profile/${username}`;
  try {
    const res = await fetch(apiUrl, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error(`CATCH in getPublicProfileData for ${username}:`, error.message);
    return null;
  }
}

export default async function PublicProfilePage({ params, searchParams }) {
  const username = params.username;
  const profileData = await getPublicProfileData(username);
  const paymentCancelled = searchParams?.payment_cancelled === 'true';

  if (!profileData) {
    notFound();
  }

  // --- THIS IS THE FIX (Part 1) ---
  // Destructure the new currency fields from the data fetched from your API.
  const {
    displayName = username, 
    bio = "", 
    profileImageUrl, 
    bannerImageUrl,
    links = [], 
    stripeAccountId, 
    stripeOnboardingComplete,
    profileBackgroundColor = '#F3F4F6',
    payoutsInUsd,             // <-- The new boolean field
    stripeDefaultCurrency,    // <-- The creator's native currency
  } = profileData;


  const pageStyle = { backgroundColor: profileBackgroundColor };
  const isBgDark = () => {
    if (!profileBackgroundColor) return false;
    const color = profileBackgroundColor.substring(1);
    const rgb = parseInt(color, 16);
    const r = (rgb >> 16) & 0xff, g = (rgb >> 8) & 0xff, b = (rgb >> 0) & 0xff;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 140;
  };
  const textColorClass = isBgDark() ? 'text-gray-100' : 'text-gray-800';
  const subTextColorClass = isBgDark() ? 'text-gray-300' : 'text-gray-600';

  return (
    <main style={pageStyle} className="min-h-screen transition-colors duration-500">
      <div className="container mx-auto max-w-3xl flex flex-col items-center pb-12">
        
        <div className="w-full h-48 md:h-64 lg:h-72 relative shadow-lg bg-gray-300">
          {bannerImageUrl && <Image src={bannerImageUrl} alt={`${displayName}'s banner`} layout="fill" className="object-cover" priority={true} />}
        </div>

        <div className="w-full max-w-2xl bg-white dark:bg-gray-800 p-6 md:p-8 shadow-xl relative z-10 -mt-16 md:-mt-20 rounded-lg mx-4 sm:mx-0">
          {/* Theme Switcher in top left corner */}
          <div className="absolute top-3 left-3">
            <ThemeSwitcher />
          </div>
          
          <div className="flex justify-center -mt-20 md:-mt-24 mb-4">
            {profileImageUrl ? (
              <Image src={profileImageUrl} alt={`Profile picture of ${displayName}`} width={160} height={160} className="rounded-full w-32 h-32 md:w-40 md:h-40 object-cover border-4 border-white dark:border-gray-700 shadow-2xl bg-gray-200" priority />
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-5xl md:text-6xl font-semibold shadow-2xl border-4 border-white dark:border-gray-700">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {paymentCancelled && (
            <div role="alert" className="mb-6 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 rounded-md text-sm text-center">
              <p className="font-semibold">Payment Cancelled.</p>
            </div>
          )}

          <div className="text-center text-gray-900 dark:text-gray-100">
            <h1 className="text-3xl md:text-4xl font-extrabold mt-2 mb-1">{displayName}</h1>
            {profileData.displayName && <p className="text-lg text-gray-500 dark:text-gray-400 mb-3">@{username}</p>}
            {bio && <p className="text-md text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg mx-auto mb-6">{bio}</p>}
          </div>

          <div className="mb-8">
            {stripeAccountId && stripeOnboardingComplete ? ( 
              // --- THIS IS THE FIX (Part 2) ---
              // Pass the new currency props to the SendTipButton component.
              <SendTipButton 
                recipientUsername={username} 
                recipientDisplayName={displayName}
                payoutsInUsd={payoutsInUsd}
                stripeDefaultCurrency={stripeDefaultCurrency}
              />
            ) : ( 
              profileData && 
              <div className="mt-6 p-3 rounded-md shadow text-center text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {displayName} is not set up to receive payments.
              </div> 
            )}
          </div>


          {/* Links Section */}
          <div className="w-full">
            {links.length > 0 && (<h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 text-center">Links</h2>)}
            <div className="space-y-4">
              {links.length > 0 ? (
                links.map((link) => (
                  <a key={link.id} href={link.url.startsWith('http') ? link.url : `//${link.url}`} target="_blank" rel="noopener noreferrer nofollow"
                    className="block w-full text-center font-semibold py-3 px-5 rounded-lg text-lg shadow-md hover:shadow-lg transition-all bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {link.title}
                  </a>
                ))
              ) : ( <p className="italic py-3 text-center text-gray-500 dark:text-gray-400">This user hasn't added any links yet.</p> )}
            </div>
          </div>
          
        </div>
      </div>
    </main>
  );
}

export async function generateMetadata({ params }) { /* ... same as before ... */ }