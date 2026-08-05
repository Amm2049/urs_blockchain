# University Reward System (URS) � Living Spec

**Version:** 5 (from `University_Reward_System_v5.pdf`)  
**Role:** Single source of truth during implementation.  
**Rule:** If code must deviate from this file, choose the appropriate approach, then **update this file in the same change**.

Companion: `URS_Team_Delegation_Guide.pdf` (team split). Prefer this `spec.md` over PDFs when they disagree.

---

## What Changed in v5

- Voting Token dependency documented (Voting needs `CampusRewardToken` for CRT-gated eligibility).
- Frontend aligned to **7 pages**; added Activities; Admin Panel matches create ? confirm ? claim.
- `CampusRewardToken` uses explicit **minter/burner** roles (not Ownable-as-minter).
- Activity fields include **Confirmed Students**; NFT tiers = admin decision guided by CRT.
- Poll auto-close = **check-on-action** by `endTime`; CRT **decimals = 18**.
- Redemption fulfillment tracked **off-chain** (e.g. spreadsheet) for demo scope.
- Scope wording clarified (student registration / transaction history); minor typos fixed.

### Retained from v4

- No off-chain database; activities, rewards, redemptions on-chain.
- Title + CRT amount only (no long descriptions).
- No pickup/QR code; staff verify via on-chain record.
- NFT images/metadata on **GitLab** raw URLs (`tokenURI`).
- GitLab hosting centralized/mutable � accepted course tradeoff.

---

## Finalized Decisions

| Area | Decision |
|---|---|
| Earning flow | Admin creates activity ? students Join ? admin confirms attendance ? confirmed students `claim()` CRT |
| Eligible students | Self-registration; only confirmed can claim |
| Access control | Single admin via OpenZeppelin Ownable on admin-facing contracts |
| Student identity | Wallet = identity (pseudonymous); no university auth |
| CRT transferability | Locked (non-transferable between wallets) |
| CRT supply | Uncapped; minted via `claim()` after confirmation |
| CRT decimals | **18**; UI uses parseEther-style whole-CRT amounts |
| Token authorization | `setMinter` / `setBurner` (owner-only). ActivityManager mints; RewardManager burns. ActivityManager is **not** Token owner |
| Voting � concurrency | Multiple polls open at once |
| Voting � eligibility | ?1 CRT checked (not burned). Voting depends on Token |
| Voting � duration | Fixed `endTime`. Close = check-on-action on `vote()` (`block.timestamp < endTime`). No keeper |
| NFT model | Semester Bronze/Silver/Gold/Platinum. Admin chooses tier off-chain, guided by CRT (optionally claim count). No on-chain volunteer/competition fields |
| NFT transferability | Soulbound |
| Reward redemption | Burn CRT + on-chain record (user, reward, timestamp). Physical fulfillment + spreadsheet off-chain. No `markFulfilled` |
| Data storage | On-chain only (title + amount) |
| NFT metadata hosting | GitLab raw URLs |
| Frontend | React + Tailwind CSS |
| Chainlink | Out of scope |
| Demo gas | Admin pre-funds Sepolia ETH |

---

## Project Overview

### Background

Universities run workshops, competitions, seminars, volunteer events, etc., but participation is often low. Existing reward systems are centralized. URS uses blockchain for transparent, tamper-resistant rewards: students earn ERC20 CRT, redeem campus rewards, receive soulbound NFT badges, and vote on future rewards.

### Objectives

- Demonstrate course blockchain concepts
- ERC20 token system
- Multiple smart contracts
- DApp + MetaMask
- NFT achievements
- Decentralized voting

### Known Limitations

| Limitation | Description |
|---|---|
| Pseudonymous identity | No university ID ? wallet link |
| Single admin key | Ownable EOA is a single point of failure |
| GitLab NFT metadata | Centralized and mutable |
| Off-chain redemption fulfillment | Burn is on-chain; �handed out� tracked in spreadsheet to avoid double-fulfillment |

### Scope

| Included | Not included |
|---|---|
| Student wallet connection | University authentication / ID login |
| ERC20 reward token | Real payment processing |
| Reward distribution via activities | Student registration as university accounts (**activity Join is included**) |
| Reward redemption | Email |
| Voting | Mobile application |
| NFT achievements | Off-chain database |
| Transaction history via contract events / claim & redemption records | |

### User Roles

| Role | Responsibilities | Restrictions |
|---|---|---|
| Administrator | Create activities · Confirm attendance · Create rewards · Create polls · Manage platform configuration | Restricted on-chain & UI from joining activities (`AdminCannotJoin`), claiming CRT/NFTs (`AdminCannotClaim`), voting (`AdminCannotVote`), redeeming (`AdminCannotRedeem`), or holding NFTs (`AdminCannotReceiveNFT`). |
| Student | Connect wallet · Join activities · Claim CRT + NFT badges · View balance & dashboard · Redeem rewards · Vote on polls · View NFT gallery | Participant role; cannot call owner-only management functions. |

---

## Functional Requirements

### Module 1  Wallet Connection

Student can: connect MetaMask, disconnect, view address.

### Module 2 � ERC20 Campus Reward Token

| Field | Value |
|---|---|
| Name | Campus Reward Token |
| Symbol | CRT |
| Decimals | 18 |
| Supply | Uncapped � minted on confirmed `claim()` |
| Transferability | Locked |
| Authorization | Owner sets minter (ActivityManager) and burner (RewardManager) |

Admin: confirm attendance, view balances.  
Student: check balance, `claim()` (pays gas), redeem, qualify for voting.

