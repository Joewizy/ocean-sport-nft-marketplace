# OceanSport NFT Marketplace

A gasless NFT marketplace built on EVM with royalty support and real-time blockchain indexing.

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Wagmi** - Ethereum hooks for React
- **RainbowKit** - Wallet connection UI

### Smart Contracts
- **Solidity** - Smart contract language
- **Foundry** - Development framework
- **OpenZeppelin** - Secure contract libraries
- **ERC2771** - Gasless transaction support

### Blockchain & Indexing
- **Base Sepolia** - EVM testnet
- **[rIndexer](https://github.com/joshstevens19/rindexer)** - Real-time blockchain event indexing
- **GraphQL** - Query indexed data from database
- **Meta-transactions** - Gasless user experience

### Infrastructure
- **IPFS** - Decentralized file storage
- **Pinata** - IPFS pinning service
- **Gas Sponsorship** - Pay user gas fees
- **USDT Integration** - Multi-currency support

## 🚀 Features

- **Gasless Transactions** - Users don't pay gas fees
- **Royalty Support** - Automatic royalty distribution
- **Real-time Indexing** - Live blockchain event tracking
- **Multi-currency** - ETH and USDT payments
- **Auction System** - Live bidding with countdown timers
- **Responsive UI** - Modern, mobile-first design

## 🏃‍♂️ Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

```

## 📦 Environment Variables

```env
NEXT_PUBLIC_RPC_URL=your_rpc_url
NEXT_PUBLIC_SPONSOR_PRIVATE_KEY=your_sponsor_key
NEXT_PUBLIC_GAS_SPONSORSHIP_ENABLED=true
```

## 🔗 Live Demo

Visit the marketplace at `http://localhost:3000`

---

