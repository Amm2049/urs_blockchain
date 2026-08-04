// scripts/deploy.js
// Run: npx hardhat run scripts/deploy.js --network sepolia

const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH\n"
  );

  // ── 1. CampusRewardToken ────────────────────────────────────────────────────
  console.log("1/5  Deploying CampusRewardToken...");
  const Token = await ethers.getContractFactory("CampusRewardToken");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log("     CampusRewardToken:", tokenAddr);

  // ── 2. AchievementNFT ───────────────────────────────────────────────────────
  console.log("2/5  Deploying AchievementNFT...");
  const NFT = await ethers.getContractFactory("AchievementNFT");
  const nft = await NFT.deploy(deployer.address);
  await nft.waitForDeployment();
  const nftAddr = await nft.getAddress();
  console.log("     AchievementNFT:   ", nftAddr);

  // ── 3. ActivityManager ──────────────────────────────────────────────────────
  console.log("3/5  Deploying ActivityManager...");
  const AM = await ethers.getContractFactory("ActivityManager");
  const activities = await AM.deploy(tokenAddr, nftAddr, deployer.address);
  await activities.waitForDeployment();
  const amAddr = await activities.getAddress();
  console.log("     ActivityManager:  ", amAddr);

  // ── 4. RewardManager ────────────────────────────────────────────────────────
  console.log("4/5  Deploying RewardManager...");
  const RM = await ethers.getContractFactory("RewardManager");
  const rewards = await RM.deploy(tokenAddr, deployer.address);
  await rewards.waitForDeployment();
  const rmAddr = await rewards.getAddress();
  console.log("     RewardManager:    ", rmAddr);

  // ── 5. Voting ───────────────────────────────────────────────────────────────
  console.log("5/5  Deploying Voting...");
  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(tokenAddr, deployer.address);
  await voting.waitForDeployment();
  const votingAddr = await voting.getAddress();
  console.log("     Voting:           ", votingAddr);

  // ── Wiring ──────────────────────────────────────────────────────────────────
  console.log("\nWiring roles...");

  console.log("  token.setMinter(ActivityManager)");
  await (await token.setMinter(amAddr)).wait();

  console.log("  token.setBurner(RewardManager)");
  await (await token.setBurner(rmAddr)).wait();

  console.log("  nft.setMinter(ActivityManager)");
  await (await nft.setMinter(amAddr)).wait();

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log("\n✅ Deployment complete! Copy these addresses into your frontend:\n");
  console.log(`CAMPUS_REWARD_TOKEN = "${tokenAddr}"`);
  console.log(`ACHIEVEMENT_NFT     = "${nftAddr}"`);
  console.log(`ACTIVITY_MANAGER    = "${amAddr}"`);
  console.log(`REWARD_MANAGER      = "${rmAddr}"`);
  console.log(`VOTING              = "${votingAddr}"`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
