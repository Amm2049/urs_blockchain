# 🎓 URS — University Reward System

A transparent, decentralized dApp built on **Ethereum (Sepolia Testnet)**. The platform enables university students to participate in campus activities, earn **Campus Reward Tokens (CRT)**, collect **Soulbound NFT Badges**, redeem campus perks (coffee, merchandise, library access), and vote on university polls.

---

## 🌟 Features & Highlights

- ⚡ **Earn CRT & NFT Badges**: Students register for campus activities, get attendance confirmed on-chain by the admin, and claim both CRT tokens and a non-transferable (soulbound) NFT achievement badge.
- 🛍️ **Reward Store**: Spend earned CRT tokens to redeem real-world campus perks.
- 🗳️ **Governance Voting**: Hold at least 1 CRT to participate in campus improvement polls (1 vote per student per poll).
- 🛡️ **Admin Control Panel**: Dedicated dashboard for creating activities, confirming attendance, managing store items, and opening polls.
- 🎨 **Modern Minimal Web3 UI**: Designed with an Emerald & Cyan dark theme, live transaction status feedback, custom dialog modals, and full Sepolia network warning system.

---

## 📜 Deployed Contracts (Ethereum Sepolia Testnet)

| Contract | Address | Description |
|---|---|---|
| **CampusRewardToken** | [`0xae456bf71aA0156723497398224AAB4eE3014C64`](https://sepolia.etherscan.io/address/0xae456bf71aA0156723497398224AAB4eE3014C64) | ERC-20 utility & reward token |
| **AchievementNFT** | [`0x8c971c0e34340A8CB2eb72E39bBEf52b5640621B`](https://sepolia.etherscan.io/address/0x8c971c0e34340A8CB2eb72E39bBEf52b5640621B) | Soulbound ERC-721 achievement badges |
| **ActivityManager** | [`0xC49007a7EFdA3fD32ce9f12b239F8611BBA395b6`](https://sepolia.etherscan.io/address/0xC49007a7EFdA3fD32ce9f12b239F8611BBA395b6) | Handles activity creation, registration & claiming |
| **RewardManager** | [`0xb67FA91Cd2371413212B78c2EF50fCD53DC16bD3`](https://sepolia.etherscan.io/address/0xb67FA91Cd2371413212B78c2EF50fCD53DC16bD3) | Manages reward catalog & redemption processing |
| **Voting** | [`0x502Ff7Ac7009a239C0C235Cbe94E3B7B4dAa0C01`](https://sepolia.etherscan.io/address/0x502Ff7Ac7009a239C0C235Cbe94E3B7B4dAa0C01) | On-chain governance voting system |

**Deployer / Admin Wallet:** `0x652DF2B786544d856Fed243722D165A3A1567D73`

---

## 🏗️ Architecture & Wiring

```mermaid
graph TD
    Admin[Admin Wallet] -->|Creates Activity / Confirms Attendance| AM[ActivityManager]
    Admin -->|Creates / Toggles Perks| RM[RewardManager]
    Admin -->|Opens Polls| V[Voting]

    Student[Student Wallet] -->|Join & Claim| AM
    AM -->|Mints CRT Reward| CRT[CampusRewardToken]
    AM -->|Mints Soulbound Badge| NFT[AchievementNFT]

    Student -->|Redeem Perk| RM
    RM -->|Burns CRT Cost| CRT

    Student -->|Cast Vote (requires 1 CRT)| V
```

---

## 🛠️ Technology Stack

- **Smart Contracts**: Solidity `^0.8.20`, OpenZeppelin Contracts
- **Development Framework**: Hardhat, Ethers.js v5
- **Frontend**: React (Vite), TailwindCSS, Heroicons
- **Web3 Integration**: Ethers.js, MetaMask Web3Provider

---

## 📁 Repository Structure

```
├── contracts/               # Solidity Smart Contracts
│   ├── AchievementNFT.sol
│   ├── ActivityManager.sol
│   ├── CampusRewardToken.sol
│   ├── RewardManager.sol
│   └── Voting.sol
├── frontend/                # React Vite Web3 dApp
│   ├── src/
│   │   ├── components/      # Navbar, TxButton, ConfirmDialog
│   │   ├── contracts/       # Deployed ABIs & Addresses
│   │   ├── hooks/           # useWallet provider
│   │   └── pages/           # Landing, Activities, Store, Voting, Dashboard, Admin
│   ├── index.html
│   └── tailwind.config.js
├── scripts/                 # Hardhat deployment scripts
├── test/                    # Comprehensive Hardhat unit tests
├── hardhat.config.js
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ and `npm`
- [MetaMask](https://metamask.io/) browser extension configured for **Ethereum Sepolia Testnet**
- Sepolia Testnet ETH ([Get from Sepolia Faucet](https://sepoliafaucet.com/))

### 1. Installation

Clone the repository and install root dependencies (for smart contracts & testing):

```bash
git clone https://github.com/Amm2049/urs_blockchain.git
cd urs_blockchain
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

### 2. Run Smart Contract Tests

```bash
# From root directory
npx hardhat test
```

### 3. Run Frontend Locally

```bash
# From root directory
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
