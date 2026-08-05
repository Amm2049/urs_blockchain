# URS Contract Interfaces

**Ownership:** Frontend drafts stubs; each contract owner fills signatures, returns, and events as the contract stabilizes.

**Recorded conventions**

- CRT decimals = **18** (use `parseEther` / `formatEther` in the UI)
- Poll close = check-on-action by `endTime` (no keeper)

---

## CampusRewardToken.sol

```solidity
constructor(address initialOwner)

function setMinter(address account) external onlyOwner
function setBurner(address account) external onlyOwner

function mint(address to, uint256 amount) external   // only minter
function burn(address from, uint256 amount) external // only burner

function minter() external view returns (address)
function burner() external view returns (address)
function balanceOf(address account) external view returns (uint256)
function decimals() external view returns (uint8) // 18
```

**Events**

- `MinterUpdated(address indexed previousMinter, address indexed newMinter)`
- `BurnerUpdated(address indexed previousBurner, address indexed newBurner)`
- Standard ERC20: `Transfer`, `Approval`

**Notes**

- Transfers between wallets revert (`TransfersDisabled`). Mint and burn still work.
- Owner is not the minter; ActivityManager must be `setMinter`, RewardManager `setBurner`.

---

## ActivityManager.sol

```solidity
constructor(address tokenAddress, address nftAddress, address initialOwner)

function createActivity(string calldata title, uint256 rewardAmount) external onlyOwner returns (uint256 activityId)
function closeActivity(uint256 activityId) external onlyOwner

function join(uint256 activityId) external
function confirmAttendance(uint256 activityId, address student) external onlyOwner
function claim(uint256 activityId) external   // mints CRT + auto-mints NFT badge

function getActivity(uint256 activityId) external view
  returns (uint256 id, string memory title, uint256 rewardAmount, Status status) // Status: 0=Open, 1=Closed
function activityCount() external view returns (uint256)
function isEligible(uint256 activityId, address student) external view returns (bool)
function isConfirmed(uint256 activityId, address student) external view returns (bool)
function hasClaimed(uint256 activityId, address student) external view returns (bool)
function getEligibleStudents(uint256 activityId) external view returns (address[] memory)
function getConfirmedStudents(uint256 activityId) external view returns (address[] memory)
function token() external view returns (address)
```

**Events**

- `ActivityCreated(uint256 indexed activityId, string title, uint256 rewardAmount)`
- `ActivityClosed(uint256 indexed activityId)`
- `Joined(uint256 indexed activityId, address indexed student)`
- `AttendanceConfirmed(uint256 indexed activityId, address indexed student)`
- `Claimed(uint256 indexed activityId, address indexed student, uint256 amount)`

**Notes**

- Must be set as Token `minter` before `claim()` works.
- Eligible ≠ Confirmed ≠ Claimed — three separate flags.
- `closeActivity` stops new joins; confirm/claim still allowed.
- Contract `owner` (admin) is blocked from calling `join()` (`AdminCannotJoin`) or `claim()` (`AdminCannotClaim`).

---

## RewardManager.sol

```solidity
constructor(address tokenAddress, address initialOwner)

function createReward(string calldata title, uint256 cost) external onlyOwner returns (uint256 rewardId)
function setRewardActive(uint256 rewardId, bool active) external onlyOwner

function redeem(uint256 rewardId) external

function getReward(uint256 rewardId) external view
  returns (uint256 id, string memory title, uint256 cost, bool active)
function rewardCount() external view returns (uint256)

function getRedemption(uint256 redemptionId) external view
  returns (uint256 id, uint256 rewardId, address student, uint256 cost, uint256 timestamp)
function redemptionCount() external view returns (uint256)
function getStudentRedemptionIds(address student) external view returns (uint256[] memory)
function token() external view returns (address)
```

**Events**

- `RewardCreated(uint256 indexed rewardId, string title, uint256 cost)`
- `RewardActiveUpdated(uint256 indexed rewardId, bool active)`
- `Redeemed(uint256 indexed redemptionId, uint256 indexed rewardId, address indexed student, uint256 cost)`

**Notes**

- Must be set as Token `burner` before `redeem()` works.
- Physical fulfillment is **off-chain** (spreadsheet); no `markFulfilled` on-chain.
- `cost` uses CRT base units (18 decimals). Frontend: `parseEther("100")` for 100 CRT.
- Inactive rewards cannot be redeemed; existing redemptions remain on-chain.
- Contract `owner` (admin) is blocked from calling `redeem()` (`AdminCannotRedeem`).

---

## Voting.sol

```solidity
constructor(address tokenAddress, address initialOwner)

uint256 public constant MIN_CRT_TO_VOTE // 1 ether = 1 CRT

function createPoll(string calldata question, string[] calldata options, uint256 endTime)
  external onlyOwner returns (uint256 pollId)

function vote(uint256 pollId, uint256 optionIndex) external

function getPoll(uint256 pollId) external view
  returns (uint256 id, string memory question, uint256 endTime, uint256 optionCount, bool open)
function pollCount() external view returns (uint256)
function getOptions(uint256 pollId) external view returns (string[] memory)
function getResults(uint256 pollId) external view returns (uint256[] memory counts)
function hasVoted(uint256 pollId, address student) external view returns (bool)
function getVotedOption(uint256 pollId, address student) external view returns (uint256)
function getStudentVotedPollIds(address student) external view returns (uint256[] memory)
function token() external view returns (address)
```

**Events**

- `PollCreated(uint256 indexed pollId, string question, uint256 endTime, uint256 optionCount)`
- `Voted(uint256 indexed pollId, address indexed voter, uint256 optionIndex)`

**Notes**

- Eligibility = `balanceOf(voter) >= 1 CRT` (check only; CRT is **not** burned).
- Poll close = check-on-action: `vote()` reverts when `block.timestamp >= endTime` (no keeper).
- Multiple polls may be open at once; one vote per wallet per poll.
- Voting does **not** need minter/burner roles — only a Token address for `balanceOf`.
- Contract `owner` (admin) is blocked from calling `vote()` (`AdminCannotVote`).

---

## AchievementNFT.sol

```solidity
constructor(address initialOwner)

function setMinter(address account) external onlyOwner

// Called automatically by ActivityManager.claim() — not by admin per badge
function mint(address to, uint256 activityId, string calldata activityTitle)
  external returns (uint256 tokenId)

// Views
function badgeOf(uint256 tokenId) external view returns (uint256 activityId, string memory activityTitle)
function tokensOf(address student) external view returns (uint256[] memory)
function hasAnyBadge(address student) external view returns (bool)
function totalMinted() external view returns (uint256)
function minter() external view returns (address)
function ownerOf(uint256 tokenId) external view returns (address)
function balanceOf(address owner) external view returns (uint256)
```

**Events**

- `MinterUpdated(address indexed previousMinter, address indexed newMinter)`
- `AchievementMinted(address indexed to, uint256 indexed tokenId, uint256 indexed activityId, string activityTitle)`
- Standard ERC721: `Transfer`, `Approval`, `ApprovalForAll`

**Notes**

- Soulbound: wallet-to-wallet transfers revert (`Soulbound`). Mint still works.
- One badge per activity per student — a student can hold many badges.
- Auto-minted inside `ActivityManager.claim()`. Admin does **not** call this manually.
- Cannot be minted to contract `owner` (`AdminCannotReceiveNFT`).
- Deploy wiring: `AchievementNFT.setMinter(ActivityManager)` once after deploy.

---
