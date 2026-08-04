// ── Deployed Addresses (Sepolia) ──────────────────────────────────────────────
export const ADDRESSES = {
  CampusRewardToken: '0xae456bf71aA0156723497398224AAB4eE3014C64',
  AchievementNFT:    '0x8c971c0e34340A8CB2eb72E39bBEf52b5640621B',
  ActivityManager:   '0xC49007a7EFdA3fD32ce9f12b239F8611BBA395b6',
  RewardManager:     '0xb67FA91Cd2371413212B78c2EF50fCD53DC16bD3',
  Voting:            '0x502Ff7Ac7009a239C0C235Cbe94E3B7B4dAa0C01',
};

export const ADMIN_ADDRESS = '0x652DF2B786544d856Fed243722D165A3A1567D73';

// ── ABIs ─────────────────────────────────────────────────────────────────────

export const CampusRewardTokenABI = [
  {"inputs":[{"internalType":"address","name":"initialOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"minter","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"burner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"setMinter","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"setBurner","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},
];

export const AchievementNFTABI = [
  {"inputs":[{"internalType":"address","name":"initialOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"badgeOf","outputs":[{"internalType":"uint256","name":"activityId","type":"uint256"},{"internalType":"string","name":"activityTitle","type":"string"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"student","type":"address"}],"name":"hasAnyBadge","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"activityId","type":"uint256"},{"internalType":"string","name":"activityTitle","type":"string"}],"name":"mint","outputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"minter","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"setMinter","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"student","type":"address"}],"name":"tokensOf","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalMinted","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":true,"internalType":"uint256","name":"activityId","type":"uint256"},{"indexed":false,"internalType":"string","name":"activityTitle","type":"string"}],"name":"AchievementMinted","type":"event"},
];

export const ActivityManagerABI = [
  {"inputs":[{"internalType":"address","name":"tokenAddress","type":"address"},{"internalType":"address","name":"nftAddress","type":"address"},{"internalType":"address","name":"initialOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[],"name":"activityCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"activityId","type":"uint256"}],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"activityId","type":"uint256"}],"name":"closeActivity","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"activityId","type":"uint256"},{"internalType":"address","name":"student","type":"address"}],"name":"confirmAttendance","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"string","name":"title","type":"string"},{"internalType":"uint256","name":"rewardAmount","type":"uint256"}],"name":"createActivity","outputs":[{"internalType":"uint256","name":"activityId","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"activityId","type":"uint256"}],"name":"getActivity","outputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"string","name":"title","type":"string"},{"internalType":"uint256","name":"rewardAmount","type":"uint256"},{"internalType":"uint8","name":"status","type":"uint8"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"activityId","type":"uint256"}],"name":"getConfirmedStudents","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"activityId","type":"uint256"}],"name":"getEligibleStudents","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"address","name":"","type":"address"}],"name":"hasClaimed","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"address","name":"","type":"address"}],"name":"isConfirmed","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"address","name":"","type":"address"}],"name":"isEligible","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"activityId","type":"uint256"}],"name":"join","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"token","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"activityId","type":"uint256"},{"indexed":false,"internalType":"string","name":"title","type":"string"},{"indexed":false,"internalType":"uint256","name":"rewardAmount","type":"uint256"}],"name":"ActivityCreated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"activityId","type":"uint256"}],"name":"ActivityClosed","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"activityId","type":"uint256"},{"indexed":true,"internalType":"address","name":"student","type":"address"}],"name":"Joined","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"activityId","type":"uint256"},{"indexed":true,"internalType":"address","name":"student","type":"address"}],"name":"AttendanceConfirmed","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"activityId","type":"uint256"},{"indexed":true,"internalType":"address","name":"student","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Claimed","type":"event"},
];

export const RewardManagerABI = [
  {"inputs":[{"internalType":"address","name":"tokenAddress","type":"address"},{"internalType":"address","name":"initialOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[{"internalType":"string","name":"title","type":"string"},{"internalType":"uint256","name":"cost","type":"uint256"}],"name":"createReward","outputs":[{"internalType":"uint256","name":"rewardId","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"redemptionId","type":"uint256"}],"name":"getRedemption","outputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"rewardId","type":"uint256"},{"internalType":"address","name":"student","type":"address"},{"internalType":"uint256","name":"cost","type":"uint256"},{"internalType":"uint256","name":"timestamp","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"rewardId","type":"uint256"}],"name":"getReward","outputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"string","name":"title","type":"string"},{"internalType":"uint256","name":"cost","type":"uint256"},{"internalType":"bool","name":"active","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"student","type":"address"}],"name":"getStudentRedemptionIds","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"rewardId","type":"uint256"}],"name":"redeem","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"redemptionCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"rewardCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"rewardId","type":"uint256"},{"internalType":"bool","name":"active","type":"bool"}],"name":"setRewardActive","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"token","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"rewardId","type":"uint256"},{"indexed":false,"internalType":"string","name":"title","type":"string"},{"indexed":false,"internalType":"uint256","name":"cost","type":"uint256"}],"name":"RewardCreated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"rewardId","type":"uint256"},{"indexed":false,"internalType":"bool","name":"active","type":"bool"}],"name":"RewardActiveUpdated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"redemptionId","type":"uint256"},{"indexed":true,"internalType":"uint256","name":"rewardId","type":"uint256"},{"indexed":true,"internalType":"address","name":"student","type":"address"},{"indexed":false,"internalType":"uint256","name":"cost","type":"uint256"}],"name":"Redeemed","type":"event"},
];

export const VotingABI = [
  {"inputs":[{"internalType":"address","name":"tokenAddress","type":"address"},{"internalType":"address","name":"initialOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[],"name":"MIN_CRT_TO_VOTE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"string","name":"question","type":"string"},{"internalType":"string[]","name":"options","type":"string[]"},{"internalType":"uint256","name":"endTime","type":"uint256"}],"name":"createPoll","outputs":[{"internalType":"uint256","name":"pollId","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"pollId","type":"uint256"}],"name":"getOptions","outputs":[{"internalType":"string[]","name":"options","type":"string[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"pollId","type":"uint256"}],"name":"getPoll","outputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"string","name":"question","type":"string"},{"internalType":"uint256","name":"endTime","type":"uint256"},{"internalType":"uint256","name":"optionCount","type":"uint256"},{"internalType":"bool","name":"open","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"pollId","type":"uint256"}],"name":"getResults","outputs":[{"internalType":"uint256[]","name":"counts","type":"uint256[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"student","type":"address"}],"name":"getStudentVotedPollIds","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"pollId","type":"uint256"},{"internalType":"address","name":"student","type":"address"}],"name":"getVotedOption","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"address","name":"","type":"address"}],"name":"hasVoted","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"pollCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"token","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"pollId","type":"uint256"},{"internalType":"uint256","name":"optionIndex","type":"uint256"}],"name":"vote","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"pollId","type":"uint256"},{"indexed":false,"internalType":"string","name":"question","type":"string"},{"indexed":false,"internalType":"uint256","name":"endTime","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"optionCount","type":"uint256"}],"name":"PollCreated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"pollId","type":"uint256"},{"indexed":true,"internalType":"address","name":"voter","type":"address"},{"indexed":false,"internalType":"uint256","name":"optionIndex","type":"uint256"}],"name":"Voted","type":"event"},
];
