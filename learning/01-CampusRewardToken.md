# Slice 01 — CampusRewardToken (CRT)

**Status:** Done · 7/7 tests passing  
**Files:** `contracts/CampusRewardToken.sol` · `test/CampusRewardToken.test.js` · `interfaces.md`  
**Spec:** Locked ERC20, 18 decimals, owner sets minter/burner (`spec.md`)

Use this note to learn the slice inside-out. Read the contract beside it.

---

## What this slice is for

CRT is the campus points token. Students **earn** it (mint) and **spend** it on rewards (burn). They **cannot send it** to another wallet — so a balance always means “this wallet participated,” not “someone transferred points to me.”

Later wiring:

1. Deploy Token (owner = admin wallet)
2. Deploy ActivityManager + RewardManager
3. Owner calls `setMinter(ActivityManager)` and `setBurner(RewardManager)`

---

## Project pieces we added

| Piece | Role |
|---|---|
| **Hardhat** | Compiles Solidity, runs a local fake chain, runs tests |
| **OpenZeppelin** | Battle-tested `ERC20` + `Ownable` we build on |
| **`CampusRewardToken.sol`** | Our token rules (lock + roles) |
| **`CampusRewardToken.test.js`** | Automated checks that those rules hold |
| **`interfaces.md`** | Shared function list for the frontend / teammates |

Run tests anytime:

```bash
npm test
```

---

## Contract walkthrough

### 1. Imports and inheritance

```solidity
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CampusRewardToken is ERC20, Ownable {
```

- **`ERC20`** gives us balances, `transfer`, `approve`, `mint`/`burn` internals, name/symbol/decimals.
- **`Ownable`** gives us one admin (`owner`) and the `onlyOwner` modifier.
- We **inherit** both, then add campus-specific rules on top.

---

### 2. State: `minter` and `burner`

```solidity
address public minter;
address public burner;
```

Two stored addresses:

- **`minter`** — who is allowed to create new CRT (will be ActivityManager).
- **`burner`** — who is allowed to destroy CRT (will be RewardManager).

`public` auto-creates getter functions (`minter()`, `burner()`) the frontend can read.

**Why not just use `owner` for mint?**  
If the owner key could mint freely, admin could invent points without the activity flow. Spec wants: **only the ActivityManager contract** mints after confirm → claim. Owner only *appoints* that contract.

---

### 3. Custom errors

```solidity
error TransfersDisabled();
error NotMinter();
error NotBurner();
error ZeroAddress();
```

Modern Solidity style: cheap, clear reverts. Tests match on these names (e.g. `TransfersDisabled`).

---

### 4. Events

```solidity
event MinterUpdated(...);
event BurnerUpdated(...);
```

Logged on-chain when roles change. Useful for explorers, indexers, and debugging “who is minter right now?”

---

### 5. Constructor

```solidity
constructor(address initialOwner)
    ERC20("Campus Reward Token", "CRT")
    Ownable(initialOwner) {}
```

On deploy we:

- Set token **name** / **symbol**
- Set **owner** to `initialOwner` (usually the deployer / admin)

**Decimals:** OpenZeppelin ERC20 defaults to **18**. We did not override `decimals()`, so CRT uses 18. In JS/ethers, `parseEther("20")` = `20 * 10^18` smallest units = “20 CRT” in the UI.

---

### 6. `setMinter` / `setBurner`

```solidity
function setMinter(address account) external onlyOwner {
    if (account == address(0)) revert ZeroAddress();
    ...
    minter = account;
}
```

- **`onlyOwner`** — random students cannot appoint themselves minter.
- **Reject `address(0)`** — avoids accidentally “turning off” mint by setting zero and then wondering why claim fails.
- Same pattern for `setBurner`.

After deploy scripts run, owner does this once (or when upgrading addresses).

---

### 7. `mint` and `burn`

```solidity
function mint(address to, uint256 amount) external {
    if (msg.sender != minter) revert NotMinter();
    _mint(to, amount);
}

function burn(address from, uint256 amount) external {
    if (msg.sender != burner) revert NotBurner();
    _burn(from, amount);
}
```

- **`msg.sender`** = whoever called this function (the manager contract, not the student, when managers call the token).
- **`_mint` / `_burn`** = OpenZeppelin internals that update balances and emit `Transfer`.

Students never call `mint` on the token directly in the final DApp — they call `ActivityManager.claim()`, which then calls `token.mint(student, amount)`.

---

### 8. Locked transfers — `_update`

```solidity
function _update(address from, address to, uint256 value) internal override {
    if (from != address(0) && to != address(0)) {
        revert TransfersDisabled();
    }
    super._update(from, to, value);
}
```

In OpenZeppelin v5, **every** balance change goes through `_update`:

| Case | `from` | `to` | Allowed? |
|---|---|---|---|
| Mint | `address(0)` | student | Yes |
| Burn | student | `address(0)` | Yes |
| Transfer | student A | student B | **No** |

We only block when **both** sides are real wallets.

**Why override `_update` instead of only `transfer`?**  
If you only override `transfer`, someone can still move tokens via `transferFrom` (after `approve`). Hooking `_update` locks **all** wallet-to-wallet paths in one place.

---

## What the tests prove

| Test | Meaning |
|---|---|
| name / symbol / decimals / owner | Metadata matches spec |
| set minter/burner | Owner can wire managers |
| zero address rejected | Safe role updates |
| only minter mints | Random EOAs cannot invent CRT |
| only burner burns | Random EOAs cannot destroy CRT |
| transfer / transferFrom revert | Token is locked; mint/burn still work |
| non-owner cannot set roles | Ownable actually enforced |

---

## Mental model (keep this)

```text
Admin (owner)
   │  setMinter / setBurner
   ▼
CampusRewardToken
   ▲ mint              ▲ burn
   │                   │
ActivityManager    RewardManager
(claim flow)       (redeem flow)
```

CRT balance = participation credit stuck to that wallet.

---

## Teach-back questions

Answer in your own words before we start **Slice 02 — ActivityManager**:

1. Why can’t the admin just mint CRT directly with the owner key?
2. Why does locking transfers use `_update` instead of only overriding `transfer`?
3. What does `ethers.parseEther("20")` mean with 18 decimals?

### Model answers (check after you try)

1. **Owner appoints the minter; owner is not the minter.** If the admin key could mint freely, CRT could be invented without Join → confirm → claim. Spec: only ActivityManager mints after a valid claim.
2. **`_update` is the single choke point** for every balance change in OpenZeppelin v5 (transfer, transferFrom, mint, burn). Overriding only `transfer` still leaves `transferFrom` open. In `_update`, block only when both `from` and `to` are real wallets; allow mint (`from = 0`) and burn (`to = 0`).
3. **`parseEther("20")` = `20 × 10^18`** smallest units. With 18 decimals, the chain stores integers, not `20.0`. The UI shows “20 CRT”; contracts use the scaled integer.

When these feel solid, say go and we continue.
