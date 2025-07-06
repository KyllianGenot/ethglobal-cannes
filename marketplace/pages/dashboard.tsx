import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import dotenv from "dotenv";
import Head from "next/head";
import DashboardLayout from "../components/DashboardLayout";

dotenv.config();

interface NFTAsset {
  tokenId: number;
  name: string;
  image: string;
  sharePrice: string;
  sharePriceInUSDf: string;
  currentPrice: string;
  purchasePrice?: string;
  quantity: string;
  loading: boolean;
  error?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const {
    ready,
    authenticated,
    user,
    linkEmail,
    linkWallet,
    unlinkEmail,
    linkPhone,
    unlinkPhone,
    unlinkWallet,
    linkGoogle,
    unlinkGoogle,
    linkTwitter,
    unlinkTwitter,
    linkDiscord,
    unlinkDiscord,
  } = usePrivy();
  const { wallets } = useWallets();
  const [userAssets, setUserAssets] = useState<NFTAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [errorAssets, setErrorAssets] = useState<string | null>(null);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);

  // Function to format numbers with spaces (French style)
  const formatNumber = (num: number | string): string => {
    const numValue = typeof num === 'string' ? parseFloat(num.replace(/[^\d.-]/g, '')) : num;
    return numValue.toLocaleString('fr-FR');
  };

  // Function to format currency with proper spacing
  const formatCurrency = (amount: number | string, currency: string = '$'): string => {
    const numValue = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : amount;
    return `${formatNumber(numValue)} ${currency}`;
  };

  // Calculate total portfolio value and allocation
  const calculatePortfolioStats = () => {
    const total = userAssets.reduce((sum, asset) => {
      return sum + (Number(asset.quantity) * Number(asset.sharePriceInUSDf));
    }, 0);
    setTotalPortfolioValue(total);
    return total;
  };

  // Load user assets
  useEffect(() => {
    const loadUserAssets = async () => {
      if (!ready || !authenticated || !wallets || wallets.length === 0) return;
      setLoadingAssets(true);
      setErrorAssets(null);
      try {
        const FACTORY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS || "";
        const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || "";
        const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "";
        const FACTORY_ABI = [
          "function getFractionalToken(uint256 _tokenId) external view returns (address)",
        ];
        const NFT_ABI = [
          "function tokenURI(uint256 tokenId) external view returns (string memory)",
          "function name() external view returns (string memory)",
        ];
        const FRACTIONAL_TOKEN_ABI = [
          "function balanceOf(address account) external view returns (uint256)",
          "function sharePrice() external view returns (uint256)",
          "function totalShares() external view returns (uint256)",
          "function sharesSold() external view returns (uint256)",
        ];
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const factoryContract = new ethers.Contract(FACTORY_CONTRACT_ADDRESS, FACTORY_ABI, provider);
        const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, provider);
        const maxTokenId = parseInt(process.env.NEXT_PUBLIC_TOKENID || "1");
        const tokenIds = Array.from({ length: maxTokenId }, (_, i) => i + 1);
        let userAddress = "";
        if (wallets[0] && wallets[0].address) {
          userAddress = wallets[0].address;
        } else {
          setLoadingAssets(false);
          return;
        }
        const assets: NFTAsset[] = [];
        for (const tokenId of tokenIds) {
          try {
            let fractionalTokenAddress = ethers.ZeroAddress;
            if (factoryContract.getFractionalToken) {
              fractionalTokenAddress = await factoryContract.getFractionalToken(tokenId);
            }
            if (!fractionalTokenAddress || fractionalTokenAddress === ethers.ZeroAddress) continue;
            const fractionalTokenContract = new ethers.Contract(fractionalTokenAddress, FRACTIONAL_TOKEN_ABI, provider);
            let balance = 0n;
            if (fractionalTokenContract.balanceOf) {
              balance = await fractionalTokenContract.balanceOf(userAddress);
            }
            const quantity = Number(ethers.formatUnits(balance, 6));
            if (quantity === 0) continue;
            let sharePrice = 0n;
            if (fractionalTokenContract.sharePrice) {
              sharePrice = await fractionalTokenContract.sharePrice();
            }
            const sharePriceInUSDf = Number(ethers.formatUnits(sharePrice, 6));
            let image = "";
            let name = `NFT #${tokenId}`;
            try {
              let tokenURI = "";
              if (nftContract.tokenURI) {
                tokenURI = await nftContract.tokenURI(tokenId);
              }
              if (tokenURI) {
                const url = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
                const response = await fetch(url);
                const metadata = await response.json();
                if (metadata.image) {
                  image = metadata.image.startsWith('ipfs://')
                    ? metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
                    : metadata.image;
                }
                if (metadata.name) name = metadata.name;
              }
            } catch {}
            assets.push({
              tokenId,
              name,
              image,
              sharePrice: sharePrice.toString(),
              sharePriceInUSDf: sharePriceInUSDf.toString(),
              currentPrice: sharePriceInUSDf.toString(),
              quantity: quantity.toString(),
              loading: false,
            });
          } catch (e) {
            // ignore asset if error
          }
        }
        setUserAssets(assets);
      } catch (e: any) {
        setErrorAssets(e.message || "Error loading assets");
      } finally {
        setLoadingAssets(false);
      }
    };
    loadUserAssets();
  }, [ready, authenticated, wallets]);

  // Update portfolio stats when assets change
  useEffect(() => {
    if (userAssets.length > 0) {
      calculatePortfolioStats();
    }
  }, [userAssets]);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  const numAccounts = user?.linkedAccounts?.length || 0;
  const canRemoveAccount = numAccounts > 1;

  const email = user?.email;
  const phone = user?.phone;
  const wallet = user?.wallet;

  const googleSubject = user?.google?.subject || null;
  const twitterSubject = user?.twitter?.subject || null;
  const discordSubject = user?.discord?.subject || null;

  if (!ready || !authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const portfolioValue = totalPortfolioValue || 0;

  return (
    <>
      <Head>
        <title>Home - Galerie</title>
      </Head>

      <DashboardLayout title="Home">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Top Section with Portfolio Value and News */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Portfolio Value */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-semibold text-gray-900">Total Portfolio Value</h3>
                  <div className="flex space-x-3">
                    <button className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">1D</button>
                    <button className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">1W</button>
                    <button className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg shadow-sm">1M</button>
                    <button className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">1Y</button>
                  </div>
                </div>
                
                <div className="mb-6">
                  {loadingAssets ? (
                    <div className="text-4xl font-bold text-gray-900 mb-3">
                      <div className="animate-pulse bg-gray-200 h-12 w-48 rounded"></div>
                    </div>
                  ) : (
                    <div className="text-4xl font-bold text-gray-900 mb-3">{formatCurrency(portfolioValue)}</div>
                  )}
                </div>

                {/* Random Rising Curve Chart */}
                <div className="h-72 bg-white rounded-xl p-6">
                  <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05"/>
                      </linearGradient>
                    </defs>
                    {/* Background grid */}
                    <g stroke="#f3f4f6" strokeWidth="1" fill="none">
                      {[0, 1, 2, 3, 4].map(i => (
                        <line key={`h${i}`} x1="0" y1={40 * i} x2="400" y2={40 * i} />
                      ))}
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <line key={`v${i}`} x1={50 * i} y1="0" x2={50 * i} y2="200" />
                      ))}
                    </g>
                    {/* Random rising curve */}
                    <path
                      d="M0,180 Q50,160 100,140 T200,100 T300,60 T400,40"
                      stroke="#6366f1"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Area under curve */}
                    <path
                      d="M0,180 Q50,160 100,140 T200,100 T300,60 T400,40 L400,200 L0,200 Z"
                      fill="url(#chartGradient)"
                    />
                    {/* Data points */}
                    {[
                      {x: 0, y: 180}, {x: 50, y: 160}, {x: 100, y: 140}, 
                      {x: 150, y: 120}, {x: 200, y: 100}, {x: 250, y: 80}, 
                      {x: 300, y: 60}, {x: 350, y: 50}, {x: 400, y: 40}
                    ].map((point, i) => (
                      <circle
                        key={i}
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill="#6366f1"
                        stroke="white"
                        strokeWidth="2"
                      />
                    ))}
                  </svg>
                </div>
              </div>
            </div>

            {/* News Section */}
            <div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">News</h3>
                <div className="space-y-4">
                  {/* Article 1 */}
                  <div className="border-b border-gray-100 pb-3">
                    <div className="w-full h-16 bg-cover bg-center rounded-lg mb-2" style={{ backgroundImage: 'url(/contemporary.jpeg)' }}>
                    </div>
                    <h4 className="text-xs font-semibold text-gray-900 mb-1">Contemporary Art Market Surges 45%</h4>
                    <p className="text-xs text-gray-500 mb-1">June 18, 2025</p>
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                      The contemporary art market has seen unprecedented growth with digital art and NFTs leading the charge. Major galleries report 45% increase in sales volume.
                    </p>
                  </div>

                  {/* Article 2 */}
                  <div className="border-b border-gray-100 pb-3">
                    <div className="w-full h-16 bg-cover bg-center rounded-lg mb-2" style={{ backgroundImage: 'url(/investment.jpeg)' }}>
                    </div>
                    <h4 className="text-xs font-semibold text-gray-900 mb-1">Performance Art Investment Platform Launches</h4>
                    <p className="text-xs text-gray-500 mb-1">June 20, 2025</p>
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                      A revolutionary platform allowing investors to purchase shares in live performance art pieces has launched. The platform has already facilitated over $2.3M in transactions.
                    </p>
                  </div>

                  {/* Article 3 */}
                  <div>
                    <div className="w-full h-16 bg-cover bg-center rounded-lg mb-2" style={{ backgroundImage: 'url(/streetart.jpeg)' }}>
                    </div>
                    <h4 className="text-xs font-semibold text-gray-900 mb-1">Street Art Becomes Premium Investment Class</h4>
                    <p className="text-xs text-gray-500 mb-1">June 12, 2025</p>
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                      Street art pieces are now being recognized as legitimate investment assets. Banksy's works have seen 300% appreciation, while emerging street artists are attracting institutional capital.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Management */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Account Management</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Email */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">Email</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${email ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {email ? 'Connected' : 'Not connected'}
                    </span>
                  </div>
                  {email ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 truncate">{email.address}</p>
                      <button
                        onClick={() => unlinkEmail(email.address)}
                        className="text-sm text-red-600 hover:text-red-700 disabled:text-gray-400"
                        disabled={!canRemoveAccount}
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={linkEmail}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      Connect email
                    </button>
                  )}
                </div>

                {/* Wallet */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">Wallet</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${wallet ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {wallet ? 'Connected' : 'Not connected'}
                    </span>
                  </div>
                  {wallet ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 truncate">{wallet.address}</p>
                      <button
                        onClick={() => unlinkWallet(wallet.address)}
                        className="text-sm text-red-600 hover:text-red-700 disabled:text-gray-400"
                        disabled={!canRemoveAccount}
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={linkWallet}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      Connect wallet
                    </button>
                  )}
                </div>

                {/* Phone */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">Phone</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${phone ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {phone ? 'Connected' : 'Not connected'}
                    </span>
                  </div>
                  {phone ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">{phone.number}</p>
                      <button
                        onClick={() => unlinkPhone(phone.number)}
                        className="text-sm text-red-600 hover:text-red-700 disabled:text-gray-400"
                        disabled={!canRemoveAccount}
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={linkPhone}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      Connect phone
                    </button>
                  )}
                </div>

                {/* Google */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 mr-2" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span className="text-sm font-medium text-gray-900">Google</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${googleSubject ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {googleSubject ? 'Connected' : 'Not connected'}
                    </span>
                  </div>
                  {googleSubject ? (
                    <button
                      onClick={() => unlinkGoogle(googleSubject)}
                      className="text-sm text-red-600 hover:text-red-700 disabled:text-gray-400"
                      disabled={!canRemoveAccount}
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={linkGoogle}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      Connect Google
                    </button>
                  )}
                </div>

                {/* Twitter */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                      <span className="text-sm font-medium text-gray-900">Twitter</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${twitterSubject ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {twitterSubject ? 'Connected' : 'Not connected'}
                    </span>
                  </div>
                  {twitterSubject ? (
                    <button
                      onClick={() => unlinkTwitter(twitterSubject)}
                      className="text-sm text-red-600 hover:text-red-700 disabled:text-gray-400"
                      disabled={!canRemoveAccount}
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={linkTwitter}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      Connect Twitter
                    </button>
                  )}
                </div>

                {/* Discord */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
                      </svg>
                      <span className="text-sm font-medium text-gray-900">Discord</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${discordSubject ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {discordSubject ? 'Connected' : 'Not connected'}
                    </span>
                  </div>
                  {discordSubject ? (
                    <button
                      onClick={() => unlinkDiscord(discordSubject)}
                      className="text-sm text-red-600 hover:text-red-700 disabled:text-gray-400"
                      disabled={!canRemoveAccount}
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={linkDiscord}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      Connect Discord
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
