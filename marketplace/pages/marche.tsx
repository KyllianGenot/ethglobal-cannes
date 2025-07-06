import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import Head from "next/head";
import DashboardLayout from "../components/DashboardLayout";
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

export default function MarchePage() {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [assets, setAssets] = useState<NFTAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "available" | "sold_out">("all");
  const [searchQuery, setSearchQuery] = useState('');
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
    if (ready && authenticated) {
      loadNFTAssets();
    }
  }, [ready, authenticated]);

  const loadNFTAssets = async () => {
    try {
      setLoading(true);
      
      // Validate factory contract address
      if (!FACTORY_CONTRACT_ADDRESS) {
        throw new Error("FACTORY_CONTRACT_ADDRESS not configured");
      }
      
      if (!RPC_URL) {
        throw new Error("RPC_URL not configured");
      }
      
      if (!NFT_CONTRACT_ADDRESS) {
        throw new Error("NFT_CONTRACT_ADDRESS not configured");
      }
      
      if (!USDF_CONTRACT_ADDRESS) {
        throw new Error("USDF_CONTRACT_ADDRESS not configured");
      }
      
      console.log(`Using Factory Contract: ${FACTORY_CONTRACT_ADDRESS}`);
      
      // Create provider for reading contract data
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const factoryContract = new ethers.Contract(FACTORY_CONTRACT_ADDRESS, FACTORY_ABI, provider);
      
      // Get the number of NFTs from environment variable
      const maxTokenId = parseInt(process.env.NEXT_PUBLIC_TOKENID || "1");
      const tokenIds = Array.from({length: maxTokenId}, (_, i) => i + 1); // [1, 2, 3, ..., maxTokenId]
      
      console.log(`Loading ${tokenIds.length} NFTs (Token IDs: ${tokenIds.join(', ')})`);
      
      const assetsData: NFTAsset[] = [];
        
      // Create NFT contract once (same for all tokens)
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, provider);
      
      // Get collection info once (same for all NFTs)
      let collectionName = "Unknown";
      let collectionSymbol = "UNK";
      try {
        [collectionName, collectionSymbol] = await Promise.all([
          nftContract.name?.() || "Unknown",
          nftContract.symbol?.() || "UNK"
        ]);
        console.log(`Collection: ${collectionName} (${collectionSymbol})`);
      } catch (error) {
        console.warn("Could not load collection info:", error);
      }

      // Process all tokens in smaller batches to avoid overwhelming the RPC
      const batchSize = 5;
      for (let i = 0; i < tokenIds.length; i += batchSize) {
        const batch = tokenIds.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(tokenIds.length/batchSize)}: tokens [${batch.join(', ')}]`);
        
        const batchPromises = batch.map(async (tokenId) => {
          try {
            // Get fractional token address
            if (!factoryContract.getFractionalToken) {
              throw new Error("Factory contract method not available");
            }
            const fractionalTokenAddress = await factoryContract.getFractionalToken(tokenId);
            if (!fractionalTokenAddress || fractionalTokenAddress === ethers.ZeroAddress) {
              throw new Error(`No fractional token found for NFT #${tokenId}`);
            }

            // Create fractional token contract
            const fractionalTokenContract = new ethers.Contract(fractionalTokenAddress, FRACTIONAL_TOKEN_ABI, provider);
            
            // Get all token-specific information in parallel
            const [
              tokenURI,
              owner,
              totalShares,
              sharesSold,
              sharePrice
            ] = await Promise.all([
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
            
            // Get metadata (only if tokenURI exists)
            let imageUrl = "";
            let nftName = `NFT #${tokenId}`;
            
            if (tokenURI && tokenURI.length > 0) {
              try {
                const url = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
                const response = await fetch(url, { 
                  signal: AbortSignal.timeout(10000) // 10 second timeout
                });
                if (response.ok) {
                  const metadata = await response.json();
                  
                  if (metadata.image) {
                    imageUrl = metadata.image.startsWith('ipfs://') 
                      ? metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
                      : metadata.image;
                  }
                  
                  if (metadata.name) {
                    nftName = metadata.name;
                  }
                }
              } catch (metadataError) {
                console.warn(`Could not load metadata for token ${tokenId}:`, metadataError);
              }
            }
            
            return {
              tokenId,
              name: nftName,
              image: imageUrl || "",
              sharesSold: sharesSoldNormal.toString(),
              totalShares: totalSharesNormal.toString(),
              availableShares: availableSharesNormal.toString(),
              sharePrice: sharePrice.toString(),
              sharePriceInUSDf: sharePriceNormal.toString(),
              loading: false
            };
            
          } catch (error) {
            console.error(`Error loading asset ${tokenId}:`, error);
            return {
              tokenId,
              name: `NFT #${tokenId}`,
              image: "",
              sharesSold: "0",
              totalShares: "0", 
              availableShares: "0",
              sharePrice: "0",
              sharePriceInUSDf: "0",
              loading: false,
              error: "Failed to load"
            };
          }
        });

        // Wait for batch to complete
        const batchResults = await Promise.all(batchPromises);
        assetsData.push(...batchResults);
        
        // Optional: Add small delay between batches to be nice to the RPC
        if (i + batchSize < tokenIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    
      setAssets(assetsData);
      
    } catch (error) {
      console.error("Error loading NFT assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets.filter(asset => {
    // First filter by search query
    const matchesSearch = searchQuery === "" || 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tokenId.toString().includes(searchQuery);
      
    if (!matchesSearch) return false;
    
    // Then filter by availability
    if (filter === "all") return true;
    if (filter === "available") return Number(asset.availableShares) > 0;
    if (filter === "sold_out") return Number(asset.availableShares) === 0;
    return true;
  });

  const buySharesWithUSDf = async (tokenId: number, numberOfShares: number = 1) => {
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
      
      console.log('\n🔄 ACHAT DE PARTS AVEC USDf');
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
        throw new Error(`Aucun token fractionnel trouvé pour le NFT #${tokenId}`);
      }
      
      console.log(`Token fractionnel: ${fractionalTokenAddress}`);
      
      // Create contract instances with signer for transactions
      const usdfContract = new ethers.Contract(USDF_CONTRACT_ADDRESS, USDF_ABI, signer);
      const fractionalTokenContract = new ethers.Contract(fractionalTokenAddress, FRACTIONAL_TOKEN_ABI, signer);
      
      // Get share price from fractional token contract
      if (!fractionalTokenContract.sharePrice) {
        throw new Error("Share price method not available");
      }
      const sharePrice = await fractionalTokenContract.sharePrice();
      const totalCost = sharePrice * BigInt(numberOfShares);
      
      console.log(`Prix unitaire: ${ethers.formatUnits(sharePrice, 6)} USDf`);
      console.log(`Coût total: ${ethers.formatUnits(totalCost, 6)} USDf`);
      
      // Check available shares
      if (fractionalTokenContract.getAvailableShares) {
        const availableShares = await fractionalTokenContract.getAvailableShares();
        const availableCount = Number(ethers.formatUnits(availableShares, 6));
        console.log(`Parts disponibles: ${availableCount}`);
        
        if (numberOfShares > availableCount) {
          throw new Error(`Seulement ${availableCount} parts disponibles`);
        }
      }
      
      // Check USDf balance
      if (!usdfContract.balanceOf) {
        throw new Error("USDf balanceOf method not available");
      }
      const usdfBalance = await usdfContract.balanceOf(userAddress);
      console.log(`Solde USDf: ${ethers.formatUnits(usdfBalance, 6)} USDf`);
      
      if (usdfBalance < totalCost) {
        throw new Error(`INSUFFICIENT_FUNDS:${ethers.formatUnits(usdfBalance, 6)}:${ethers.formatUnits(totalCost, 6)}`);
      }
      
      // Check and approve USDf allowance
      if (!usdfContract.allowance) {
        throw new Error("USDf allowance method not available");
      }
      const allowance = await usdfContract.allowance(userAddress, fractionalTokenAddress);
      
      if (allowance < totalCost) {
        console.log('🔒 Approbation USDf nécessaire...');
        if (!usdfContract.approve) {
          throw new Error("USDf approve method not available");
        }
        
        // Convert amount to USDf units (6 decimals)
        const amountInUnits = ethers.parseUnits(ethers.formatUnits(totalCost, 6), 6);
        
        const approveTx = await usdfContract.approve(fractionalTokenAddress, amountInUnits, {
          gasLimit: 100000
        });
        console.log('⏳ En attente de confirmation de l\'approbation...');
        await approveTx.wait();
        console.log('✅ USDf approuvé');
      } else {
        console.log(`✅ Allowance existante: ${ethers.formatUnits(allowance, 6)} USDf`);
      }
      
      // Purchase shares on fractional token contract (NOT factory)
      console.log('📤 Achat des parts...');
      console.log(`Appel de purchaseShares(${numberOfShares}) sur le contrat fractional token`);
      
      if (!fractionalTokenContract.purchaseShares) {
        throw new Error("Purchase method not available");
      }
      
      const purchaseTx = await fractionalTokenContract.purchaseShares(numberOfShares, {
        gasLimit: 300000
      });
      
      console.log(`Hash de transaction: ${purchaseTx.hash}`);
      const receipt = await purchaseTx.wait();
      
      if (receipt.status === 1) {
        console.log('✅ Achat réussi !');
        setToast({ message: 'Purchase successful!', type: 'success' });
        
        // Check new balance
        if (fractionalTokenContract.balanceOf) {
          const newBalance = await fractionalTokenContract.balanceOf(userAddress);
          console.log(`Parts détenues: ${ethers.formatUnits(newBalance, 6)}`);
        }
        
        // Reload assets to update the display
        loadNFTAssets();
      } else {
        throw new Error('Transaction failed');
      }
      
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'achat:', error);
      
      // Handle specific error types
      if (error.code === 'ACTION_REJECTED' || error.message.includes('user rejected') || error.message.includes('ethers-user-denied')) {
        setToast({ message: 'Transaction cancelled', type: 'warning' });
      } else if (error.message.includes('INSUFFICIENT_FUNDS')) {
        setToast({ message: 'Not enough funds', type: 'error' });
      } else if (error.message.includes('Seulement') && error.message.includes('parts disponibles')) {
        setToast({ message: error.message, type: 'error' });
      } else {
        setToast({ message: 'Transaction failed', type: 'error' });
      }
    }
  };

  const handleAssetClick = (asset: NFTAsset) => {
    router.push(`/marche/${asset.tokenId}`);
  };

  if (!ready || !authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Market - Galerie</title>
      </Head>

      <DashboardLayout 
        title="Market" 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Toast */}
          {toast && (
            <Toast 
              message={toast.message} 
              type={toast.type} 
              onClose={() => setToast(null)} 
            />
          )}
          
          {/* Filter Section */}
          <div className="w-full flex items-center justify-start px-6 py-3 bg-white border border-gray-300 rounded-full">
            <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="text-gray-700 mr-6">Filter</span>
            
            <div className="flex space-x-2 flex-1">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  filter === "all" 
                    ? "bg-indigo-600 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("available")}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  filter === "available" 
                    ? "bg-indigo-600 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Available
              </button>
              <button
                onClick={() => setFilter("sold_out")}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  filter === "sold_out" 
                    ? "bg-indigo-600 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Sold Out
              </button>
            </div>
          </div>

          {/* Assets Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asset
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shares Sold
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Share Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      View
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                          <span className="ml-3 text-gray-500">Loading assets...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No assets found
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((asset) => {
                      const soldPercentage = Number(asset.totalShares) > 0 
                        ? (Number(asset.sharesSold) / Number(asset.totalShares)) * 100 
                        : 0;
                      
                                              return (
                          <tr key={asset.tokenId} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleAssetClick(asset)}>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="h-12 w-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center mr-4">
                                  {asset.image ? (
                                    <img 
                                      src={asset.image} 
                                      alt={asset.name}
                                      className="h-12 w-12 rounded-lg object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <span className="text-white text-sm font-bold">#{asset.tokenId}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                                  <div className="text-sm text-gray-500">Token ID: #{asset.tokenId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {formatNumber(asset.sharesSold)} / {formatNumber(asset.totalShares)}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                Number(asset.availableShares) > 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {formatNumber(asset.availableShares)} shares
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {formatPrice(asset.sharePriceInUSDf)} USDf
                              </div>
                              <div className="text-sm text-gray-500">per share</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-indigo-600 h-2 rounded-full" 
                                  style={{ width: `${Math.min(soldPercentage, 100)}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {soldPercentage.toFixed(1)}% complete
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </td>
                          </tr>
                        );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
} 