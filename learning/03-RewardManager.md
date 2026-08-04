# Slice 03 — RewardManager

**Status:** Done · tests in `test/RewardManager.test.js`  
**Files:** `contracts/RewardManager.sol` · `test/RewardManager.test.js` · `interfaces.md`  
**Depends on:** Slice 01 — Token must authorize this contract as **burner**

Read this beside the contract. Flow to memorize: **create reward → student redeem → burn + record**.

---

## What this slice is for

RewardManager is the **spending path**. Students spend CRT on campus perks:

1. Admin creates a reward (title + CRT cost) on-chain  
2. Student with enough CRT calls **`redeem(rewardId)`**  
3. RewardManager calls `token.burn(student, cost)` and stores a redemption record  

Staff later hand out the coffee / hoodie using an **off-chain spreadsheet**. Spec deliberately has **no** `markFulfilled` on-chain for demo scope.

---

## How it connects to the Token

```text
owner
  │ setBurner(RewardManager)
  ▼
CampusRewardToken.burn(...)
  ▲
  │ only if msg.sender == burner
RewardManager.redeem()
  ▲
  │ student calls
Student wallet
```

In tests (and later deploy scripts) we always:

1. Deploy Token  
2. Deploy RewardManager(token, owner)  
3. `token.setBurner(rewardManager)`  

Without step 3, `redeem()` reverts with `NotBurner` from the Token.

Earning vs spending:

| Path | Contract | Token role |
|---|---|---|
| Earn | ActivityManager | minter |
| Spend | RewardManager | burner |

---

## Contract walkthrough

### 1. Token interface (burn + balance)

```solidity
interface ICampusRewardTokenBurn {
    function burn(address from, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
}
```

RewardManager only needs **`burn`** and **`balanceOf`** (for a clear `InsufficientBalance` error before burning).

---

### 2. Reward + Redemption structs

```solidity
struct Reward {
    uint256 id;
    string title;
    uint256 cost;
    bool active;
}

struct Redemption {
    uint256 id;
    uint256 rewardId;
    address student;
    uint256 cost;
    uint256 timestamp;
}
```

- **Reward** = catalog row (Coffee Coupon @ 100 CRT, …)  
- **Redemption** = one spend event (who, which reward, when, how much burned)

IDs for both start at **1**.

---

### 3. `createReward` (admin)

- `onlyOwner`  
- Rejects empty title / zero cost  
- New rewards start **`active = true`**  
- Emits `RewardCreated`

`cost` is in CRT **base units** (18 decimals). Frontend uses `parseEther("100")` for 100 CRT.

---

### 4. `setRewardActive` (admin)

Flip a catalog item on/off. Inactive rewards cannot be redeemed; past redemptions stay readable.

Analogous to ActivityManager’s `closeActivity`, but for the store catalog.

---

### 5. `redeem` (student)

Checks:

1. Reward exists  
2. Reward is **active**  
3. Caller has **≥ cost** CRT  

Then (effects before external call):

1. Write `Redemption` record + push id into student’s history array  
2. `token.burn(msg.sender, cost)`  
3. Emit `Redeemed`

Same reward can be redeemed multiple times if the student earns more CRT — no one-per-reward lock in the spec.

---

### 6. Views for the UI

| Function | Use |
|---|---|
| `getReward` / `rewardCount` | Reward Store catalog |
| `getRedemption` / `redemptionCount` | Admin “pending” list (all on-chain redemptions) |
| `getStudentRedemptionIds` | Student Dashboard history |

“Pending” = everything on-chain until staff marks the spreadsheet off-chain.

---

## What the tests prove

| Test | Meaning |
|---|---|
| create reward | Title/cost/active stored |
| empty title / zero cost | Input guards |
| deactivate / reactivate | Catalog flag works |
| redeem → balance down + record | Burner path end-to-end |
| insufficient CRT | Balance guard |
| inactive reward | Cannot redeem offline items |
| multiple redemptions | History array grows |
| non-owner create/deactivate | Ownable on admin actions |

---

## Mental model (keep this)

```text
Admin: createReward("Coffee Coupon", 100 CRT)
Student has 150 CRT (from ActivityManager claims)
Student: redeem(1)  → burn 100 CRT → redemption #1 recorded
Staff: hand out coffee, tick spreadsheet (off-chain)
```

Earn with ActivityManager; spend with RewardManager; Token never transfers wallet-to-wallet.

---

## Teach-back questions

Answer in your own words before Slice 04 — Voting:

1. Why must RewardManager be the Token **burner** before `redeem()` works?  
2. Why is there no `markFulfilled` on-chain in this demo? Where does “handed out” live?  
3. Why record the redemption **before** calling `token.burn`?  
4. If a reward is deactivated, do old redemptions disappear? Why or why not?

When these feel solid, say go and we continue.
