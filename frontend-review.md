# 🎨 University Reward System (URS) — Frontend Architecture & Review Guide

This document provides a complete technical and visual review of the frontend application for the **University Reward System (URS)**. It covers the folder structure, state management, Ethers.js integration, role-based navigation, page breakdown, and contract workflows.

---

## 1. Executive Summary & Technology Stack

| Category | Technology |
|---|---|
| **Framework** | React 18 (Vite) |
| **Styling** | Vanilla CSS + Tailwind CSS (Custom Dark Theme & Glassmorphism) |
| **Blockchain Library** | Ethers.js v5 |
| **Routing** | React Router DOM v6 |
| **Icon Set** | `@heroicons/react` v2 (Outline) |
| **Target Network** | Ethereum Sepolia Testnet (`Chain ID: 11155111`) |

### Design Aesthetics
- **Theme**: Dark mode palette (`#090d16` background) with sleek glassmorphism card overlays.
- **Accents**: Neon purple (`#aa3bff`) to cyan (`#00f2fe`) brand gradients and amber (`CRT`) / emerald (`Confirmed`) status pills.
- **Micro-Animations**: CSS keyframe transitions (`animate-fade-in`, `animate-slide-up`, glow rings, pulsed loading spinners).

---

## 2. Directory Structure & File Overview

```
frontend/
├── index.html                  # HTML entry point with Google Fonts (Inter)
├── package.json                # Dependencies (react, ethers, react-router-dom, tailwindcss)
├── vite.config.js              # Vite build configuration
└── src/
    ├── App.jsx                 # Global router setup, layout shell, navbar & footer integration
    ├── App.css                 # Custom glassmorphism utilities, badge pills, animations
    ├── index.css               # Tailwind CSS directives & base styles
    ├── main.jsx                # Application root rendering <App />
    │
    ├── contracts/
    │   └── index.js            # Deployed Sepolia addresses, Admin address, contract ABIs
    │
    ├── hooks/
    │   └── useWallet.jsx       # Global React Context Provider for MetaMask connection & contracts
    │
    ├── components/
    │   ├── Navbar.jsx          # Header navigation bar with role-based routing & wallet status
    │   ├── TxButton.jsx        # Transaction submit button with loading spinner & disabled states
    │   └── ConfirmDialog.jsx   # Glassmorphic modal confirmation dialog for destructive actions
    │
    └── pages/
        ├── Landing.jsx         # Onboarding hero section for students. Auto-redirects admins to /admin.
        ├── Activities.jsx      # Activity list. Students join & claim CRT/NFTs; admins see view-only notice.
        ├── Dashboard.jsx       # Student overview (CRT balance, earned badges, vote/redemption history).
        ├── RewardStore.jsx     # CRT reward catalog for redemption. Admins see catalog view-only notice.
        ├── Voting.jsx          # CRT-gated polls (≥1 CRT required). Admins view results without voting.
        ├── NFTGallery.jsx      # Soulbound achievement badges grid for student participants.
        └── AdminPanel.jsx      # Tabbed Command Center for admin activities, rewards, polls & redemptions.
```

---

## 3. Core Architecture & State Management (`useWallet.jsx`)

