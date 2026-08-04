# Slice 02 — ActivityManager

**Status:** Done · tests in `test/ActivityManager.test.js`  
**Files:** `contracts/ActivityManager.sol` · `test/ActivityManager.test.js` · `interfaces.md`  
**Depends on:** Slice 01 — Token must authorize this contract as **minter**

Read this beside the contract. Flow to memorize: **create → join → confirm → claim**.

---

## What this slice is for

ActivityManager is the **earning path**. Admin does not hand out CRT from a wallet. Instead:

1. Admin creates an activity (title + CRT amount) on-chain  
2. Student clicks **Join** (eligible list)  
3. Admin **confirms** who actually attended  
4. Student calls **`claim()`** → ActivityManager calls `token.mint(student, amount)`  

Student pays gas on claim (pull model). That matches `spec.md`.

---

## How it connects to the Token

```text
owner
  │ setMinter(ActivityManager)
  ▼
CampusRewardToken.mint(...)
  ▲
  │ only if msg.sender == minter
ActivityManager.claim()
  ▲
  │ student calls
Student wallet
```

In tests (and later deploy scripts) we always:

1. Deploy Token  
2. Deploy ActivityManager(token, owner)  
3. `token.setMinter(activityManager)`  

Without step 3, `claim()` reverts with `NotMinter` from the Token.

---

## Contract walkthrough

### 1. Token interface (not full import)

```solidity
interface ICampusRewardToken {
    function mint(address to, uint256 amount) external;
}
```

ActivityManager only needs **`mint`**. A tiny interface keeps coupling small (we do not inherit the whole ERC20).

Constructor stores `token` as `immutable` and sets Ownable owner (admin).

---

### 2. Activity struct + Status

```solidity
enum Status { Open, Closed }

struct Activity {
    uint256 id;
    string title;
    uint256 rewardAmount;
    Status status;
}
```

Matches spec fields: ID, Title, Reward Amount, Status.  
Student lists are **not** inside the struct — they live in separate mappings/arrays (cheaper / clearer for “eligible vs confirmed”).

- **`Open`** — students can `join`  
- **`Closed`** — `closeActivity` stops new joins; confirm/claim still allowed (demo-friendly)

---

### 3. Three flags per student (important)

| Flag | Meaning | Set by |
|---|---|---|
| `isEligible` | Joined the activity | Student `join` |
| `isConfirmed` | Admin marked attendance | Admin `confirmAttendance` |
| `hasClaimed` | Already minted CRT for this activity | Student `claim` |

**Eligible ≠ Confirmed.** Joining only signs up. No CRT until confirm + claim.

We also keep `_eligibleStudents[]` and `_confirmedStudents[]` so the frontend/admin can **list** wallets (`getEligibleStudents` / `getConfirmedStudents`), not only check one address.

---

### 4. `createActivity` (admin)

- `onlyOwner`  
- Rejects empty title / zero reward  
- IDs start at **1** (`_nextActivityId`)  
- Emits `ActivityCreated`

`rewardAmount` is in CRT **base units** (18 decimals). Frontend uses `parseEther("20")` for 20 CRT.

---

### 5. `join` (student)

- Activity must exist and be **Open**  
- Same wallet cannot join twice (`AlreadyJoined`)  
- Sets `isEligible` + pushes to eligible array  
- Emits `Joined`

No stake, no CRT yet — spam join is OK for demo; **confirm** is the real gate.

---

### 6. `confirmAttendance` (admin)

- Student must already be eligible  
- Cannot confirm twice  
- Sets `isConfirmed` + pushes to confirmed array  
- Emits `AttendanceConfirmed`

This is the admin “they showed up” step from the spec.

---

### 7. `claim` (student)

Checks:

1. Activity exists  
2. Caller is **confirmed**  
3. Caller has **not** claimed yet  

Then:

1. Mark `hasClaimed` **before** mint (simple reentrancy-safe ordering)  
2. `token.mint(msg.sender, rewardAmount)`  
3. Emit `Claimed`

Double-claim is blocked by `hasClaimed`. Wrong student (not confirmed) gets `NotConfirmed`.

---

### 8. Views for the UI

| Function | Use |
|---|---|
| `getActivity` | Show title, reward, status |
| `activityCount` | How many activities exist |
| `isEligible` / `isConfirmed` / `hasClaimed` | Button states (Join / Claim / disabled) |
| `getEligibleStudents` / `getConfirmedStudents` | Admin attendance UI |

---

## What the tests prove

| Test | Meaning |
|---|---|
| create activity | Title/reward/status stored |
| empty title / zero reward | Input guards |
| join once while open | Eligible list works |
| join after close | Status enforced |
| confirm only if eligible | Confirm ≠ invent attendees |
| claim once → CRT balance | Minter path works end-to-end |
| claim without confirm | Guard works |
| non-owner create/confirm | Ownable on admin actions |

---

## Mental model (keep this)

```text
Admin: createActivity("AI Workshop", 20 CRT)
Student: join(1)           → eligible
Admin: confirmAttendance(1, student) → confirmed
Student: claim(1)          → mint 20 CRT to student
```

Three doors; claim is the only door that creates tokens.

---

## Teach-back questions

Answer in your own words before Slice 03 — RewardManager:

1. What is the difference between **eligible** and **confirmed**? Who sets each?
2. Why must ActivityManager be the Token **minter** before `claim()` works?
3. Why mark `hasClaimed = true` **before** calling `token.mint`?
4. After `closeActivity`, can a confirmed student still `claim`? Why did we design it that way?

When these feel solid, say go and we continue.
