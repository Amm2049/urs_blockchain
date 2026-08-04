const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("ActivityManager", function () {
  async function deployFixture() {
    const [owner, student, other] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("CampusRewardToken");
    const token = await Token.deploy(owner.address);
    await token.waitForDeployment();

    const AchievementNFT = await ethers.getContractFactory("AchievementNFT");
    const nft = await AchievementNFT.deploy(owner.address);
    await nft.waitForDeployment();

    const ActivityManager = await ethers.getContractFactory("ActivityManager");
    const activities = await ActivityManager.deploy(
      await token.getAddress(),
      await nft.getAddress(),
      owner.address
    );
    await activities.waitForDeployment();

    // Wire CRT minter and NFT minter both to ActivityManager
    await token.setMinter(await activities.getAddress());
    await nft.setMinter(await activities.getAddress());

    return { token, nft, activities, owner, student, other };
  }

  async function openActivity(activities, title = "AI Workshop", reward = "20") {
    const tx = await activities.createActivity(title, ethers.parseEther(reward));
    await tx.wait();
    return 1n; // first activity id
  }

  it("creates an activity with title and reward", async function () {
    const { activities } = await loadFixture(deployFixture);
    await activities.createActivity("AI Workshop", ethers.parseEther("20"));

    const activity = await activities.getActivity(1);
    expect(activity.id).to.equal(1n);
    expect(activity.title).to.equal("AI Workshop");
    expect(activity.rewardAmount).to.equal(ethers.parseEther("20"));
    expect(activity.status).to.equal(0n); // Open
    expect(await activities.activityCount()).to.equal(1n);
  });

  it("rejects empty title or zero reward", async function () {
    const { activities } = await loadFixture(deployFixture);
    await expect(activities.createActivity("", ethers.parseEther("20"))).to.be.revertedWithCustomError(
      activities,
      "EmptyTitle"
    );
    await expect(activities.createActivity("Talk", 0)).to.be.revertedWithCustomError(
      activities,
      "ZeroReward"
    );
  });

  it("lets a student join once while open", async function () {
    const { activities, student } = await loadFixture(deployFixture);
    await openActivity(activities);

    await activities.connect(student).join(1);
    expect(await activities.isEligible(1, student.address)).to.equal(true);
    expect(await activities.getEligibleStudents(1)).to.deep.equal([student.address]);

    await expect(activities.connect(student).join(1)).to.be.revertedWithCustomError(
      activities,
      "AlreadyJoined"
    );
  });

  it("blocks join after close", async function () {
    const { activities, student } = await loadFixture(deployFixture);
    await openActivity(activities);
    await activities.closeActivity(1);

    await expect(activities.connect(student).join(1)).to.be.revertedWithCustomError(
      activities,
      "ActivityIsClosed"
    );
  });

  it("admin confirms eligible student only", async function () {
    const { activities, student, other } = await loadFixture(deployFixture);
    await openActivity(activities);
    await activities.connect(student).join(1);

    await expect(activities.confirmAttendance(1, other.address)).to.be.revertedWithCustomError(
      activities,
      "NotEligible"
    );

    await activities.confirmAttendance(1, student.address);
    expect(await activities.isConfirmed(1, student.address)).to.equal(true);
    expect(await activities.getConfirmedStudents(1)).to.deep.equal([student.address]);

    await expect(activities.confirmAttendance(1, student.address)).to.be.revertedWithCustomError(
      activities,
      "AlreadyConfirmed"
    );
  });

  it("confirmed student claims CRT once and receives an NFT badge", async function () {
    const { token, nft, activities, student } = await loadFixture(deployFixture);
    await openActivity(activities);
    await activities.connect(student).join(1);
    await activities.confirmAttendance(1, student.address);

    await expect(activities.connect(student).claim(1))
      .to.emit(activities, "Claimed")
      .withArgs(1n, student.address, ethers.parseEther("20"));

    // CRT minted
    expect(await token.balanceOf(student.address)).to.equal(ethers.parseEther("20"));
    expect(await activities.hasClaimed(1, student.address)).to.equal(true);

    // NFT badge auto-minted for this activity
    const tokens = await nft.tokensOf(student.address);
    expect(tokens.length).to.equal(1);
    const badge = await nft.badgeOf(tokens[0]);
    expect(badge.activityId).to.equal(1n);
    expect(badge.activityTitle).to.equal("AI Workshop");

    // Double-claim blocked
    await expect(activities.connect(student).claim(1)).to.be.revertedWithCustomError(
      activities,
      "AlreadyClaimed"
    );
  });

  it("rejects claim if not confirmed", async function () {
    const { activities, student } = await loadFixture(deployFixture);
    await openActivity(activities);
    await activities.connect(student).join(1);

    await expect(activities.connect(student).claim(1)).to.be.revertedWithCustomError(
      activities,
      "NotConfirmed"
    );
  });

  it("non-owner cannot create or confirm", async function () {
    const { activities, student } = await loadFixture(deployFixture);
    await expect(
      activities.connect(student).createActivity("Hack", ethers.parseEther("1"))
    ).to.be.revertedWithCustomError(activities, "OwnableUnauthorizedAccount");

    await openActivity(activities);
    await activities.connect(student).join(1);

    await expect(
      activities.connect(student).confirmAttendance(1, student.address)
    ).to.be.revertedWithCustomError(activities, "OwnableUnauthorizedAccount");
  });
});
