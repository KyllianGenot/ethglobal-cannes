# NFT Fractionalization Commands Guide

## 1. Contract Deployment
```bash
# Deploy contracts
forge script script/Deploy.s.sol --rpc-url https://testnet.evm.nodes.onflow.org --broadcast --private-key $PRIVATE_KEY
```

## 2. Creating an NFT
```bash
# Create an NFT with an image
# Format: totalShares sharePrice(in wei) name symbol imageURI
# Example: 1000 shares at 0.001 FLOW per share
cast send $FACTORY_CONTRACT_ADDRESS \
"createFractionalizedNFT(uint256,uint256,string,string,string)" \
1000 \
1000000000000000 \
"My NFT" \
"MNFT" \
"data:application/json,{\"name\":\"My NFT\",\"description\":\"A test NFT\",\"image\":\"https://picsum.photos/500/500\"}" \
--rpc-url https://testnet.evm.nodes.onflow.org \
--private-key $PRIVATE_KEY
```

## 3. Share Management

### View NFT Information
```bash
# Get fractional token address for NFT #ID
cast call $FACTORY_CONTRACT_ADDRESS "getFractionalTokenAddress(uint256)" $NFT_ID --rpc-url https://testnet.evm.nodes.onflow.org

# View total shares
cast call $FRACTIONAL_TOKEN_ADDRESS "totalSupply()" --rpc-url https://testnet.evm.nodes.onflow.org

# View available shares
cast call $FRACTIONAL_TOKEN_ADDRESS "getAvailableShares()" --rpc-url https://testnet.evm.nodes.onflow.org

# View price per share
cast call $FRACTIONAL_TOKEN_ADDRESS "sharePrice()" --rpc-url https://testnet.evm.nodes.onflow.org
```

### Purchase Shares
```bash
# Purchase X shares (value = X * price_per_share in FLOW)
cast send $FRACTIONAL_TOKEN_ADDRESS "purchaseShares(uint256)" $SHARE_AMOUNT \
--value $TOTAL_AMOUNT_IN_WEI \
--rpc-url https://testnet.evm.nodes.onflow.org \
--private-key $PRIVATE_KEY
```

### Check Your Balance
```bash
# View how many shares you own
cast call $FRACTIONAL_TOKEN_ADDRESS "balanceOf(address)" $YOUR_ADDRESS --rpc-url https://testnet.evm.nodes.onflow.org
```

## 4. Complete Example with Mona Lisa
```bash
# 1. Create Mona Lisa NFT (1000 shares at 0.001 FLOW each)
cast send $FACTORY_CONTRACT_ADDRESS \
"createFractionalizedNFT(uint256,uint256,string,string,string)" \
1000 \
1000000000000000 \
"Mona Lisa" \
"MLISA" \
"data:application/json,{\"name\":\"Mona Lisa\",\"description\":\"The famous painting by Leonardo da Vinci\",\"image\":\"https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/687px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg\"}" \
--rpc-url https://testnet.evm.nodes.onflow.org \
--private-key $PRIVATE_KEY

# 2. Purchase 1 share (0.001 FLOW)
cast send $FRACTIONAL_TOKEN_ADDRESS "purchaseShares(uint256)" 1 \
--value 1000000000000000 \
--rpc-url https://testnet.evm.nodes.onflow.org \
--private-key $PRIVATE_KEY
```

## 5. Additional Useful Commands

### Check Existing NFTs
```bash
# View total number of NFTs created
cast call $FACTORY_CONTRACT_ADDRESS "getTotalNFTs()" --rpc-url https://testnet.evm.nodes.onflow.org

# View NFT URI
cast call $NFT_CONTRACT_ADDRESS "tokenURI(uint256)" $NFT_ID --rpc-url https://testnet.evm.nodes.onflow.org

# View NFT owner
cast call $NFT_CONTRACT_ADDRESS "ownerOf(uint256)" $NFT_ID --rpc-url https://testnet.evm.nodes.onflow.org
```

### Check Your Balance
```bash
# View your FLOW balance
cast balance $YOUR_ADDRESS --rpc-url https://testnet.evm.nodes.onflow.org
```

## Environment Variables
For easier usage, set these environment variables:
```bash
export PRIVATE_KEY=your_private_key_here
export YOUR_ADDRESS=your_wallet_address_here
export FACTORY_CONTRACT_ADDRESS=deployed_factory_address
export NFT_CONTRACT_ADDRESS=deployed_nft_address
export FRACTIONAL_TOKEN_ADDRESS=fractional_token_address
```

## Important Notes
- Replace environment variables with your actual values
- Contract addresses change after each deployment
- Flow EVM uses wei units: 1 FLOW = 1000000000000000000 wei (1e18)
- Payments are in FLOW tokens but calculated in wei units for EVM compatibility
- Keep your private keys secret and never share them

## Contract Addresses (Flow EVM Testnet)
- Factory Contract: `$FACTORY_CONTRACT_ADDRESS`
- NFT Contract: `$NFT_CONTRACT_ADDRESS`
- Example Fractional Token: `$FRACTIONAL_TOKEN_ADDRESS`

## Visualization

### View NFT Collection
To view your NFT collection, visit:
```
https://evm-testnet.flowscan.io/token/$NFT_CONTRACT_ADDRESS/
```
Replace `$NFT_CONTRACT_ADDRESS` with your actual NFT contract address.

### View Individual NFTs and Shares
To view your NFTs and their shares:
1. Go to [Flow EVM Testnet Explorer](https://testnet.flowscan.org/evm)
2. Search for the NFT contract or fractional token address
3. In the "Tokens" section, you'll see your NFTs and their details

## Price Calculations (Flow EVM uses wei units)
- 1 share = 0.001 FLOW = 1000000000000000 wei
- 10 shares = 0.01 FLOW = 10000000000000000 wei
- 100 shares = 0.1 FLOW = 100000000000000000 wei
