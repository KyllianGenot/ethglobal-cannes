# NFT Fractionalization Smart Contract

## Overview
This smart contract system allows for the fractionalization of NFTs into tradeable shares. Instead of setting a price per share, you define the total value of the artwork and the number of shares, and the system automatically calculates the price per share.

## Key Features
- Create and fractionalize NFTs
- Set total artwork value and number of shares
- Automatic share price calculation
- Purchase and sell shares
- Trading controls
- Metadata management

## Contract Architecture
- `NFTFractionalizationFactory.sol`: Main factory contract for creating and managing fractionalized NFTs
- `FractionalizedNFT.sol`: ERC721 contract for the NFTs
- `FractionalToken.sol`: ERC20 contract for the fractional shares

## Usage Guide

### 1. Contract Deployment
```bash
# Deploy contracts
forge script script/Deploy.s.sol --rpc-url https://testnet.evm.nodes.onflow.org --broadcast --private-key $PRIVATE_KEY
```

### 2. Creating a Fractionalized NFT
```bash
# Create an NFT with an image
# Format: totalShares totalPrice(in wei) name symbol imageURI
# Example: 1000 shares for a 1 FLOW artwork (1 FLOW = 1e18 wei)
cast send $FACTORY_CONTRACT_ADDRESS \
"createFractionalizedNFT(uint256,uint256,string,string,string)" \
1000 \
1000000000000000000 \
"My NFT" \
"MNFT" \
"data:application/json,{\"name\":\"My NFT\",\"description\":\"A test NFT\",\"image\":\"https://picsum.photos/500/500\"}" \
--rpc-url https://testnet.evm.nodes.onflow.org \
--private-key $PRIVATE_KEY
```

### 3. Share Management

#### View NFT Information
```bash
# Get fractional token address for NFT #ID
cast call $FACTORY_CONTRACT_ADDRESS "getFractionalToken(uint256)" $NFT_ID --rpc-url https://testnet.evm.nodes.onflow.org

# View NFT details (includes total shares, share price, etc.)
cast call $FACTORY_CONTRACT_ADDRESS "getNFTInfo(uint256)" $NFT_ID --rpc-url https://testnet.evm.nodes.onflow.org

# View share price (automatically calculated from total price / total shares)
cast call $FACTORY_CONTRACT_ADDRESS "getSharePrice(uint256)" $NFT_ID --rpc-url https://testnet.evm.nodes.onflow.org
```

#### Purchase Shares
```bash
# Calculate cost for X shares (sharePrice * number of shares)
# Example: For 10 shares of a 1 FLOW artwork with 1000 total shares
# Share price = 1 FLOW / 1000 = 0.001 FLOW per share
# Cost for 10 shares = 0.01 FLOW = 10000000000000000 wei
cast send $FACTORY_CONTRACT_ADDRESS "purchaseShares(uint256,uint256)" $NFT_ID 10 \
--value 10000000000000000 \
--rpc-url https://testnet.evm.nodes.onflow.org \
--private-key $PRIVATE_KEY
```

### 4. Example: Mona Lisa Fractionalization
```bash
# Create Mona Lisa NFT worth 100 FLOW split into 1000 shares
# Total price: 100 FLOW = 100000000000000000000 wei (1e20)
# Share price will be automatically calculated as 0.1 FLOW per share
cast send $FACTORY_CONTRACT_ADDRESS \
"createFractionalizedNFT(uint256,uint256,string,string,string)" \
1000 \
100000000000000000000 \
"Mona Lisa" \
"MLISA" \
"data:application/json,{\"name\":\"Mona Lisa\",\"description\":\"The famous painting by Leonardo da Vinci\",\"image\":\"https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/687px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg\"}" \
--rpc-url https://testnet.evm.nodes.onflow.org \
--private-key $PRIVATE_KEY

# Purchase 1 share (0.1 FLOW since total price is 100 FLOW split into 1000 shares)
cast send $FACTORY_CONTRACT_ADDRESS "purchaseShares(uint256,uint256)" 1 1 \
--value 100000000000000000 \
--rpc-url https://testnet.evm.nodes.onflow.org \
--private-key $PRIVATE_KEY
```

### 5. Price Management
```bash
# Update total price of an NFT (only owner)
# Example: Update to 200 FLOW total value
cast send $FACTORY_CONTRACT_ADDRESS "updateTotalPrice(uint256,uint256)" $NFT_ID 200000000000000000000 \
--rpc-url https://testnet.evm.nodes.onflow.org \
--private-key $PRIVATE_KEY
```

## Environment Variables
```bash
export PRIVATE_KEY=your_private_key_here
export YOUR_ADDRESS=your_wallet_address_here
export FACTORY_CONTRACT_ADDRESS=deployed_factory_address
export NFT_CONTRACT_ADDRESS=deployed_nft_address
```

## Price Calculation Examples
For an NFT worth 100 FLOW split into 1000 shares:
- Total Price: 100 FLOW = 100000000000000000000 wei
- Share Price: 0.1 FLOW = 100000000000000000 wei (automatically calculated)
- Cost for 10 shares: 1 FLOW = 1000000000000000000 wei

## Important Notes
- All prices are in wei (1 FLOW = 1e18 wei)
- Share price is automatically calculated as (total price / total shares)
- Ensure total price and shares result in a non-zero share price
- Contract addresses change after each deployment
- Keep your private keys secret

## Contract Addresses (Flow EVM Testnet)
- Factory Contract: `$FACTORY_CONTRACT_ADDRESS`
- NFT Contract: `$NFT_CONTRACT_ADDRESS`

## Visualization
View your NFTs on Flow EVM Testnet Explorer:
```
https://testnet.flowscan.org/evm/token/$NFT_CONTRACT_ADDRESS
```
