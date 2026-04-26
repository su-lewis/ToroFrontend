import { notFound } from 'next/navigation';
import PublicProfileClient from '@/components/PublicProfileClient';

export const runtime = 'edge';

// This server-side function fetches all the necessary data for the profile page.
async function getPublicProfileData(username) {
  if (typeof username !== 'string' || !username) return null;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) {
    console.error("CRITICAL: NEXT_PUBLIC_API_BASE_URL is not defined.");
    return null;
  }
  const apiUrl = `${apiBaseUrl}/public/profile/${username}`;
  try {
    const res = await fetch(apiUrl, { cache: 'no-store' }); // Use no-store to always get the latest page layout
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error(`Error fetching public profile for ${username}:`, error.message);
    return null;
  }
}

// generateMetadata function to handle dynamic SEO tags
export async function generateMetadata({ params }) {
  const username = params.username;
  const profileData = await getPublicProfileData(username);
  
  // Logic to determine the base URL based on the Vercel environment
  const siteUrl = process.env.VERCEL_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_SITE_URL // For production, use your custom domain from Vercel env vars
    : `https://${process.env.VERCEL_URL}`; // For previews, use the dynamic Vercel URL

  if (!profileData) {
    return {
      title: 'Profile Not Found',
      description: 'The requested profile could not be found on TributeToro.',
    };
  }

  const displayName = profileData.displayName || profileData.username;
  const pageTitle = `${displayName}'s Page on TributeToro`;
  const pageDescription = profileData.bio || `Support ${displayName} on TributeToro. View their links and send a tip!`;
  
  // Use the creator's image if it exists, otherwise fall back to your default OG image
  const imageUrl = profileData.profileImageUrl || `${siteUrl}/images/default-og-image.png`;

  return {
    title: pageTitle,
    description: pageDescription,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `${siteUrl}/${username}`, // Use the dynamically determined URL
      siteName: 'TributeToro',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
        },
      ],
      locale: 'en_US',
      type: 'profile',
    },
    twitter: {
        card: 'summary_large_image',
        title: pageTitle,
        description: pageDescription,
        images: [imageUrl],
    },
  };
}


// This Server Component now ONLY fetches data and passes it to the client.
export default async function PublicProfilePage({ params, searchParams }) {
  const username = params.username;
  const profileData = await getPublicProfileData(username);
  const paymentCancelled = searchParams?.payment_cancelled === 'true';

  if (!profileData) {
    notFound();
  }

  // Pass the fetched data to the Client Component for rendering.
  return (
    <PublicProfileClient
      profileData={profileData}
      paymentCancelled={paymentCancelled}
    />
  );
}