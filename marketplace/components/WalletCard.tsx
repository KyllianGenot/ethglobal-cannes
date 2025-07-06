import { useCallback, useState } from "react";
import {
  getAccessToken,
  useSessionSigners,
  useSignMessage,
  useSignMessage as useSignMessageSolana,
  WalletWithMetadata,
  useWallets,
} from "@privy-io/react-auth";
import axios from "axios";
import { ethers } from "ethers";

const SESSION_SIGNER_ID = process.env.NEXT_PUBLIC_SESSION_SIGNER_ID;

// Configuration Flow EVM Testnet
const FLOW_TESTNET_CHAIN_ID = 545;
const FLOW_TESTNET_RPC = "https://testnet.evm.nodes.onflow.org";

// ABI pour le contrat factory basé sur votre config.js
const FACTORY_ABI = [
  "function purchaseShares(uint256 _tokenId, uint256 _shares) external payable",
  "function getNFTInfo(uint256 _tokenId) external view returns (address fractionalTokenAddress, address nftOwner, uint256 totalShares, uint256 sharesSold, uint256 sharePrice, bool tradingEnabled, uint256 availableShares)",
  "function getSharePrice(uint256 _tokenId) external view returns (uint256 sharePrice)",
  "function getFractionalToken(uint256 _tokenId) external view returns (address)"
];

// Adresse du contrat factory depuis votre config.js
const FACTORY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS || "0xc5D04a953FAB74B5F650029edd848fa1d1a37a04";

interface WalletCardProps {
  wallet: WalletWithMetadata;
}

