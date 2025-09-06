import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <Link href="/">
              <div className="text-3xl font-bold">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                  Tribute
                </span>
                <span className="text-white">
                  Toro
                </span>
              </div>
            </Link>
            <p className="text-gray-400 text-base">
              The simplest way for creators to accept support from their audience.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Support</h3>
                <ul className="mt-4 space-y-4">
                  <li><Link href="/dashboard/support" className="text-base text-gray-400 hover:text-white">FAQ Page</Link></li>
                  <li><a href="mailto:contact.tributetoro@gmail.com" className="text-base text-gray-400 hover:text-white">Email Us</a></li>
                  <li><a href="https://x.com/tributetoro" target="_blank" rel="noopener noreferrer" className="text-base text-gray-400 hover:text-white">X.com / Twitter</a></li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Legal</h3>
                <ul className="mt-4 space-y-4">
                  <li><Link href="/terms-of-service" className="text-base text-gray-400 hover:text-white">Terms of Service</Link></li>
                  <li><Link href="/privacy-policy" className="text-base text-gray-400 hover:text-white">Privacy Policy</Link></li>
                  <li><Link href="/refund-policy" className="text-base text-gray-400 hover:text-white">Refund Policy</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-700 pt-8">
          <p className="text-base text-gray-500 xl:text-center">&copy; {new Date().getFullYear()} TributeToro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}