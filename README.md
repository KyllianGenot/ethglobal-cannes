# NFT Fractionalization Smart Contract

## Overview
This smart contract system allows for the fractionalization of NFTs into tradeable shares. You define the total value of the artwork and the number of shares, and the system automatically calculates the price per share.

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

### Step 1: Contract Deployment
```bash
# Deploy contracts
forge script script/Deploy.s.sol --rpc-url https://testnet.evm.nodes.onflow.org --broadcast --private-key $PRIVATE_KEY
```

### Step 2: Create NFT Fractionalization
```bash
# Create Mona Lisa NFT worth 1144985116 USDf split into 54152822 shares
# Total price: 1144985116 USDf = 1144985116000000 units (1e6)
cast send $FACTORY_CONTRACT_ADDRESS \
"createFractionalizedNFT(uint256,uint256,string,string,string)" \
54152822 \
1144985116000000 \
"Mona Lisa" \
"MLISA" \
"data:application/json,{\"name\":\"Mona Lisa\",\"description\":\"The famous painting by Leonardo da Vinci\",\"image\":\"https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/687px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg\"}" \
--rpc-url https://testnet.evm.nodes.onflow.org \
--private-key $PRIVATE_KEY
```

### Step 3: Get the FractionalToken address
```bash
# Get the FractionalToken address for your NFT
FULL_ADDRESS=$(cast call $FACTORY_CONTRACT_ADDRESS "getFractionalToken(uint256)" $NFT_ID --rpc-url https://testnet.evm.nodes.onflow.org)
FRACTIONAL_TOKEN_ADDRESS=0x${FULL_ADDRESS:26}
echo "FractionalToken Address: $FRACTIONAL_TOKEN_ADDRESS"
```

### Step 4: Approve USDf spending
```bash
# Approve USDf spending (amount in USDf units, 1 USDf = 1000000 units)
# Example: Approve 1000 USDf
cast send $USDF_TOKEN_ADDRESS "approve(address,uint256)" $FRACTIONAL_TOKEN_ADDRESS 1000000000 \
--rpc-url https://testnet.evm.nodes.onflow.org \
--private-key $PRIVATE_KEY
```

### Step 5: Purchase shares
```bash
# Purchase shares through the Factory
cast send $FACTORY_CONTRACT_ADDRESS "purchaseShares(uint256,uint256)" $NFT_ID 1 \
--rpc-url https://testnet.evm.nodes.onflow.org \
--private-key $PRIVATE_KEY
```

**Important:** You must approve the FractionalToken contract (not the Factory contract) to spend your USDf. The Factory calls the FractionalToken, but the FractionalToken performs the actual transfer from your wallet.

## Withdrawing Funds (Owner Only)

### Withdraw USDf from FractionalToken
As the contract owner, you can withdraw the USDf collected from share purchases:

```bash
# Withdraw USDf from a specific NFT's FractionalToken to your wallet
cast send $FACTORY_CONTRACT_ADDRESS "withdrawFromFractionalToken(uint256)" $NFT_ID --rpc-url $RPC_URL --private-key $PRIVATE_KEY
```

## Visualization
View your NFTs on Flow EVM Testnet Explorer:
```
https://testnet.flowscan.org/evm/token/$NFT_CONTRACT_ADDRESS
```
