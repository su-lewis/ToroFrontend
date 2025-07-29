// frontend/src/app/(dashboard)/dashboard/profile/page.js
import { fetchProtectedDataFromServer } from '@/lib/server-api';
import ProfileForm from '@/components/ProfileForm'; // Import the component from the /components directory

// This is the default export for the page, a Server Component.
export default async function ProfilePageServer() {
  let initialProfileData = null; 
  let serverFetchError = null;

  try {
    // Fetch the user's current profile data on the server before rendering
    initialProfileData = await fetchProtectedDataFromServer('/users/me'); 
  } catch (e) {
    serverFetchError = e;
    // If the error is 404, it means the user is new and doesn't have a profile yet.
    // This is an expected state, so we'll pass an empty object to the form.
    if (e.status === 404 && e.body?.code === 'PROFILE_NOT_FOUND') {
      initialProfileData = {}; 
      serverFetchError = null; // Clear the error since it's expected
    } else {
      console.error("ProfilePageServer: Error fetching initial profile data:", e.message, "Status:", e.status);
    }
  }

  // Render the Client Component (<ProfileForm>), passing the fetched data as props.
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Profile Settings</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        This is where you can customize your public profile. Upload a banner and avatar, choose a background color, and set your display information.
      </p>
      <ProfileForm initialData={initialProfileData} serverError={serverFetchError} />
    </div>
  );
}