import { notFound } from 'next/navigation';
import Image from 'next/image';
import SendTipButton from '@/components/SendTipButton';

// The getPublicProfileData function remains the same.
async function getPublicProfileData(username) {
  if (typeof username !== 'string' || !username) {
    return null;
  }
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) {
    console.error("[FRONTEND SERVER] PublicProfilePage: CRITICAL - NEXT_PUBLIC_API_BASE_URL is not defined.");
    return null;
  }
  const apiUrl = `${apiBaseUrl}/public/profile/${username}`;
  try {
    const res = await fetch(apiUrl, { cache: 'no-store' });
    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error(`[FRONTEND SERVER] CATCH BLOCK in getPublicProfileData for ${username}:`, error.message);
    return null;
  }
}

export default async function PublicProfilePage({ params, searchParams }) {
  const username = params.username;
  const paymentCancelled = searchParams?.payment_cancelled === 'true';
  const profileData = await getPublicProfileData(username);

  if (!profileData) {
    notFound();
  }

  const {
    displayName = username,
    bio = "",
    profileImageUrl,
    bannerImageUrl,
    profileBackgroundColor = '#FFFFFF', // Default to white
    links = [],
    stripeAccountId,
    stripeOnboardingComplete,
  } = profileData;

  return (
    // FIX: Removed the `bg-gray-100` class. The background will now be determined by your global CSS.
    <main className="flex flex-col items-center min-h-screen">
      
      {/* Container for the entire profile card content */}
      <div className="container mx-auto max-w-3xl flex flex-col items-center pb-10 w-full">
        
        {/* Banner Image */}
        <div className="w-full h-48 md:h-64 lg:h-72 relative shadow-lg bg-gray-300">
          {bannerImageUrl ? (
            <Image
              src={bannerImageUrl}
              alt={`${displayName}'s banner`}
              fill={true}
              className="object-cover"
              priority={true}
              sizes="(max-width: 768px) 100vw, 896px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-gray-300 to-gray-400" />
          )}
        </div>

        {/* Profile content area */}
        {/* The custom background color is applied to this container. */}
        <div
          style={{ backgroundColor: profileBackgroundColor }}
          className="w-full max-w-2xl p-6 md:p-8 shadow-xl relative z-10 -mt-12 md:-mt-16 rounded-lg mx-4 sm:mx-0"
        >
          {/* Profile Image - Centered */}
          <div className="flex justify-center -mt-20 md:-mt-24 mb-4">
            {profileImageUrl ? (
              <Image
                src={profileImageUrl}
                alt={`Profile picture of ${displayName}`}
                width={160} height={160}
                className="rounded-full w-32 h-32 md:w-40 md:h-40 object-cover border-4 border-white shadow-2xl bg-gray-200"
                priority
              />
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 text-5xl md:text-6xl font-semibold shadow-2xl border-4 border-white">
                {displayName ? displayName.charAt(0).toUpperCase() : username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          {paymentCancelled && (
            <div role="alert" className="mb-6 p-3 bg-yellow-100 border border-yellow-300 text-yellow-700 rounded-md text-sm">
              <p className="font-semibold text-center">Payment Cancelled.</p>
            </div>
          )}

          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold mt-2 mb-1 text-gray-900">{displayName}</h1>
            {profileData.displayName && <p className="text-lg text-gray-500 mb-3">@{username}</p>}
            {bio && <p className="text-md text-gray-600 leading-relaxed max-w-lg mx-auto mb-6">{bio}</p>}
          </div>

          {/* Payment Button Area */}
          <div className="mb-8 px-4 md:px-0">
            {stripeAccountId && stripeOnboardingComplete ? (
              <SendTipButton recipientUsername={username} recipientDisplayName={displayName} />
            ) : ( profileData &&
              <div className="mt-6 p-3 bg-gray-100 rounded-md shadow text-center text-sm text-gray-600">
                {displayName} is not currently set up to receive payments.
              </div>
            )}
          </div>

          {/* Links Section */}
          <div className="w-full px-4 md:px-0">
            {links.length > 0 && (<h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">Links</h2>)}
            <div className="space-y-3">
              {links.length > 0 ? (
                links.map((link) => ( <a key={link.id} href={link.url.startsWith('http') ? link.url : `//${link.url}`} target="_blank" rel="noopener noreferrer nofollow" className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-5 rounded-md text-md shadow hover:shadow-md transition-all"> {link.title} </a> ))
              ) : ( <p className="text-gray-500 italic py-3 text-center">This user hasn't added any links yet.</p> )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// generateMetadata function remains the same