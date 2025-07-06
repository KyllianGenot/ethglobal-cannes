import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Head from "next/head";
import DashboardLayout from "../components/DashboardLayout";

export default function FAQPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

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

  const categories = [
    { id: "all", name: "All", icon: "📋" },
    { id: "account", name: "Account", icon: "👤" },
    { id: "wallet", name: "Wallet", icon: "💳" },
    { id: "trading", name: "Trading", icon: "📈" },
    { id: "nft", name: "NFTs", icon: "🎨" },
    { id: "security", name: "Security", icon: "🔒" },
    { id: "fees", name: "Fees", icon: "💰" },
  ];

  const faqs = [
    {
      id: 1,
      category: "account",
      question: "How do I create an account on Galerie?",
      answer: "To create an account on Galerie, simply connect your crypto wallet by clicking 'Connect Wallet' on the homepage. We support MetaMask, WalletConnect, and many other wallets. Once connected, your account will be automatically created.",
    },
    {
      id: 2,
      category: "account",
      question: "Can I change my email address after registration?",
      answer: "Yes, you can update your email address in your profile settings. Go to Settings > Profile and update your contact information. You'll need to verify your new email address.",
    },
    {
      id: 3,
      category: "wallet",
      question: "Which wallets are supported by Galerie?",
      answer: "Galerie supports a wide variety of wallets including MetaMask, WalletConnect, Coinbase Wallet, and many others. We use Privy for wallet connectivity, which provides broad compatibility.",
    },
    {
      id: 4,
      category: "wallet",
      question: "My wallet is not connecting, what should I do?",
      answer: "If your wallet isn't connecting: 1) Make sure your wallet extension is unlocked, 2) Try refreshing the page, 3) Clear your browser cache, 4) Try connecting with a different browser. If the problem persists, contact our support team.",
    },
    {
      id: 5,
      category: "trading",
      question: "How do I buy my first NFT?",
      answer: "To buy your first NFT: 1) Connect your wallet, 2) Add funds to your wallet, 3) Browse the market or secondary market, 4) Click on an NFT you want to buy, 5) Click 'Buy Now' and confirm the transaction in your wallet.",
    },
    {
      id: 6,
      category: "trading",
      question: "What are gas fees and why do I pay them?",
      answer: "Gas fees are transaction costs on the blockchain. They go to network validators, not to Galerie. Fees vary based on network congestion. You can reduce fees by trading during less busy times.",
    },
    {
      id: 7,
      category: "nft",
      question: "How can I create and list my own NFT?",
      answer: "Currently, Galerie focuses on curated collections and investments. NFT creation and listing features are planned for future releases. Stay tuned for updates!",
    },
    {
      id: 8,
      category: "nft",
      question: "Can I transfer my NFTs to another wallet?",
      answer: "Yes, all NFTs on Galerie are standard blockchain tokens. You can transfer them to any compatible wallet using the blockchain's native transfer functions or through your wallet interface.",
    },
    {
      id: 9,
      category: "security",
      question: "How does Galerie secure my funds?",
      answer: "Galerie is non-custodial, meaning we never hold your funds. Your assets remain in your wallet at all times. We use industry-standard security practices and smart contracts audited by security experts.",
    },
    {
      id: 10,
      category: "security",
      question: "What should I do if I suspect fraudulent activity?",
      answer: "If you suspect fraudulent activity: 1) Immediately disconnect your wallet from all dApps, 2) Move your funds to a new wallet, 3) Contact our support team with details, 4) Report to relevant authorities if necessary.",
    },
    {
      id: 11,
      category: "fees",
      question: "What fees does Galerie charge?",
      answer: "Galerie charges a small marketplace fee on transactions. This helps us maintain and improve the platform. Exact fees are displayed before each transaction confirmation.",
    },
    {
      id: 12,
      category: "fees",
      question: "Are there fees for withdrawing my funds?",
      answer: "Galerie doesn't charge withdrawal fees since we're non-custodial. However, you'll pay standard blockchain gas fees when moving funds from your wallet.",
    },
  ];

  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (id: number) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <>
      <Head>
        <title>FAQ - Galerie</title>
      </Head>

      <DashboardLayout title="Frequently Asked Questions">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* FAQ Results */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {filteredFAQs.length} question{filteredFAQs.length !== 1 ? 's' : ''} found
              </h3>
            </div>
            
            {filteredFAQs.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No questions found</h4>
                <p className="text-gray-600">Try adjusting your search terms or category filter.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredFAQs.map((faq) => (
                  <div key={faq.id} className="p-6">
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full text-left focus:outline-none"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-medium text-gray-900 pr-4">
                          {faq.question}
                        </h4>
                        <svg
                          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                            openFAQ === faq.id ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    
                    {openFAQ === faq.id && (
                      <div className="mt-4 text-gray-600 leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Support */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-indigo-900 mb-2">
                Didn't find what you were looking for?
              </h4>
              <p className="text-indigo-700 mb-4">
                Our support team is here to help you with any questions.
              </p>
              <button
                onClick={() => router.push("/support")}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
} 