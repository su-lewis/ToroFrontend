// frontend/src/app/(dashboard)/dashboard/profile/page.js

// --- FIX: Import the CORRECT function name ---
import { fetchProtectedDataFromServer } from '@/lib/server-api'; 
import ProfileForm from '@/components/ProfileForm'; // Or the correct path to your form component

export default async function ProfilePageServer() {
  let initialProfileData = null; 
  let fetchError = null;

  try {
    // --- FIX: Call the CORRECT function name and relative path ---
    initialProfileData = await fetchProtectedDataFromServer('/users/me'); 
  } catch (e) {
    fetchError = e;
    if (e.status === 404 && e.body?.code === 'PROFILE_NOT_FOUND') {
      console.log("ProfilePage: No existing profile found for user.");
      initialProfileData = {}; 
      fetchError = null; 
    } else {
      console.error("ProfilePage: Error fetching initial profile data:", e.message);
    }
  }

  if (fetchError) {
      return (
          <div className="bg-white p-8 rounded-xl shadow-lg">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Profile</h1>
              <p className="text-gray-700">Could not load your profile data at this time.</p>
              <p className="text-sm text-gray-500 mt-2">Error: {fetchError.message}</p>
          </div>
      );
  }

  // Pass the fetched data to the client component form
  // Using the prop name 'profile' to match your ProfileForm.js
  return <ProfileForm profile={initialProfileData} />;
}