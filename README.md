<div align="center">
  <img src="public/assets/predifi-logo.png" alt="Predifi Logo" width="200"/>
  
  # Predifi
  
  ### The Future of Decentralized Prediction Markets
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)
  
  [Website](https://predifi.com) • [Documentation](https://docs.predifi.com) • [API Reference](https://docs.predifi.com/api)
  
</div>

---

## 🎯 What is Predifi? 

**Predifi** is a next-generation decentralized prediction market platform that combines institutional-grade trading infrastructure with the transparency and accessibility of blockchain technology. We're building the future of event-driven markets where users can trade on real-world outcomes across politics, sports, crypto, and more.

### Core Products

🔹 **Native CLOB Prediction Market** - Professional orderbook-based prediction market with off-chain matching and on-chain settlement

🔹 **Multi-Venue Aggregator** - Unified interface aggregating liquidity from Predifi, Polymarket, and Limitless for optimal pricing

🔹 **Arbitrage Engine** - Real-time detection of profitable price discrepancies across multiple prediction market venues

🔹 **Liquidity Vaults** - Soft staking system allowing users to commit capital and earn rewards without lock periods

---

## 🚀 Why Predifi?

### For Traders
- **Best Prices Guaranteed** - Smart routing across multiple venues ensures optimal execution
- **Deep Liquidity** - Aggregated orderbooks provide superior depth and tighter spreads
- **Professional Tools** - Advanced charting, real-time data, and institutional-grade infrastructure
- **Non-Custodial** - Your keys, your crypto - no account creation or KYC required

### For Liquidity Providers
- **Flexible Staking** - Commit USDC/USDT without lock periods
- **Transparent Rewards** - Clear fee structure with 2% resolution fees (max 5%)
- **Multi-Strategy Vaults** - Diversified exposure across crypto, sports, politics, and more
- **Leaderboard & Rankings** - Compete for top positions and exclusive badges

### For Developers
- **Unified API** - Single interface to access multiple prediction market venues
- **Real-time WebSockets** - Live price feeds and market updates
- **Open Source** - Transparent smart contracts and audited code
- **SDK Support** - Easy integration with comprehensive documentation

---

## 🛠 Technology Stack

**Frontend**
- React 18 + TypeScript
- Vite (Build Tool)
- Tailwind CSS + shadcn/ui
- React Query (State Management)
- Framer Motion (Animations)

**Blockchain & Web3**
- Ethers.js
- Wagmi + Viem
- Alchemy Account Kit
- EIP-712 Signatures
- Multi-chain Support (Optimism, BSC)

**Backend Integration**
- Node.js Microservices
- MongoDB (Markets)
- Supabase (Users & Vaults)
- Redis (Caching)
- Vector Search (Market Discovery)

**Smart Contracts**
- Solidity ^0.8.25
- OpenZeppelin (UUPS Upgradeable)
- Stork Oracle Integration
- Gas-Optimized Settlement

---

## 📦 Getting Started

### Prerequisites

- Node.js 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- npm or pnpm
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/Predifi-com/predifi-app.git

# Navigate to the project directory
cd predifi-app

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start the development server
npm run dev
```

The application will be available at `http://localhost:8080`

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

---

## 🏗 Project Structure

```
predifi-app/
├── src/
│   ├── components/      # Reusable React components
│   ├── pages/          # Page components (routing)
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API clients and services
│   ├── lib/            # Utility functions
│   ├── types/          # TypeScript type definitions
│   ├── assets/         # Static assets (images, logos)
│   └── config/         # Configuration files
├── public/             # Public static files
├── supabase/           # Supabase functions
└── contracts/          # Smart contracts (separate repo)
```

---

## 🎨 Key Features

### Trading
- Real-time orderbook visualization
- Market depth charts with TradingView integration
- Instant trade execution with EIP-712 signatures
- Portfolio tracking and PnL analytics
- Price alerts and notifications

### Markets
- Infinite scroll with lazy loading
- Advanced filtering (category, venue, status)
- Vector-based semantic search
- Real-time price updates via WebSocket
- Cross-venue price comparison

### Vaults
- USDC and USDT liquidity vaults
- Flexible commitment (no lock period)
- Tier-based ranking system (Whale, Diamond, Gold, Silver, Bronze)
- Referral rewards program
- Social sharing with AI-generated images

### Arbitrage
- Real-time opportunity scanning
- Multi-venue spread detection
- Risk assessment scoring
- Profit estimation calculator
- Execution routing optimization

---

## 🔐 Security

- **Non-Custodial** - Users maintain full control of their funds
- **Audited Smart Contracts** - Third-party security audits
- **EIP-712 Signatures** - Secure off-chain order signing
- **Role-Based Access Control** - Multi-sig admin operations
- **Upgradeable Contracts** - UUPS proxy pattern for security updates

---

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting PRs.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### Copyright Notice

```
Copyright (c) 2025 Predifi Protocol

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Support & Community

- **Website:** [https://predifi.com](https://predifi.com)
- **Documentation:** [https://docs.predifi.com](https://docs.predifi.com)
- **Twitter:** [@Predifi_com](https://twitter.com/Predifi_com)
- **Discord:** [Join our community](https://discord.gg/predifi)
- **Email:** admin@predifi.com

---

<div align="center">
  
  **Trade Tomorrow, Today** 🚀
  
  Made with passion by [Predifi Protocol](https://predifi.com)
  
</div>

