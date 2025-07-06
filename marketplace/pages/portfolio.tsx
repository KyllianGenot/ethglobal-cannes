import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import dotenv from "dotenv";
import Head from "next/head";
import DashboardLayout from "../components/DashboardLayout";

dotenv.config();

interface NFTAsset {
  tokenId: number;
  name: string;
  image: string;
  sharePrice: string; // raw (wei)
  sharePriceInUSDf: string; // formatted
  currentPrice: string; // alias for sharePriceInUSDf
  purchasePrice?: string; // à remplir si dispo
  quantity: string; // nombre de parts détenues
  loading: boolean;
  error?: string;
}

export default function PortfolioPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
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

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  // Ajout de la logique pour charger les assets détenus par l'utilisateur
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
        // On suppose que NEXT_PUBLIC_TOKENID donne le nombre max de tokens
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
            // Récupérer prix courant
            let sharePrice = 0n;
            if (fractionalTokenContract.sharePrice) {
              sharePrice = await fractionalTokenContract.sharePrice();
            }
            const sharePriceInUSDf = Number(ethers.formatUnits(sharePrice, 6));
            // Récupérer metadata
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
        setErrorAssets(e.message || "Erreur lors du chargement des assets");
      } finally {
        setLoadingAssets(false);
      }
    };
    loadUserAssets();
  }, [ready, authenticated, wallets]);

  // Calculate total portfolio value and allocation
  const calculatePortfolioStats = () => {
    const total = userAssets.reduce((sum, asset) => {
      return sum + (Number(asset.quantity) * Number(asset.sharePriceInUSDf));
    }, 0);
    setTotalPortfolioValue(total);
    return total;
  };

  // Generate colors for allocation chart
  const getAssetColor = (index: number) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 
      'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-orange-500',
      'bg-teal-500', 'bg-cyan-500', 'bg-lime-500', 'bg-emerald-500'
    ];
    return colors[index % colors.length];
  };

  // Sort assets by value (descending)
  const sortedAssets = [...userAssets].sort((a, b) => {
    const valueA = Number(a.quantity) * Number(a.sharePriceInUSDf);
    const valueB = Number(b.quantity) * Number(b.sharePriceInUSDf);
    return valueB - valueA;
  });

  // Update portfolio stats when assets change
  useEffect(() => {
    if (userAssets.length > 0) {
      calculatePortfolioStats();
    }
  }, [userAssets]);

  if (!ready || !authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const portfolioValue = totalPortfolioValue || 42847.32; // fallback to static value if no assets

  return (
    <>
      <Head>
        <title>Portfolio - Galerie</title>
      </Head>

      <DashboardLayout title="Portfolio">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Portfolio Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

                {/* Dynamic Chart based on portfolio allocation */}
                {loadingAssets ? (
                  <div className="h-72 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                      <p className="text-gray-500 text-lg">Loading portfolio data...</p>
                    </div>
                  </div>
                ) : userAssets.length > 0 ? (
                  <div className="h-72 bg-white rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Allocation</h4>
                    <div className="flex items-end justify-between h-48 mb-4">
                      {sortedAssets.map((asset, index) => {
                        const assetValue = Number(asset.quantity) * Number(asset.sharePriceInUSDf);
                        const percentage = totalPortfolioValue > 0 ? (assetValue / totalPortfolioValue) * 100 : 0;
                        const height = Math.max(20, (percentage / 100) * 180); // min 20px height
                        return (
                          <div key={asset.tokenId} className="flex flex-col items-center flex-1 mx-1">
                            <div 
                              className={`w-full rounded-t-lg ${getAssetColor(index)}`}
                              style={{ height: `${height}px` }}
                            ></div>
                            <div className="text-xs text-gray-500 mt-2 text-center">
                              {asset.name.length > 8 ? asset.name.substring(0, 8) + '...' : asset.name}
                            </div>
                            <div className="text-xs font-medium text-gray-700">
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="h-72 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-gray-500 text-lg">Portfolio Performance Chart</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Allocation based on actual assets */}
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Allocation</h3>
                {loadingAssets ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between py-2">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-gray-200 rounded-full mr-4 animate-pulse"></div>
                          <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : userAssets.length > 0 ? (
                  <div className="space-y-4">
                    {sortedAssets.map((asset, index) => {
                      const assetValue = Number(asset.quantity) * Number(asset.sharePriceInUSDf);
                      const percentage = totalPortfolioValue > 0 ? (assetValue / totalPortfolioValue) * 100 : 0;
                      return (
                        <div key={asset.tokenId} className="flex items-center justify-between py-2">
                          <div className="flex items-center">
                            <div className={`w-4 h-4 ${getAssetColor(index)} rounded-full mr-4`}></div>
                            <span className="text-sm text-gray-600">{asset.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{percentage.toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No assets found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Holdings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-8 py-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">My Assets</h3>
            </div>
            <div className="overflow-x-auto">
              {loadingAssets ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : errorAssets ? (
                <div className="p-8 text-center text-red-500">{errorAssets}</div>
              ) : userAssets.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No shares owned</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                      <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price</th>
                      <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedAssets.map((asset) => (
                      <tr key={asset.tokenId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4 overflow-hidden">
                              {asset.image ? (
                                <img src={asset.image} alt={asset.name} className="w-10 h-10 object-cover" />
                              ) : (
                                <span className="text-xs text-gray-400">No image</span>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{asset.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-900">{formatNumber(asset.quantity)}</td>
                        <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-900">{formatCurrency(asset.sharePriceInUSDf, 'USDf')}</td>
                        <td className="px-8 py-6 whitespace-nowrap text-sm font-bold text-gray-900">{formatCurrency(Number(asset.quantity) * Number(asset.sharePriceInUSDf), 'USDf')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
} 