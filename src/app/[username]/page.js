// frontend/src/app/[username]/page.js
import { notFound } from 'next/navigation';
import Image from 'next/image';
import SendTipButton from '@/components/SendTipButton';

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

  const {
    displayName = username, bio = "", profileImageUrl, bannerImageUrl,
    links = [], stripeAccountId, stripeOnboardingComplete,
    profileBackgroundColor = '#F3F4F6' // Default to a light gray
  } = profileData;

  const pageStyle = { backgroundColor: profileBackgroundColor };
  const isBgDark = () => {
    if (!profileBackgroundColor) return false;
    const color = profileBackgroundColor.substring(1);
    const rgb = parseInt(color, 16);
    const r = (rgb >> 16) & 0xff, g = (rgb >> 8) & 0xff, b = (rgb >> 0) & 0xff;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 140; // Adjusted threshold for better readability
  };
  const textColorClass = isBgDark() ? 'text-gray-100' : 'text-gray-800';
  const subTextColorClass = isBgDark() ? 'text-gray-300' : 'text-gray-600';

  return (
    <div style={pageStyle} className="min-h-screen transition-colors duration-500">
      <div className="container mx-auto max-w-3xl flex flex-col items-center pb-12">
        
        <div className="w-full h-48 md:h-64 lg:h-72 relative shadow-lg bg-gray-300">
          {bannerImageUrl && <Image src={bannerImageUrl} alt={`${displayName}'s banner`} layout="fill" objectFit="cover" priority={true} />}
        </div>

        <div className="w-full max-w-2xl px-6 md:px-8 relative z-10 -mt-16 md:-mt-20">
          <div className="flex justify-center mb-4">
            {profileImageUrl ? (
              <Image src={profileImageUrl} alt={`Profile picture of ${displayName}`} width={160} height={160} className="rounded-full w-32 h-32 md:w-40 md:h-40 object-cover border-4 border-white shadow-2xl bg-gray-200" priority />
            ) : (
              <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center text-5xl md:text-6xl font-semibold shadow-2xl border-4 border-white ${isBgDark() ? 'bg-gray-700 text-gray-300' : 'bg-gray-300 text-gray-500'}`}>
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {paymentCancelled && (
            <div role="alert" className="mb-6 p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md text-sm text-center">
              <p className="font-semibold">Payment Cancelled.</p>
            </div>
          )}

          <div className={`text-center ${textColorClass}`}>
            <h1 className="text-3xl md:text-4xl font-extrabold mt-2 mb-1">{displayName}</h1>
            {profileData.displayName && <p className={`text-lg ${subTextColorClass} mb-3`}>@{username}</p>}
            {bio && <p className="text-md leading-relaxed max-w-lg mx-auto mb-6">{bio}</p>}
          </div>

          <div className="mb-8">
            {stripeAccountId && stripeOnboardingComplete ? ( <SendTipButton recipientUsername={username} recipientDisplayName={displayName} />
            ) : ( profileData && <div className={`mt-6 p-3 rounded-md shadow text-center text-sm ${isBgDark() ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{displayName} is not set up to receive payments.</div> )}
          </div>

          <div className="w-full">
            {links.length > 0 && (<h2 className={`text-xl font-semibold mb-4 text-center ${textColorClass}`}>Links</h2>)}
            <div className="space-y-4">
              {links.length > 0 ? (
                links.map((link) => (
                  <a key={link.id} href={link.url.startsWith('http') ? link.url : `//${link.url}`} target="_blank" rel="noopener noreferrer nofollow"
                    className="block w-full text-center font-semibold py-3 px-5 rounded-lg text-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 bg-black bg-opacity-10 hover:bg-opacity-20 border border-white border-opacity-20 backdrop-blur-sm"
                    style={{ color: isBgDark() ? '#FFFFFF' : '#1F2937' }}
                  >
                    {link.title}
                  </a>
                ))
              ) : ( <p className={`italic py-3 text-center ${subTextColorClass}`}>This user hasn't added any links yet.</p> )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }) { /* ... same as before ... */ }