The frontend state management is powered by the `WalletProvider` context ([useWallet.jsx](file:///c:/Users/MSI/OneDrive/Desktop/Blockchain/frontend/src/hooks/useWallet.jsx)).

### Key Responsibilities:
1. **MetaMask Connection**: Triggers `window.ethereum.request({ method: 'eth_requestAccounts' })` and initializes `ethers.providers.Web3Provider`.
2. **Admin Role Detection (`isAdmin`)**:
   ```javascript
   const isAdmin = account
     ? account.toLowerCase() === ADMIN_ADDRESS.toLowerCase()
     : false;
   ```
3. **Network Validation (`isWrongNetwork`)**: Checks if `chainId === 11155111` (Sepolia). If on another network, displays a warning pill in the navbar.
4. **Contract Factories**: Provides read-only contract instances (via `provider`) and write contract instances (via `signer`):
   - **Read Contracts**: `contracts.CRT()`, `contracts.NFT()`, `contracts.Activity()`, `contracts.Reward()`, `contracts.Voting()`
   - **Write Contracts**: `contracts.CRTw()`, `contracts.NFTw()`, `contracts.Activityw()`, `contracts.Rewardw()`, `contracts.Votingw()`
5. **Event Event Listeners**: Listens to `accountsChanged` and `chainChanged` on `window.ethereum` to automatically handle account switches or network reloads.

---

## 4. Role-Based Navigation & Security Guards

The application strictly separates **Student** and **Administrator** flows both on-chain and in the user interface.

### Role Differences:

| Feature | Student Role | Admin Role (`0x652D...7D73`) |
|---|---|---|
| **Navbar** | `Home`, `Activities`, `Dashboard`, `Reward Store`, `Voting`, `NFT Gallery` | `Admin Command Center` |
| **Landing (`/`)** | Hero banner & onboarding | Auto-redirects to `/admin` |
| **Activities (`/activities`)** | Can click `Join` and `Claim CRT + Badge` | Action buttons replaced with *"Admins manage activities from the Admin Panel"* |
| **Reward Store (`/store`)** | Can click `Redeem for X CRT` | Redeem button replaced with *"Admins manage rewards from the Admin Panel"* |
| **Voting (`/voting`)** | Can cast votes on open polls (requires ≥1 CRT) | Voting options disabled; displays live results & admin notice |
| **NFT Gallery (`/gallery`)** | Displays student's soulbound NFT collection | Displays Admin banner explaining badges are for students |
| **Dashboard (`/dashboard`)** | Shows personal balance, badges, and history | Displays Admin Command Hub card with shortcut to `/admin` |
| **Admin Panel (`/admin`)** | Blocked with *"Access Denied: Admin wallet only"* | Full access to command center dashboard |

---

## 5. Admin Command Center ([AdminPanel.jsx](file:///c:/Users/MSI/OneDrive/Desktop/Blockchain/frontend/src/pages/AdminPanel.jsx))

The redesigned Admin Panel is structured as an interactive command center dashboard.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Admin Command Center                               │
│  [Total Activities: X] [Confirmed Claims: Y] [Active Rewards: Z] [Polls: N]│
├─────────────────────────────────────────────────────────────────────────────┤
│  [⚡ Activities]   [🎁 Reward Catalog]   [🗳️ Voting Polls]   [📋 Redemptions]│
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tab Breakdown:

#### ⚡ Tab 1: Activities Management
- **Create Activity Card**: Input title + CRT reward amount → calls `Activityw().createActivity()`.
- **Activity Cards Grid**:
  - Displays activity status pill (`Open` / `Closed`).
  - **Quick Close**: Direct button on open activity card calling `closeActivity(id)` with confirm modal.
  - **One-Click Student Confirmation**: Lists registered student wallet addresses with a direct **Confirm** button next to each address. Clicking calls `confirmAttendance(actId, studentAddress)` without manual copy-pasting.

#### 🎁 Tab 2: Reward Store Catalog
- **Add Reward Item Card**: Input title + CRT cost → calls `Rewardw().createReward()`.
- **Reward Cards Grid**: Displays cost in CRT and availability pill (`Active` / `Inactive`).
- **One-Click Availability Toggle**: Direct `Activate` / `Deactivate` toggle button on each card calling `setRewardActive(id, !active)`.

#### 🗳️ Tab 3: Voting Polls Management
- **Create Poll Form**: Question, dynamic list of options (Add Option button), and datetime-local picker.
- **Polls Governance List**: Displays active/past polls with live vote percentage progress bars for each option.

#### 📋 Tab 4: Redemptions Log
- Audit log listing student CRT redemptions (Student Address, Reward Title, CRT Burned `-X CRT`, Timestamp, and Refresh button).

---

## 6. End-to-End Student Lifecycle Workflow

Here is how a student interacts with the contracts through the frontend:

```
┌──────────────┐     1. Join      ┌──────────────────────┐
│   Student    │ ───────────────> │ ActivityManager.sol  │ (isEligible = true)
└──────────────┘                  └──────────────────────┘
       │                                     │
       │                                     │ 2. Confirm Attendance
       │                                     ▼
       │                          ┌──────────────────────┐
       │                          │ Admin Panel (/admin) │ (calls confirmAttendance)
       │                          └──────────────────────┘
       │                                     │
       │     3. Claim CRT + Badge            ▼
       ├────────────────────────> ┌──────────────────────┐
       │                          │ ActivityManager.sol  │ ──> Mints CRT to Student
       │                          └──────────────────────┘ ──> Mints Soulbound NFT Badge
       │                                     │
       │ 4. Redeem Perks / Vote              │
       ├─────────────────────────────────────┴─────────────────────────┐
       ▼                                                               ▼
┌──────────────────────┐                                    ┌──────────────────────┐
│  RewardManager.sol   │ (burns CRT for perk)               │      Voting.sol      │ (casts vote if balance >= 1 CRT)
└──────────────────────┘                                    └──────────────────────┘
```

---

## 7. Component Reference

### `<Navbar />` ([Navbar.jsx](file:///c:/Users/MSI/OneDrive/Desktop/Blockchain/frontend/src/components/Navbar.jsx))
- Sticky header with backdrop-blur glassmorphism.
- Renders URS logo, network warning pill (`Sepolia Testnet`), dynamic nav links depending on `isAdmin`, and MetaMask Connect/Disconnect button.

### `<TxButton />` ([TxButton.jsx](file:///c:/Users/MSI/OneDrive/Desktop/Blockchain/frontend/src/components/TxButton.jsx))
- Standardized transaction button supporting variants (`primary`, `success`, `danger`).
- Manages loading spin animation and disabled states during wallet signature / transaction confirmation.

### `<ConfirmDialog />` ([ConfirmDialog.jsx](file:///c:/Users/MSI/OneDrive/Desktop/Blockchain/frontend/src/components/ConfirmDialog.jsx))
- Modal overlay used for destructive operations (e.g. closing an activity or deactivating a reward).

---

## 8. Running & Verifying the Frontend

### Local Development
Run the Vite development server from the repository root:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser with MetaMask installed.

### Production Build
Validate production bundling:
```bash
npm run build
```
The output production bundle will be generated in `frontend/dist/`.
