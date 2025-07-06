# 🎨 Galerie - NFT Fractionalization Platform

> Buy and trade shares of real-world artworks onchain—accessible, instant, and fully transparent.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-View%20Site-blue?style=for-the-badge)](https://galerie-fi.vercel.app/)
[![Flow Blockchain](https://img.shields.io/badge/Blockchain-Flow%20EVM-green?style=for-the-badge)](https://flow.com/)
[![Privy Integration](https://img.shields.io/badge/Account%20Abstraction-Privy-purple?style=for-the-badge)](https://privy.io/)

## 📖 Overview

Galerie is a blockchain-based platform that democratizes access to high-value art investment by allowing anyone to purchase fractional shares of real-world artworks. Built on the Flow blockchain with account abstraction via Privy, the platform provides a seamless experience for both crypto-native and traditional users.

### 🎯 Key Features

- **Fractional Art Ownership**: Purchase shares of expensive artworks with minimal capital
- **Seamless Onboarding**: Email/social login with no crypto wallet management required
- **Real-time Trading**: Buy and sell art shares instantly on the marketplace
- **Transparent Ownership**: All records stored immutably on-chain
- **Fiat & Crypto Support**: Fund your account with traditional or digital currencies

## 🏗️ Architecture

This project is structured as a monorepo with three main components:

```
nft-fractionalization/
├── flow-smart-contract/    # Solidity smart contracts
├── landing/               # Marketing landing page
└── marketplace/           # Main dApp application
```

## 🏛️ Smart Contracts

The smart contract system consists of three main contracts deployed on Flow EVM:

### `NFTFractionalizationFactory.sol`
- **Purpose**: Main orchestrator for creating fractionalized NFTs
- **Key Functions**:
  - `createFractionalizedNFT()`: Creates new NFT + fractional tokens
  - `purchaseShares()`: Handles share purchases
  - `updateTotalPrice()`: Updates artwork valuation

### `FractionalizedNFT.sol`
- **Purpose**: ERC-721 contract for the underlying artworks
- **Key Functions**:
  - `mint()`: Creates new NFTs (owner only)
  - `tokenURI()`: Returns metadata URI
  - `getFractionalContract()`: Links NFT to its fractional tokens

### `FractionalToken.sol`
- **Purpose**: ERC-20 tokens representing fractional ownership
- **Key Functions**:
  - `purchaseShares()`: Buy fractional shares
  - `sellShares()`: Sell fractional shares
  - `updateSharePrice()`: Adjust pricing (owner only)

## 🎨 Frontend Applications

### Landing Page (`/landing`)
- **Tech Stack**: React + Vite
- **Purpose**: Marketing site and user onboarding
- **Features**: Hero section, features overview, call-to-action

### Marketplace (`/marketplace`)
- **Tech Stack**: Next.js + React + TypeScript + Tailwind CSS
- **Purpose**: Main dApp for art investment and trading
- **Key Features**:
  - User authentication via Privy
  - Artwork browsing and discovery
  - Share purchasing and management
  - Portfolio tracking
  - Real-time market data

## 🔐 Authentication & Account Abstraction

We use **Privy** for seamless user onboarding:

- **Email/Social Login**: No crypto wallet required
- **Automatic Wallet Creation**: Privy handles wallet management
- **Fiat Onramp**: Easy funding with traditional payment methods
- **Cross-Platform Sync**: Consistent experience across devices

## 🌊 Flow Blockchain Integration

Built on **Flow EVM** for optimal performance:

- **Scalability**: High throughput for trading operations
- **Low Fees**: Cost-effective transactions
- **Developer-Friendly**: Rich tooling and documentation
- **User Experience**: Fast confirmations and smooth interactions

## 📦 Technology Stack

### Blockchain
- **Flow EVM**: Scalable blockchain infrastructure
- **Solidity**: Smart contract development
- **Foundry**: Development framework

### Frontend
- **Next.js**: React framework for marketplace
- **React**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Vite**: Build tool for landing page

### Authentication & Infrastructure
- **Privy**: Account abstraction and wallet management
- **Ethers.js**: Ethereum/Flow interaction
- **Axios**: HTTP client

---

**Built for the ETHGlobal Cannes 2025** 