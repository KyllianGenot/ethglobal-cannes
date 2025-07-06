import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import Head from "next/head";
import DashboardLayout from "../../components/DashboardLayout";
import { ethers } from "ethers";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface NFTAsset {
  tokenId: number;
  name: string;
  image: string;
  sharesSold: string;
  totalShares: string;
  availableShares: string;
  sharePrice: string;
  sharePriceInUSDf: string;
  loading: boolean;
  error?: string;
}

// Add Toast component
const Toast = ({ message, type, onClose }: { message: string; type: 'error' | 'success' | 'warning'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-yellow-500';
  const textColor = 'text-white';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} ${textColor} px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-3 text-white hover:text-gray-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default function AssetDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [asset, setAsset] = useState<NFTAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareCount, setShareCount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'warning' } | null>(null);

  // Utility function to format numbers with spaces
  const formatNumber = (num: number | string): string => {
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    return numValue.toLocaleString('fr-FR');
  };

  // Utility function to format price as integer with spaces
  const formatPrice = (price: string): string => {
    const numValue = parseFloat(price);
    return Math.floor(numValue).toLocaleString('fr-FR');
  };

  const FACTORY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS || "";
  const USDF_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USDF_CONTRACT_ADDRESS || "";
  const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || "";
  const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "";

  // ABI based on your working code
  const FACTORY_ABI = [
    "function purchaseShares(uint256 _tokenId, uint256 _shares) external payable",
    "function getNFTInfo(uint256 _tokenId) external view returns (address fractionalTokenAddress, address nftOwner, uint256 totalShares, uint256 sharesSold, uint256 sharePrice, bool tradingEnabled, uint256 availableShares)",
    "function getSharePrice(uint256 _tokenId) external view returns (uint256 sharePrice)",
    "function getFractionalToken(uint256 _tokenId) external view returns (address)",
    "function getNFTMetadata(uint256 _tokenId) external view returns (string memory uri, address owner)"
  ];

  const NFT_ABI = [
    "function tokenURI(uint256 tokenId) external view returns (string memory)",
    "function ownerOf(uint256 tokenId) external view returns (address)",
    "function name() external view returns (string memory)",
    "function symbol() external view returns (string memory)"
  ];

  const USDF_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function decimals() external view returns (uint8)"
  ];

  const FRACTIONAL_TOKEN_ABI = [
    "function purchaseShares(uint256 _numberOfShares) external",
    "function sellShares(uint256 _numberOfShares) external",
    "function balanceOf(address account) external view returns (uint256)",
    "function getAvailableShares() external view returns (uint256)",
    "function getContractInfo() external view returns (address _nftContract, uint256 _nftTokenId, uint256 _totalShares, uint256 _sharesSold, uint256 _sharePrice, bool _tradingEnabled, uint256 _availableShares)",
    "function totalShares() external view returns (uint256)",
    "function sharePrice() external view returns (uint256)",
    "function sharesSold() external view returns (uint256)"
  ];

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (ready && authenticated && id) {
      loadAssetData();
      setShareCount(1); // Reset share count when loading new asset
    }
  }, [ready, authenticated, id]);

  const loadAssetData = async () => {
    try {
      setLoading(true);
      const tokenId = parseInt(id as string);
      
      // Validate contract addresses
      if (!FACTORY_CONTRACT_ADDRESS) {
        throw new Error("FACTORY_CONTRACT_ADDRESS not configured");
      }
      if (!RPC_URL) {
        throw new Error("RPC_URL not configured");
      }
      if (!NFT_CONTRACT_ADDRESS) {
        throw new Error("NFT_CONTRACT_ADDRESS not configured");
      }
      
      console.log(`Using Factory Contract: ${FACTORY_CONTRACT_ADDRESS}`);
      
      // Create provider for reading contract data
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const factoryContract = new ethers.Contract(FACTORY_CONTRACT_ADDRESS, FACTORY_ABI, provider);
      
      // Get fractional token address
      if (!factoryContract.getFractionalToken) {
        throw new Error("Factory contract method not available");
      }
      const fractionalTokenAddress = await factoryContract.getFractionalToken(tokenId);
      if (!fractionalTokenAddress || fractionalTokenAddress === ethers.ZeroAddress) {
        throw new Error(`No fractional token found for NFT #${tokenId}`);
      }

      // Create contracts
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, provider);
      const fractionalTokenContract = new ethers.Contract(fractionalTokenAddress, FRACTIONAL_TOKEN_ABI, provider);
      
      // Get all information in parallel with proper null checks
      const [
        name,
        symbol,
        tokenURI,
        owner,
        totalShares,
        sharesSold,
        sharePrice
      ] = await Promise.all([
        nftContract.name?.() || "Unknown",
        nftContract.symbol?.() || "UNK", 
        nftContract.tokenURI?.(tokenId) || "",
        nftContract.ownerOf?.(tokenId) || ethers.ZeroAddress,
        fractionalTokenContract.totalShares?.() || 0,
        fractionalTokenContract.sharesSold?.() || 0,
        fractionalTokenContract.sharePrice?.() || 0
      ]);

      // Convert values using 6 decimals
      const totalSharesNormal = Number(ethers.formatUnits(totalShares, 6));
      const sharesSoldNormal = Number(ethers.formatUnits(sharesSold, 6));
      const availableSharesNormal = totalSharesNormal - sharesSoldNormal;
      const sharePriceNormal = Number(ethers.formatUnits(sharePrice, 6));
      
      // Get metadata
      let imageUrl = "";
      let nftName = `NFT #${tokenId}`;
      
      if (tokenURI) {
        try {
          const url = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
          const response = await fetch(url);
          const metadata = await response.json();
          
          if (metadata.image) {
            imageUrl = metadata.image.startsWith('ipfs://') 
              ? metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
              : metadata.image;
          }
          
          if (metadata.name) {
            nftName = metadata.name;
          }
        } catch (metadataError) {
          console.warn(`Could not load metadata for token ${tokenId}:`, metadataError);
        }
      }
      
      const assetData: NFTAsset = {
        tokenId,
        name: nftName,
        image: imageUrl || "",
        sharesSold: sharesSoldNormal.toString(),
        totalShares: totalSharesNormal.toString(),
        availableShares: availableSharesNormal.toString(),
        sharePrice: sharePrice.toString(), // Keep raw value for calculations
        sharePriceInUSDf: sharePriceNormal.toString(),
        loading: false
      };
      
      setAsset(assetData);
      
    } catch (error) {
      console.error(`Error loading asset:`, error);
      setAsset({
        tokenId: parseInt(id as string),
        name: `NFT #${id}`,
        image: "",
        sharesSold: "0",
        totalShares: "0", 
        availableShares: "0",
        sharePrice: "0",
        sharePriceInUSDf: "0",
        loading: false,
        error: "Failed to load"
      });
    } finally {
      setLoading(false);
    }
  };

  const buySharesWithUSDf = async (tokenId: number, numberOfShares: number) => {
    try {
      // Clear any previous toast
      setToast(null);
      
      if (!wallets || wallets.length === 0) {
        throw new Error("No wallet connected");
      }

      const wallet = wallets[0];
      if (!wallet) {
        throw new Error("Wallet not available");
      }
      
      // Get the Ethereum provider and signer from Privy wallet
      const provider = await wallet.getEthereumProvider();
      const web3Provider = new ethers.BrowserProvider(provider);
      const signer = await web3Provider.getSigner();
      
      console.log('\n🔄 PURCHASE SHARES WITH USDf');
      console.log('============================');
      
      const userAddress = await signer.getAddress();
      console.log(`Wallet: ${userAddress}`);
      
      // Create provider for reading contract data
      const readProvider = new ethers.JsonRpcProvider(RPC_URL);
      const factoryContract = new ethers.Contract(FACTORY_CONTRACT_ADDRESS, FACTORY_ABI, readProvider);
      
      // Get fractional token address
      if (!factoryContract.getFractionalToken) {
        throw new Error("Contract method not available");
      }
      const fractionalTokenAddress = await factoryContract.getFractionalToken(tokenId);
      
      if (!fractionalTokenAddress || fractionalTokenAddress === ethers.ZeroAddress) {
        throw new Error(`No fractional token found for NFT #${tokenId}`);
      }
      
      console.log(`Fractional token: ${fractionalTokenAddress}`);
      
      // Create contract instances with signer for transactions
      const usdfContract = new ethers.Contract(USDF_CONTRACT_ADDRESS, USDF_ABI, signer);
      const fractionalTokenContract = new ethers.Contract(fractionalTokenAddress, FRACTIONAL_TOKEN_ABI, signer);
      
      // Get share price from fractional token contract
      if (!fractionalTokenContract.sharePrice) {
        throw new Error("Share price method not available");
      }
      const sharePrice = await fractionalTokenContract.sharePrice();
      const totalCost = sharePrice * BigInt(numberOfShares);
      
      console.log(`Unit price: ${ethers.formatUnits(sharePrice, 6)} USDf`);
      console.log(`Total cost: ${ethers.formatUnits(totalCost, 6)} USDf`);
      
      // Check available shares
      if (fractionalTokenContract.getAvailableShares) {
        const availableShares = await fractionalTokenContract.getAvailableShares();
        const availableCount = Number(ethers.formatUnits(availableShares, 6));
        console.log(`Available shares: ${availableCount}`);
        
        if (numberOfShares > availableCount) {
          throw new Error(`Only ${availableCount} shares available`);
        }
      }
      
      // Check USDf balance
      if (!usdfContract.balanceOf) {
        throw new Error("USDf balanceOf method not available");
      }
      const usdfBalance = await usdfContract.balanceOf(userAddress);
      console.log(`USDf balance: ${ethers.formatUnits(usdfBalance, 6)} USDf`);
      
      if (usdfBalance < totalCost) {
        throw new Error(`INSUFFICIENT_FUNDS:${ethers.formatUnits(usdfBalance, 6)}:${ethers.formatUnits(totalCost, 6)}`);
      }
      
      // Check and approve USDf allowance
      if (!usdfContract.allowance) {
        throw new Error("USDf allowance method not available");
      }
      const allowance = await usdfContract.allowance(userAddress, fractionalTokenAddress);
      
      if (allowance < totalCost) {
        console.log('🔒 USDf approval needed...');
        if (!usdfContract.approve) {
          throw new Error("USDf approve method not available");
        }
        
        // Convert amount to USDf units (6 decimals)
        const amountInUnits = ethers.parseUnits(ethers.formatUnits(totalCost, 6), 6);
        
        const approveTx = await usdfContract.approve(fractionalTokenAddress, amountInUnits, {
          gasLimit: 100000
        });
        console.log('⏳ Waiting for approval confirmation...');
        await approveTx.wait();
        console.log('✅ USDf approved');
      } else {
        console.log(`✅ Existing allowance: ${ethers.formatUnits(allowance, 6)} USDf`);
      }
      
      // Purchase shares on fractional token contract (NOT factory)
      console.log('📤 Purchasing shares...');
      console.log(`Calling purchaseShares(${numberOfShares}) on fractional token contract`);
      
      if (!fractionalTokenContract.purchaseShares) {
        throw new Error("Purchase method not available");
      }
      
      const purchaseTx = await fractionalTokenContract.purchaseShares(numberOfShares, {
        gasLimit: 300000
      });
      
      console.log(`Transaction hash: ${purchaseTx.hash}`);
      const receipt = await purchaseTx.wait();
      
      if (receipt.status === 1) {
        console.log('✅ Purchase successful!');
        setToast({ message: 'Purchase successful!', type: 'success' });
        
        // Check new balance
        if (fractionalTokenContract.balanceOf) {
          const newBalance = await fractionalTokenContract.balanceOf(userAddress);
          console.log(`Shares owned: ${ethers.formatUnits(newBalance, 6)}`);
        }
        
        // Reload asset data to update the display
        loadAssetData();
      } else {
        throw new Error('Transaction failed');
      }
      
    } catch (error: any) {
      console.error('❌ Error during purchase:', error);
      
      // Handle specific error types
      if (error.code === 'ACTION_REJECTED' || error.message.includes('user rejected') || error.message.includes('ethers-user-denied')) {
        setToast({ message: 'Transaction cancelled', type: 'warning' });
      } else if (error.message.includes('INSUFFICIENT_FUNDS')) {
        setToast({ message: 'Not enough funds', type: 'error' });
      } else if (error.message.includes('Only') && error.message.includes('shares available')) {
        setToast({ message: error.message, type: 'error' });
      } else {
        setToast({ message: 'Transaction failed', type: 'error' });
      }
    }
  };

  if (!ready || !authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Asset - Galerie</title>
        </Head>
        <DashboardLayout title="Loading...">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Loading asset details...</span>
          </div>
        </DashboardLayout>
      </>
    );
  }

  if (!asset) {
    return (
      <>
        <Head>
          <title>Asset Not Found - Galerie</title>
        </Head>
        <DashboardLayout title="Asset Not Found">
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900">Asset not found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The asset you're looking for doesn't exist or couldn't be loaded.
            </p>
            <button 
              onClick={() => router.push('/marche')}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Back to Market
            </button>
          </div>
        </DashboardLayout>
      </>
    );
  }

  const soldPercentage = Number(asset.totalShares) > 0 
    ? (Number(asset.sharesSold) / Number(asset.totalShares)) * 100 
    : 0;

  return (
    <>
      <Head>
        <title>{asset.name} - Galerie</title>
      </Head>

      <DashboardLayout>
        <div className="h-full max-w-5xl mx-auto flex flex-col pt-4">
          
          {/* Toast */}
          {toast && (
            <Toast 
              message={toast.message} 
              type={toast.type} 
              onClose={() => setToast(null)} 
            />
          )}
          
          {/* Back Button */}
          <div className="mb-3">
            <button
              onClick={() => router.push('/marche')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Market
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            
            {/* Asset Image */}
            <div className="lg:col-span-2 flex flex-col min-h-0">
              {/* Asset Title */}
              <div className="mb-3">
                <h1 className="text-3xl font-bold text-gray-900">{asset.name}</h1>
                <p className="text-gray-500 mt-1">Token ID: #{asset.tokenId}</p>
              </div>
              
              <div className="w-full flex-1 rounded-xl overflow-hidden shadow-lg min-h-0">
                {asset.image ? (
                  <img 
                    src={asset.image} 
                    alt={asset.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-6xl font-bold">#{asset.tokenId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Purchase Panel */}
            <div className="lg:col-span-1 flex flex-col justify-start pt-[76px]">
              <div className="bg-white rounded-xl p-5 shadow-lg border w-full">
                
                {/* Price */}
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-1">Share Price</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatPrice(asset.sharePriceInUSDf)} USDf
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg border">
                    <div className="text-lg font-semibold text-gray-900">{formatNumber(asset.totalShares)}</div>
                    <div className="text-xs text-gray-500 mt-1">Total Shares</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg border">
                    <div className={`text-lg font-semibold ${Number(asset.availableShares) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatNumber(asset.availableShares)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Available</div>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-5">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Sales Progress</span>
                    <span>{soldPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(soldPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatNumber(asset.sharesSold)} of {formatNumber(asset.totalShares)} sold
                  </div>
                </div>

                {/* Share Count Input */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 mb-2">Number of shares</label>
                  <div className="flex items-center">
                    <button
                      onClick={() => setShareCount(Math.max(1, shareCount - 1))}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-l-lg transition-colors"
                      disabled={shareCount <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={Number(asset.availableShares)}
                      value={shareCount}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        const maxShares = Number(asset.availableShares);
                        setShareCount(Math.min(Math.max(1, value), maxShares));
                      }}
                      className="flex-1 text-center border-y border-gray-200 py-2 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => setShareCount(Math.min(Number(asset.availableShares), shareCount + 1))}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-r-lg transition-colors"
                      disabled={shareCount >= Number(asset.availableShares)}
                    >
                      +
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Total: {formatPrice((shareCount * Number(asset.sharePriceInUSDf)).toString())} USDf
                  </div>
                </div>

                {/* Purchase Button */}
                <button
                  onClick={() => buySharesWithUSDf(asset.tokenId, shareCount)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold text-base transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={Number(asset.availableShares) === 0 || !!asset.error || shareCount <= 0}
                >
                  {Number(asset.availableShares) > 0 
                    ? `Buy ${formatNumber(shareCount)} Share${shareCount > 1 ? 's' : ''}`
                    : 'Sold Out'
                  }
                </button>
                
                {asset.error && (
                  <div className="text-red-500 text-sm text-center mt-2">
                    {asset.error}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
} 