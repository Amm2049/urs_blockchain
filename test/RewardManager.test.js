const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("RewardManager", function () {
  async function deployFixture() {
    const [owner, student, other] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("CampusRewardToken");
    const token = await Token.deploy(owner.address);
    await token.waitForDeployment();

    const RewardManager = await ethers.getContractFactory("RewardManager");
    const rewards = await RewardManager.deploy(await token.getAddress(), owner.address);
    await rewards.waitForDeployment();

    // Tests mint via owner-as-minter; production uses ActivityManager as minter.
    await token.setMinter(owner.address);
    await token.setBurner(await rewards.getAddress());

    return { token, rewards, owner, student, other };
  }

  async function fundStudent(token, student, amount = "500") {
    await token.mint(student.address, ethers.parseEther(amount));
  }

  it("creates a reward with title and cost", async function () {
    const { rewards } = await loadFixture(deployFixture);
    await rewards.createReward("Coffee Coupon", ethers.parseEther("100"));

    const reward = await rewards.getReward(1);
    expect(reward.id).to.equal(1n);
    expect(reward.title).to.equal("Coffee Coupon");
    expect(reward.cost).to.equal(ethers.parseEther("100"));
    expect(reward.active).to.equal(true);
    expect(await rewards.rewardCount()).to.equal(1n);
  });

  it("rejects empty title or zero cost", async function () {
    const { rewards } = await loadFixture(deployFixture);
    await expect(rewards.createReward("", ethers.parseEther("100"))).to.be.revertedWithCustomError(
      rewards,
      "EmptyTitle"
    );
    await expect(rewards.createReward("Coffee", 0)).to.be.revertedWithCustomError(
      rewards,
      "ZeroCost"
    );
  });

  it("admin can deactivate and reactivate a reward", async function () {
    const { rewards } = await loadFixture(deployFixture);
    await rewards.createReward("Coffee Coupon", ethers.parseEther("100"));

    await rewards.setRewardActive(1, false);
    expect((await rewards.getReward(1)).active).to.equal(false);

    await rewards.setRewardActive(1, true);
    expect((await rewards.getReward(1)).active).to.equal(true);
  });

  it("student redeems: burns CRT and records redemption", async function () {
    const { token, rewards, student } = await loadFixture(deployFixture);
    await rewards.createReward("Coffee Coupon", ethers.parseEther("100"));
    await fundStudent(token, student, "150");

    const before = await time.latest();
    await expect(rewards.connect(student).redeem(1))
      .to.emit(rewards, "Redeemed")
      .withArgs(1n, 1n, student.address, ethers.parseEther("100"));

    expect(await token.balanceOf(student.address)).to.equal(ethers.parseEther("50"));
    expect(await rewards.redemptionCount()).to.equal(1n);

    const redemption = await rewards.getRedemption(1);
    expect(redemption.id).to.equal(1n);
    expect(redemption.rewardId).to.equal(1n);
    expect(redemption.student).to.equal(student.address);
    expect(redemption.cost).to.equal(ethers.parseEther("100"));
    expect(redemption.timestamp).to.be.gte(before);

    expect(await rewards.getStudentRedemptionIds(student.address)).to.deep.equal([1n]);
  });

  it("rejects redeem with insufficient CRT", async function () {
    const { token, rewards, student } = await loadFixture(deployFixture);
    await rewards.createReward("Campus Hoodie", ethers.parseEther("500"));
    await fundStudent(token, student, "100");

    await expect(rewards.connect(student).redeem(1)).to.be.revertedWithCustomError(
      rewards,
      "InsufficientBalance"
    );
  });

  it("rejects redeem when reward is inactive", async function () {
    const { token, rewards, student } = await loadFixture(deployFixture);
    await rewards.createReward("Coffee Coupon", ethers.parseEther("100"));
    await rewards.setRewardActive(1, false);
    await fundStudent(token, student, "100");

    await expect(rewards.connect(student).redeem(1)).to.be.revertedWithCustomError(
      rewards,
      "RewardInactive"
    );
  });

  it("allows multiple redemptions and tracks per-student history", async function () {
    const { token, rewards, student } = await loadFixture(deployFixture);
    await rewards.createReward("Coffee Coupon", ethers.parseEther("100"));
    await rewards.createReward("Library Extension", ethers.parseEther("150"));
    await fundStudent(token, student, "300");

    await rewards.connect(student).redeem(1);
    await rewards.connect(student).redeem(2);

    expect(await token.balanceOf(student.address)).to.equal(ethers.parseEther("50"));
    expect(await rewards.redemptionCount()).to.equal(2n);
    expect(await rewards.getStudentRedemptionIds(student.address)).to.deep.equal([1n, 2n]);
  });

  it("non-owner cannot create or deactivate rewards", async function () {
    const { rewards, student } = await loadFixture(deployFixture);
    await expect(
      rewards.connect(student).createReward("Hack", ethers.parseEther("1"))
    ).to.be.revertedWithCustomError(rewards, "OwnableUnauthorizedAccount");

    await rewards.createReward("Coffee Coupon", ethers.parseEther("100"));
    await expect(
      rewards.connect(student).setRewardActive(1, false)
    ).to.be.revertedWithCustomError(rewards, "OwnableUnauthorizedAccount");
  });
});
