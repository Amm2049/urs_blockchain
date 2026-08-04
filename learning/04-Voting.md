# Slice 04 — Voting

**Status:** Done · tests in `test/Voting.test.js`  
**Files:** `contracts/Voting.sol` · `test/Voting.test.js` · `interfaces.md`  
**Depends on:** Slice 01 — Token address only (`balanceOf`); **no** minter/burner role

Read this beside the contract. Flow to memorize: **create poll → vote (if ≥1 CRT & before endTime)**.

---

## What this slice is for

Voting lets students pick future campus rewards (or similar questions) without spending CRT:

1. Admin creates a poll (question + ≥2 options + `endTime`)  
2. Student with **≥1 CRT** calls **`vote(pollId, optionIndex)`** once  
3. After `endTime`, further votes revert — closed by **check-on-action** (no keeper bot)

CRT is only a **gate**. Unlike RewardManager, nothing is burned.

---

## How it connects to the Token

```text
CampusRewardToken.balanceOf(student)
  ▲
  │ read only (≥ 1 CRT?)
Voting.vote()
  ▲
  │ student calls
Student wallet
```

Deploy:

1. Deploy Token  
2. Deploy `Voting(token, owner)`  

No `setMinter` / `setBurner` for this contract.

---

## Contract walkthrough

### 1. Eligibility constant

```solidity
uint256 public constant MIN_CRT_TO_VOTE = 1 ether; // 1 CRT (18 decimals)
```

Matches UI `parseEther("1")`. Half a CRT (`0.5`) cannot vote.

---

### 2. Poll storage

```solidity
struct Poll {
    uint256 id;
    string question;
    uint256 endTime;
    uint256 optionCount;
}
```

Options and tallies live in mappings (not inside the struct):

| Mapping | Meaning |
|---|---|
| `_options[pollId][i]` | Option text |
| `_voteCounts[pollId][i]` | Votes for that option |
| `hasVoted[pollId][student]` | Already voted? |
| `_votedOption[pollId][student]` | Which option they chose |
| `_studentVotedPollIds[student]` | Dashboard history |

---

### 3. `createPoll` (admin)

- `onlyOwner`  
- Question non-empty; **≥2** options; each option non-empty  
- `endTime` must be **strictly after** `block.timestamp`  
- Emits `PollCreated`

Multiple polls can be open at the same time (spec).

---

### 4. `vote` (student) — check-on-action close

Checks in order:

1. Poll exists  
2. `block.timestamp < endTime` → else `PollClosed`  
3. Not already voted  
4. Valid option index  
5. `balanceOf >= 1 CRT`  

Then sets `hasVoted`, increments count, records history, emits `Voted`.

There is **no** separate `closePoll` admin call for the time gate — time itself closes voting when someone tries to vote.

---

### 5. Views for the UI

| Function | Use |
|---|---|
| `getPoll` | Question, endTime, `open` flag |
| `getOptions` / `getResults` | Ballot + live tallies |
| `hasVoted` / `getVotedOption` | Button state / “you picked X” |
| `getStudentVotedPollIds` | Dashboard voting history |

---

## What the tests prove

| Test | Meaning |
|---|---|
| create poll | Question/options/endTime stored |
| bad create inputs | Guards on question/options/time |
| vote once + results | Happy path + double-vote block |
| <1 CRT | Eligibility gate |
| after endTime | Check-on-action close |
| bad option index | Bounds check |
| two polls open | Concurrency |
| non-owner create | Ownable |

---

## Mental model (keep this)

```text
Admin: createPoll("Next reward?", ["Coffee","Hoodie"], now+1h)
Student with ≥1 CRT: vote(1, 0)  → Coffee += 1
After endTime: vote() reverts PollClosed
```

Earn CRT → qualify to vote. Redeeming CRT can drop you below 1 and block *future* polls — past votes stay recorded.

---

## Teach-back questions

Answer in your own words before Slice 05 — AchievementNFT:

1. Why doesn’t Voting need to be minter or burner?  
2. What does “check-on-action” mean for poll close? Who closes the poll?  
3. Why require **≥1 CRT** instead of burning CRT to vote?  
4. Can two polls accept votes at the same time? Where is that enforced (or not)?

When these feel solid, say go and we continue.
