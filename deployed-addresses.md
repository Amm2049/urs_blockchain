# URS Deployed Contract Addresses — Sepolia Testnet

**Deployed:** 2026-08-01  
**Deployer / Admin wallet:** `0x652DF2B786544d856Fed243722D165A3A1567D73`  
**Network:** Ethereum Sepolia

| Contract | Address |
|---|---|
| CampusRewardToken | `0xae456bf71aA0156723497398224AAB4eE3014C64` |
| AchievementNFT    | `0x8c971c0e34340A8CB2eb72E39bBEf52b5640621B` |
| ActivityManager   | `0xC49007a7EFdA3fD32ce9f12b239F8611BBA395b6` |
| RewardManager     | `0xb67FA91Cd2371413212B78c2EF50fCD53DC16bD3` |
| Voting            | `0x502Ff7Ac7009a239C0C235Cbe94E3B7B4dAa0C01` |

## Wiring
- `CampusRewardToken.minter` → ActivityManager ✅
- `CampusRewardToken.burner` → RewardManager ✅
- `AchievementNFT.minter`    → ActivityManager ✅
