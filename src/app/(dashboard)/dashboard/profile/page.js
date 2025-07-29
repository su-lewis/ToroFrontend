import { fetchProtectedDataFromServer } from '@/lib/server-api';
import ProfileForm from '@/components/ProfileForm'; // This path is now correct

export default async function ProfilePageServer() {
  let initialProfileData = null; 
  let serverFetchError = null;
  try {
    initialProfileData = await fetchProtectedDataFromServer('/users/me'); 
  } catch (e) {
    serverFetchError = e;
    if (e.status === 404) {
      initialProfileData = {}; 
      serverFetchError = null; 
    } else {
      console.error("ProfilePageServer Error:", e.message);
    }
  }
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Profile Settings</h1>
      <ProfileForm initialData={initialProfileData} serverError={serverFetchError} />
    </div>
  );
}