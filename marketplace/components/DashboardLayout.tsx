import { ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function DashboardLayout({ children, title, searchQuery, onSearchChange }: DashboardLayoutProps) {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [usdfBalance, setUsdfBalance] = useState<string>("0");
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const currentPage = router.pathname.substring(1) || "dashboard";

  const USDF_CONTRACT_ADDRESS = "0xd7d43ab7b365f0d0789aE83F4385fA710FfdC98F";
  const RPC_URL = "https://testnet.evm.nodes.onflow.org";

  const USDF_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)"
  ];

  const loadUsdfBalance = async () => {
    if (!ready || !authenticated || wallets.length === 0) return;
    
    try {
      setLoadingBalance(true);
      const wallet = wallets[0];
      if (!wallet?.address) return;
      
      const userAddress = wallet.address;
      
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const usdfContract = new ethers.Contract(USDF_CONTRACT_ADDRESS, USDF_ABI, provider);
      
      const balance = await usdfContract.balanceOf?.(userAddress);
      if (!balance) return;
      
      const balanceFormatted = ethers.formatUnits(balance, 6);
      setUsdfBalance(balanceFormatted);
      
    } catch (error) {
      console.error("Error loading USDf balance:", error);
      setUsdfBalance("0");
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    if (ready && authenticated) {
      loadUsdfBalance();
    }
  }, [ready, authenticated, wallets]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-end space-x-6">
            {/* Search */}
            <div className="relative flex items-center">
              {isSearchExpanded ? (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search artworks..."
                    value={searchQuery || ""}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    onBlur={() => setIsSearchExpanded(false)}
                    autoFocus
                    className="block w-80 pl-10 pr-3 py-2 border-0 bg-transparent placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 sm:text-sm text-gray-700"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchExpanded(true)}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* USDf Balance */}
            <div className="flex items-center">
              <svg className="h-5 w-5 text-gray-700 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="text-base text-gray-700">
                {loadingBalance ? "..." : `${parseFloat(usdfBalance).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pt-0 px-6 pb-6">
          {children}
        </main>
      </div>
    </div>
  );
} 