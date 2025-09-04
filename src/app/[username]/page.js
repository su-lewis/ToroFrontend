import { notFound } from 'next/navigation';
// --- THIS IS THE FIX ---
// Import the new client component we just created
import PublicProfileClient from '@/components/PublicProfileClient';

// Data fetching function remains the same
async function getPublicProfileData(username) {
  if (typeof username !== 'string' || !username) return null;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) {
    console.error("CRITICAL: NEXT_PUBLIC_API_BASE_URL is not defined.");
    return null;
  }
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

// This Server Component now ONLY fetches data and passes it to the client.
export default async function PublicProfilePage({ params, searchParams }) {
  const username = params.username;
  const profileData = await getPublicProfileData(username);
  const paymentCancelled = searchParams?.payment_cancelled === 'true';

  if (!profileData) {
    notFound();
  }

  // --- THIS IS THE FIX ---
  // The entire return statement is just the client component with the data passed as props.
  return (
    <PublicProfileClient
      profileData={profileData}
      paymentCancelled={paymentCancelled}
    />
  );
}

// The generateMetadata function is a server-side function, so it stays here.
export async function generateMetadata({ params }) {
  const profileData = await getPublicProfileData(params.username);

  if (!profileData) {
    return { title: 'Profile Not Found' };
  }

  const title = `${profileData.displayName || profileData.username}'s Profile`;
  const description = profileData.bio || `View the profile and links for ${profileData.displayName || profileData.username}.`;

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [
        {
          url: profileData.profileImageUrl || 'your_default_og_image_url_here',
          width: 800,
          height: 800,
        },
      ],
    },
  };
}