export default function WalletCard({ wallet }: WalletCardProps) {
  const { addSessionSigners, removeSessionSigners } = useSessionSigners();
  const { signMessage: signMessageEthereum } = useSignMessage();
  const { signMessage: signMessageSolana } = useSignMessageSolana();
  const { wallets } = useWallets();
  const [isLoading, setIsLoading] = useState(false);
  const [isRemoteSigning, setIsRemoteSigning] = useState(false);
  const [isClientSigning, setIsClientSigning] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [tokenId, setTokenId] = useState("1");

  // Check if this specific wallet has session signers
  const hasSessionSigners = wallet.delegated === true;

  const addSessionSigner = useCallback(
    async (walletAddress: string) => {
      if (!SESSION_SIGNER_ID) {
        console.error("SESSION_SIGNER_ID must be defined to addSessionSigner");
        return;
      }

      setIsLoading(true);
      try {
        await addSessionSigners({
          address: walletAddress,
          signers: [
            {
              signerId: SESSION_SIGNER_ID,
              // This is a placeholder - in a real app, you would use a policy ID from your Privy dashboard
              policyIds: [],
            },
          ],
        });
      } catch (error) {
        console.error("Error adding session signer:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [addSessionSigners]
  );

  const removeSessionSigner = useCallback(
    async (walletAddress: string) => {
      setIsLoading(true);
      try {
        await removeSessionSigners({ address: walletAddress });
      } catch (error) {
        console.error("Error removing session signer:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [removeSessionSigners]
  );

  const handleClientSign = useCallback(async () => {
    setIsClientSigning(true);
    try {
      const message = `Signing this message to verify ownership of ${wallet.address}`;
      let signature;
      if (wallet.chainType === "ethereum") {
        const result = await signMessageEthereum({ message });
        signature = result.signature;
      } else if (wallet.chainType === "solana") {
        const result = await signMessageSolana({
          message,
        });
        signature = result.signature;
      }
      console.log("Message signed on client! Signature: ", signature);
    } catch (error) {
      console.error("Error signing message:", error);
    } finally {
      setIsClientSigning(false);
    }
  }, [wallet]);

  const handleRemoteSign = useCallback(async () => {
    setIsRemoteSigning(true);
    try {
      const authToken = await getAccessToken();
      const path =
        wallet.chainType === "ethereum"
          ? "/api/ethereum/personal_sign"
          : "/api/solana/sign_message";
      const message = `Signing this message to verify ownership of ${wallet.address}`;
      const response = await axios.post(
        path,
        {
          wallet_id: wallet.id,
          message: message,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = response.data;

      if (response.status === 200) {
        console.log(
          "Message signed on server! Signature: " + data.data.signature
        );
      } else {
        throw new Error(data.error || "Failed to sign message");
      }
    } catch (error) {
      console.error("Error signing message:", error);
    } finally {
      setIsRemoteSigning(false);
    }
  }, [wallet.id]);

  const handlePurchaseShares = useCallback(async () => {
    if (!FACTORY_CONTRACT_ADDRESS) {
      console.error("FACTORY_CONTRACT_ADDRESS must be defined");
      return;
    }

    if (wallet.chainType !== "ethereum") {
      console.error("Cette transaction est uniquement disponible pour les wallets Ethereum");
      return;
    }

    setIsPurchasing(true);
    try {
      // Trouver le ConnectedWallet correspondant dans useWallets()
      const connectedWallet = wallets.find(w => w.address === wallet.address);
      if (!connectedWallet) {
        throw new Error("Wallet connecté non trouvé");
      }

      // Obtenir le provider EIP-1193 depuis le wallet Privy
      const privyProvider = await connectedWallet.getEthereumProvider();
      if (!privyProvider) {
        throw new Error("Impossible d'obtenir le provider du wallet");
      }
      
      // Créer un provider direct vers Flow EVM Testnet (comme dans votre code qui fonctionne)
      const directProvider = new ethers.JsonRpcProvider(FLOW_TESTNET_RPC);
      console.log('\n🔗 CONNEXION DIRECTE');
      console.log(`   RPC: ${FLOW_TESTNET_RPC}`);
      console.log(`   Chain ID: ${FLOW_TESTNET_CHAIN_ID}`);
      
      // Vérifier la connexion au réseau
      const network = await directProvider.getNetwork();
      console.log(`   Réseau connecté: ${network.name} (Chain ID: ${network.chainId})`);
      
      console.log('\n📊 VÉRIFICATION DU CONTRAT');
      console.log(`   Adresse: ${FACTORY_CONTRACT_ADDRESS}`);
      console.log(`   Token ID: ${tokenId}`);
      
      // Tester si le contrat existe avec le provider direct
      try {
        const code = await directProvider.getCode(FACTORY_CONTRACT_ADDRESS);
        if (code === '0x') {
          throw new Error(`Le contrat n'existe pas à l'adresse ${FACTORY_CONTRACT_ADDRESS} sur Flow EVM Testnet`);
        }
        console.log('✅ Contrat trouvé sur Flow EVM Testnet');
      } catch (error) {
        console.error('❌ Erreur lors de la vérification du contrat:', error);
        throw error;
      }
      
      // Créer le BrowserProvider pour obtenir le signer de Privy
      const privyBrowserProvider = new ethers.BrowserProvider(privyProvider);
      const signer = await privyBrowserProvider.getSigner();
      
      // Créer deux instances du contrat : une pour la lecture, une pour l'écriture
      const factoryContractRead = new ethers.Contract(
        FACTORY_CONTRACT_ADDRESS,
        FACTORY_ABI,
        directProvider  // Provider direct pour la lecture
      );
      
      const factoryContractWrite = new ethers.Contract(
        FACTORY_CONTRACT_ADDRESS,
        FACTORY_ABI,
        signer  // Signer Privy pour l'écriture
      );

      // Utiliser getNFTInfo pour obtenir plus d'informations et diagnostiquer
      console.log('\n📋 RÉCUPÉRATION DES INFORMATIONS NFT...');
      try {
        if (!factoryContractRead.getNFTInfo) {
          throw new Error("Méthode getNFTInfo non trouvée dans le contrat");
        }
        const nftInfo = await factoryContractRead.getNFTInfo(tokenId);
        console.log('✅ Informations NFT récupérées:');
        console.log(`   - Adresse token fractionnel: ${nftInfo.fractionalTokenAddress}`);
        console.log(`   - Propriétaire NFT: ${nftInfo.nftOwner}`);
        console.log(`   - Total shares: ${nftInfo.totalShares}`);
        console.log(`   - Shares vendues: ${nftInfo.sharesSold}`);
        console.log(`   - Prix par share: ${ethers.formatEther(nftInfo.sharePrice)} FLOW`);
        console.log(`   - Trading activé: ${nftInfo.tradingEnabled}`);
        console.log(`   - Shares disponibles: ${nftInfo.availableShares}`);
        
        if (!nftInfo.tradingEnabled) {
          throw new Error('Le trading n\'est pas activé pour ce token');
        }
        
        if (nftInfo.availableShares === 0n) {
          throw new Error('Aucune part disponible à l\'achat');
        }
        
        // Utiliser le prix depuis getNFTInfo
        const sharePrice = nftInfo.sharePrice;
        console.log(`\n💰 Prix unitaire: ${ethers.formatEther(sharePrice)} FLOW`);
        
        // Préparer les paramètres de transaction (identiques à votre code)
        const txParams = {
          value: sharePrice,
          gasLimit: 300000,
          maxFeePerGas: ethers.parseUnits('100', 'gwei'),
          maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei')
        };
        
        console.log('\n⚙️ PARAMÈTRES DE TRANSACTION');
        console.log(`   Gas limit: ${txParams.gasLimit}`);
        console.log(`   Max fee per gas: ${ethers.formatUnits(txParams.maxFeePerGas, 'gwei')} Gwei`);
        console.log(`   Valeur: ${ethers.formatEther(sharePrice)} FLOW`);
        
        // Acheter 1 part avec les paramètres optimisés
        console.log('\n📤 ENVOI DE LA TRANSACTION');
        console.log('   Envoi en cours...');
        
        if (!factoryContractWrite.purchaseShares) {
          throw new Error("Méthode purchaseShares non trouvée dans le contrat");
        }
        const tx = await factoryContractWrite.purchaseShares(tokenId, 1, txParams);
        console.log(`   Hash: ${tx.hash}`);
        
        // Attendre la confirmation
        console.log('   Attente de confirmation...');
        const receipt = await tx.wait();
        console.log(`   ✅ Transaction confirmée dans le bloc ${receipt.blockNumber}`);
        console.log(`   Gas utilisé: ${receipt.gasUsed.toString()}`);
        
      } catch (error) {
        console.error('❌ Erreur lors de la récupération des informations NFT:', error);
        throw error;
      }
      
    } catch (error) {
      console.error("❌ Erreur lors de l'achat de parts:", error);
      
      // Afficher des détails sur l'erreur pour aider au debugging
      if (error instanceof Error) {
        console.error("Message d'erreur:", error.message);
        if ('code' in error) {
          console.error("Code d'erreur:", error.code);
        }
        if ('data' in error) {
          console.error("Données d'erreur:", error.data);
        }
      }
    } finally {
      setIsPurchasing(false);
    }
  }, [wallet, tokenId, wallets]);

  return (
    <div className="flex flex-col gap-4 p-4 border border-gray-200 rounded-lg">
      <div className="text-sm text-violet-700">
        {wallet.walletClientType === "privy" ? "Embedded " : ""}Wallet:{" "}
        {wallet.address.slice(0, 6)}...
        {wallet.address.slice(-4)}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => addSessionSigner(wallet.address)}
          disabled={isLoading || hasSessionSigners}
          className={`text-sm py-2 px-4 rounded-md text-white ${
            isLoading || hasSessionSigners
              ? "bg-violet-400 cursor-not-allowed"
              : "bg-violet-600 hover:bg-violet-700"
          }`}
        >
          {isLoading ? "Processing..." : "Add Session Signer"}
        </button>

        <button
          onClick={() => removeSessionSigner(wallet.address)}
          disabled={isLoading || !hasSessionSigners}
          className={`text-sm py-2 px-4 rounded-md text-white ${
            isLoading || !hasSessionSigners
              ? "bg-red-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {isLoading ? "Processing..." : "Remove Session Signer"}
        </button>
      </div>

      {hasSessionSigners && (
        <div className="mt-2 text-sm text-gray-600">
          This wallet has active session signers
        </div>
      )}

      <div className="flex flex-row gap-2">
        <button
          onClick={handleRemoteSign}
          disabled={isRemoteSigning || !hasSessionSigners}
          className={`text-sm py-2 px-4 rounded-md text-white ${
            isRemoteSigning || !hasSessionSigners
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isRemoteSigning ? "Signing..." : "Sign message from server"}
        </button>

        <button
          onClick={handleClientSign}
          disabled={isClientSigning}
          className={`text-sm py-2 px-4 rounded-md text-white ${
            isClientSigning
              ? "bg-green-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isClientSigning ? "Signing..." : "Sign message from client"}
        </button>
      </div>

      {/* Section d'achat de parts - uniquement pour les wallets Ethereum */}
      {wallet.chainType === "ethereum" && (
        <div className="mt-4 p-4 border border-orange-200 rounded-lg bg-orange-50">
          <h3 className="text-sm font-semibold text-orange-800 mb-3">
            🛒 Achat de Parts
          </h3>
          
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="tokenId" className="text-xs text-gray-600">
                Token ID:
              </label>
              <input
                id="tokenId"
                type="number"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="1"
                min="1"
              />
            </div>
            
            <button
              onClick={handlePurchaseShares}
              disabled={isPurchasing || !FACTORY_CONTRACT_ADDRESS}
              className={`text-sm py-2 px-4 rounded-md text-white ${
                isPurchasing || !FACTORY_CONTRACT_ADDRESS
                  ? "bg-orange-400 cursor-not-allowed"
                  : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              {isPurchasing ? "Achat en cours..." : "Acheter 1 Part"}
            </button>
            
            {!FACTORY_CONTRACT_ADDRESS && (
              <p className="text-xs text-red-500">
                ⚠️ Adresse du contrat factory non configurée
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
