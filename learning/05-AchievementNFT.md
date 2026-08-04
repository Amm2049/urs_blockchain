# Slice 05 — AchievementNFT

**Status:** Done · 12 tests passing  
**Files:** `contracts/AchievementNFT.sol` · `contracts/ActivityManager.sol` (updated) · `test/AchievementNFT.test.js` · `test/ActivityManager.test.js` (updated) · `interfaces.md`  
**Depends on:** `ActivityManager` (minter role wired to it after deploy)

Read this beside the two contracts. Flow to memorize: **student calls claim() → CRT minted + NFT badge auto-minted in the same tx**.

---

## What this slice is for

AchievementNFT gives students a visible, on-chain proof of every activity they attended. The key change from the old semester-tier design:

- **Old:** Admin manually picks Bronze/Silver/Gold/Platinum at semester-end and calls `mint()`.  
- **New:** Attendance badge is **minted automatically** when the student calls `claim()` on `ActivityManager`. No admin step per badge.

A student who attends 3 activities collects **3 badges** — one per activity.

---

## How it connects to ActivityManager

```text
Student calls ActivityManager.claim(activityId)
  │
  ├─► token.mint(student, amount)      ← CRT reward
  │
  └─► nft.mint(student, activityId, activity.title)  ← soulbound badge
           │
           ▼
     Student wallet holds both CRT and an ERC721 badge
```

Both happen in **one transaction**. Student pays gas once.

---

## Deploy wiring (one-time setup)

Same pattern as `CampusRewardToken`'s minter role:

```text
1. Deploy CampusRewardToken
2. Deploy AchievementNFT
3. Deploy ActivityManager(tokenAddress, nftAddress, initialOwner)
4. CampusRewardToken.setMinter(ActivityManager)   ← ActivityManager can mint CRT
5. AchievementNFT.setMinter(ActivityManager)      ← ActivityManager can mint badges
```

After step 5, the admin never touches badge minting again.

---

## Contract walkthrough — AchievementNFT

### 1. Inheritance

```solidity
contract AchievementNFT is ERC721, Ownable
```

| Piece | Role |
|---|---|
| `ERC721` | NFT ownership (`ownerOf`, `balanceOf`) |
| `Ownable` | Only admin can call `setMinter` |

No `ERC721URIStorage` — we store activity data directly on-chain; no GitLab URL needed.

Name / symbol: **Campus Achievement** / **URS**.

---

### 2. Badge struct

```solidity
struct Badge {
    uint256 activityId;
    string  activityTitle;
}
```

Stored on-chain per `tokenId` via `_badgeOf`. Both fields come from `ActivityManager` at mint time — no external metadata URL needed.

---

### 3. Minter role

```solidity
address public minter;

function setMinter(address account) external onlyOwner { ... }
```

Same pattern as `CampusRewardToken.setMinter`. Owner calls this **once** after deploy to point it at `ActivityManager`. Only the minter address can call `mint()`.

**Why not `onlyOwner` on mint?**  
`ActivityManager` is not the owner — it's a separate contract. We use a dedicated minter address (just like CRT) so ActivityManager can mint badges without being the admin.

---

### 4. `mint` (called by ActivityManager, not admin)

```solidity
function mint(address to, uint256 activityId, string calldata activityTitle)
    external returns (uint256 tokenId)
```

