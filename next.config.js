/** @type {import('next').NextConfig} */

// --- THIS IS THE FIX ---
// First, we get the full Supabase URL from the environment variable.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Then, we safely parse the hostname from it.
// new URL(supabaseUrl).hostname creates a URL object and extracts just the hostname part.
// For "https://qpykmvmfpqitrhwoayya.supabase.co", this will be "qpykmvmfpqitrhwoayya.supabase.co".
// We add a check to make sure the variable exists before trying to parse it.
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : '';

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // Now, we use the dynamically parsed hostname.
        hostname: supabaseHostname,
        port: '',
        pathname: '/storage/v1/object/public/avatars/**',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;