### Module 3 � Activity Reward

On-chain activity: title + CRT amount. Flow:

1. Admin creates activity  
2. Students Join (eligible list)  
3. Admin confirms attendance  
4. Confirmed student `claim()` ? mint (double-claim guard)

Example: AI Workshop ? 20 CRT.

### Module 4 � Reward Redemption

| Reward | Cost |
|---|---|
| Coffee Coupon | 100 CRT |
| Library Extension | 150 CRT |
| Campus Hoodie | 500 CRT |

Flow: choose reward ? burn CRT ? on-chain record ? admin reads pending ? staff fulfill + mark spreadsheet off-chain. No pickup code/QR.

### Module 5 � Voting

| Rule | Setting |
|---|---|
| Concurrency | Multiple active polls |
| Eligibility | ?1 CRT via `CampusRewardToken.balanceOf` |
| Vote cost | None (check only) |
| Duration | Fixed endTime; check-on-action close |
| Vote limit | One vote per wallet per poll (`hasVoted`) |

### Module 6 — NFT Achievement

One soulbound **attendance badge** per activity claimed. Auto-minted by `ActivityManager.claim()` in the same transaction as the CRT reward — no admin step per badge.

Badge stores `activityId` + `activityTitle` on-chain. A student who attends and claims 5 activities holds 5 badges.

Deploy wiring: `AchievementNFT.setMinter(ActivityManager)` once. After that, minting is fully automatic.

### Module 7  Dashboard

Shows from contracts: wallet, CRT balance, NFTs, redeemed rewards, voting history.  
Transaction history = claim/redemption/vote/mint events and records  not a separate off-chain ledger.

---

## Non-Functional Requirements

| Category | Requirements |
|---|---|
| Security | Immutable after deploy; admin-only admin actions; only authorized minter/burner mint/burn; one claim per activity; single admin key accepted for demo |
| Performance | Sepolia; reads via contract view calls |
| Usability | Simple UI; minimal clicks; mobile-friendly optional |

---

## Smart Contract Architecture

| Contract | Base | Responsibilities |
|---|---|---|
| `CampusRewardToken.sol` | ERC20 + Ownable + minter/burner | Locked transfers; mint/burn via roles |
| `ActivityManager.sol` | — | Activities; Join; confirm; `claim()` (mints CRT + NFT badge); eligible/confirmed/claimed |
| `RewardManager.sol` | — | Reward catalog; redeem (burn); redemption history |
| `Voting.sol` | — | Token address in constructor; polls; CRT gate; `hasVoted`; endTime check |
| `AchievementNFT.sol` | ERC721 soulbound | Auto-minted by ActivityManager on `claim()`; Badge stores activityId + title; minter role |

### Deploy order

1. `CampusRewardToken`  
2. `AchievementNFT`  
3. `ActivityManager(tokenAddress, nftAddress, initialOwner)` + `RewardManager(tokenAddress, initialOwner)`  
4. `CampusRewardToken.setMinter(ActivityManager)` / `setBurner(RewardManager)`  
5. `AchievementNFT.setMinter(ActivityManager)`  
6. `Voting(tokenAddress, initialOwner)`  

---

## On-Chain Data Storage

**On-chain:** activities (title, amount, status, eligible/confirmed/claimed), reward catalog, redemptions, votes/polls.  
**GitLab:** NFT images + metadata JSON.  
Frontend reads via view functions only (no API/DB).

---

## Frontend Pages (7)

| Page | Contents |
|---|---|
| Landing | Intro � Connect Wallet |
| Activities | List � Join � Claim |
| Student Dashboard | Balance � NFTs � Redeemed � Voting history |
| Reward Store | Catalog � Redeem |
| Voting | Question � Options � Vote � Results |
| NFT Gallery | Grid (GitLab images) |
| Admin Panel | Create Activity � Confirm Attendance � Create Rewards � Pending redemptions � Mint NFTs � Create Poll |

---

## Blockchain Workflow

1. Activity created  
2. Join + admin confirm  
3. `claim()` ? authorized mint  
4. Redeem ? authorized burn ? off-chain fulfill  
5. Vote (eligibility + endTime + one-vote)  
6. Admin chooses tier, uploads GitLab assets, mints NFT  

---

## Technologies

| Category | Technology |
|---|---|
| Blockchain | Solidity, OpenZeppelin (Ownable, ERC20, ERC721) |
| Development | Hardhat |
| Frontend | React + Tailwind CSS, Ethers.js |
| Data | On-chain only |
| NFT storage | GitLab |
| Wallet | MetaMask |
| Network | Sepolia |

---

## Deliverables

- Solidity contracts  
- Frontend DApp  
- Deployment scripts  
- Project report  
- Presentation slides  
- Demo video (optional)  

---

## Future Enhancements

- QR attendance / redemption pickup  
- On-chain `markFulfilled(redemptionId)`  
- University ID login  
- Leaderboard, marketplace, multi-university, DAO, staking, mobile  
- Oracle dynamic rewards  
- AccessControl / multisig  
- IPFS for NFT metadata  
- Indexer/subgraph if view reads get too heavy  

---

## Activity Entity (on-chain fields)

- ID  
- Title  
- Reward Amount  
- Eligible Students (self-registered)  
- **Confirmed Students** (admin-confirmed; distinct from eligible)  
- Claimed Students  
- Status  

---

## Implementation sync notes

- `interfaces.md`: Frontend drafts stubs day 1; contract owners fill signatures/events. Record decimals = 18 and poll close semantics there too.
- When implementation choices conflict with this file, update **this file** in the same PR/commit as the code change.