- Checks `msg.sender == minter`
- Assigns next token ID (starts at **1**)
- Stores `Badge` in `_badgeOf[tokenId]`
- Pushes `tokenId` into `_tokensOf[to]` (student's collection)
- Calls `_safeMint(to, tokenId)`
- Emits `AchievementMinted`

---

### 5. Multiple badges per student

```solidity
mapping(address => uint256[]) private _tokensOf;
```

A student can hold many badges — one per activity claimed. No "already minted" guard like the old design.

```solidity
function tokensOf(address student) external view returns (uint256[] memory)
```

---

### 6. Soulbound via `_update`

Identical pattern to the locked CRT token:

```solidity
if (from != address(0) && to != address(0)) revert Soulbound();
```

| Case | from | to | Allowed? |
|---|---|---|---|
| Mint | `address(0)` | student | ✅ |
| Transfer | student A | student B | ❌ |

---

### 7. Views for the UI

| Function | Use |
|---|---|
| `tokensOf(student)` | Gallery — list all badge tokenIds |
| `badgeOf(tokenId)` | Show activityId + title for each badge |
| `hasAnyBadge(student)` | Dashboard — "you have badges" indicator |
| `totalMinted()` | Admin stats |
| `ownerOf(tokenId)` | Standard ERC721 |

---

## Contract walkthrough — ActivityManager changes

Constructor gains a second address argument:

```solidity
constructor(address tokenAddress, address nftAddress, address initialOwner)
```

And `claim()` now calls both contracts:

```solidity
// Mint CRT reward
token.mint(msg.sender, amount);

// Auto-mint soulbound attendance badge for this activity
nft.mint(msg.sender, activityId, activity.title);
```

Everything else in `ActivityManager` is unchanged.

---

## What the tests prove

### AchievementNFT (12 tests)

| Test | Meaning |
|---|---|
| set/update minter | Role wiring works |
| zero-address minter rejected | Safe setup |
| non-owner cannot set minter | Ownable enforced |
| authorised minter mints badge | Happy path; Badge data correct |
| non-minter cannot mint | Access control |
| zero-address recipient rejected | Input guard |
| empty title rejected | Input guard |
| student collects multiple badges | One per activity |
| different students, own badges | Isolation |
| hasAnyBadge before/after | View accuracy |
| tokensOf empty array | View accuracy |
| soulbound — transfer reverts | Cannot be sent away |

### ActivityManager (updated test)

- `claim()` now asserts both CRT balance AND NFT badge data (`activityId`, `activityTitle`).

---

## Mental model (keep this)

```text
Student earned CRT → wants their badge too?
  → They already have it — it minted automatically when they claimed.

Admin role in NFT:
  → One-time only: AchievementNFT.setMinter(ActivityManager)
  → Never again.

Per activity:
  Activity 1 (AI Workshop)     → badge tokenId 1
  Activity 2 (Hackathon)       → badge tokenId 2
  Activity 3 (Blockchain Talk) → badge tokenId 3
  → student holds [1, 2, 3]
```

---

## Teach-back questions

Answer in your own words — contracts are complete; next is deploy scripts or the React DApp:

1. Why does `AchievementNFT` need its own `minter` role instead of using `onlyOwner` on `mint()`?
2. A student joins 5 activities and claims all of them. How many NFT badges do they hold? How would you look them up?
3. Why doesn't `claim()` need two separate transactions — one for CRT, one for the badge?
4. What is the `_update` override doing, and why doesn't it block the initial mint?



### Model answers (check after you try)

**1. Why does `AchievementNFT` need its own `minter` role instead of using `onlyOwner` on `mint()`?**

`onlyOwner` means only the admin EOA (the human key) can call that function. But `ActivityManager` is a **smart contract** — it is not the owner. When a student calls `claim()`, it is `ActivityManager`'s address that calls `nft.mint()`, not the admin.

By giving `AchievementNFT` a separate `minter` address (just like `CampusRewardToken` has a `minter` for `ActivityManager` and a `burner` for `RewardManager`), we let the admin **appoint** a contract to mint without handing over ownership. The admin stays owner; ActivityManager gets minter. Same separation-of-roles pattern throughout the whole system.

---

**2. A student joins 5 activities and claims all of them. How many NFT badges do they hold? How would you look them up?**

They hold **5 badges** — one per `claim()` call.

To look them up:

```js
// Get all tokenIds the student holds
const tokenIds = await nft.tokensOf(studentAddress);
// → [1n, 4n, 7n, 9n, 12n]  (example — global IDs across all students)

// For each tokenId, read the badge data
for (const id of tokenIds) {
    const badge = await nft.badgeOf(id);
    console.log(badge.activityId, badge.activityTitle);
}
```

`_tokensOf` is a `mapping(address => uint256[])` that grows by one every time that student claims. Unlike the old design's `_tokenIdOf` (which stored only one ID per wallet), this is an array — no cap on how many badges a student can collect.

---

**3. Why doesn't `claim()` need two separate transactions — one for CRT, one for the badge?**

Because both `token.mint()` and `nft.mint()` are **internal contract calls** — they happen inside the execution of the single `claim()` transaction. From the blockchain's point of view, the student submits one transaction. The EVM executes all the code in sequence within that transaction:

```
Student tx → ActivityManager.claim()
                 ├── token.mint(student, amount)   [CRT minted]
                 └── nft.mint(student, id, title)  [badge minted]
                 emit Claimed(...)
```

If either internal call fails (e.g. NFT minter not set), the entire transaction reverts — both actions succeed or both fail together. This is a key property of Solidity: you compose behaviour by calling other contracts from within the same tx.

---

**4. What is the `_update` override doing, and why doesn't it block the initial mint?**

`_update` is the single internal function in OpenZeppelin's ERC721 that handles **every** token ownership change: mint, burn, and transfer. By overriding it in one place, we cover all three paths.

```solidity
function _update(address to, uint256 tokenId, address auth)
    internal override returns (address)
{
    address from = _ownerOf(tokenId);
    if (from != address(0) && to != address(0)) {
        revert Soulbound();
    }
    return super._update(to, tokenId, auth);
}
```

The condition `from != address(0) && to != address(0)` only fires when **both sides are real wallets** — i.e. a transfer.

| Operation | `from` | `to` | Blocked? |
|---|---|---|---|
| Mint (`_safeMint`) | `address(0)` | student | ❌ No — `from` is zero |
| Transfer | student A | student B | ✅ Yes — both non-zero |

Mint is NOT blocked because when a token is first created, `_ownerOf(tokenId)` returns `address(0)` (no previous owner). So `from = address(0)`, the condition is false, and `super._update` runs normally to record the new owner.
