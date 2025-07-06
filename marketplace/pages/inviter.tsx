import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Head from "next/head";
import DashboardLayout from "../components/DashboardLayout";

export default function InviterPage() {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const userEmail = user?.email?.address || "user@example.com";
  const username = userEmail.split('@')[0]; // Extract part before @
  const referralLink = `https://join.galerie.fi/${username}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const shareOnTwitter = () => {
    const text = "Join me on Galerie and unlock amazing rewards! 🎨✨";
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`, '_blank');
  };

  const shareOnWhatsApp = () => {
    const text = `Join me on Galerie and unlock amazing rewards! ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <>
      <Head>
        <title>Invite Friends - Galerie</title>
      </Head>

      <DashboardLayout title="Invite Friends">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Top Rectangle - Header Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 text-center relative">
              {/* Decorative background elements */}
              <div className="absolute top-2 right-6 w-12 h-12 bg-purple-200 rounded-full opacity-20"></div>
              <div className="absolute top-8 left-8 w-8 h-8 bg-indigo-200 rounded-full opacity-30"></div>
              <div className="absolute bottom-4 right-12 w-6 h-6 bg-pink-200 rounded-full opacity-25"></div>
              <div className="relative z-10">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Invite your friends and unlock rewards!
                </h1>
                <div className="bg-white rounded-lg border border-gray-200 px-4 py-2 max-w-md mx-auto flex flex-col items-center">
                  <p className="text-gray-800 text-sm font-mono break-all select-all text-center">{referralLink}</p>
                </div>
                {/* Share Buttons - now below the link box */}
                <div className="flex justify-center items-center gap-3 mt-4">
                  <button
                    onClick={copyToClipboard}
                    className="w-9 h-9 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                    title="Copy link"
                  >
                    {copied ? (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={shareOnTwitter}
                    className="w-9 h-9 bg-[#e6ecf0] rounded-full flex items-center justify-center hover:bg-[#d0d8e0] transition-colors"
                    title="Share on X"
                  >
                    <svg className="w-4 h-4 text-[#1d9bf0]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </button>
                  <button
                    onClick={shareOnWhatsApp}
                    className="w-9 h-9 bg-[#e6f4ea] rounded-full flex items-center justify-center hover:bg-[#c8ecd7] transition-colors"
                    title="Share on WhatsApp"
                  >
                    <svg className="w-4 h-4 text-[#25d366]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Rectangle - How it works section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">How does it work?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Step 1 */}
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Spread the word</h3>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Share your exclusive referral link with your network and rewards multiply.
                  </p>
                </div>
                {/* Step 2 */}
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Your friends sign up</h3>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Your friends sign up with your referral link. They receive a 10% welcome discount.
                  </p>
                </div>
                {/* Step 3 */}
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Get your rewards</h3>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    When your referrals make their first purchase, you earn a random free asset and both you and your friend earn a cash reward.
                  </p>
                </div>
              </div>
              {/* Additional info */}
              <div className="mt-6 bg-gray-50 rounded-xl p-4 text-center">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Start inviting now!</h3>
                <p className="text-gray-600 text-xs">
                  There's no limit to how many friends you can invite. The more friends who join, the more rewards you'll earn.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
} 