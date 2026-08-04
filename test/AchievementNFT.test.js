const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("AchievementNFT", function () {
  async function deployFixture() {
    const [owner, minter, student, other] = await ethers.getSigners();

    const AchievementNFT = await ethers.getContractFactory("AchievementNFT");
    const nft = await AchievementNFT.deploy(owner.address);
    await nft.waitForDeployment();

    // Wire minter role (production: set to ActivityManager address)
    await nft.setMinter(minter.address);

    return { nft, owner, minter, student, other };
  }

  // ── setMinter ────────────────────────────────────────────────────────────────

  it("owner can set and update minter", async function () {
    const { nft, owner, minter, other } = await loadFixture(deployFixture);
    expect(await nft.minter()).to.equal(minter.address);

    await nft.setMinter(other.address);
    expect(await nft.minter()).to.equal(other.address);
  });

  it("rejects zero-address minter", async function () {
    const { nft } = await loadFixture(deployFixture);
    await expect(nft.setMinter(ethers.ZeroAddress)).to.be.revertedWithCustomError(
      nft, "ZeroAddress"
    );
  });

  it("non-owner cannot set minter", async function () {
    const { nft, other } = await loadFixture(deployFixture);
    await expect(
      nft.connect(other).setMinter(other.address)
    ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
  });

  // ── mint ─────────────────────────────────────────────────────────────────────

  it("authorised minter mints a badge with correct data", async function () {
    const { nft, minter, student } = await loadFixture(deployFixture);

    await expect(
      nft.connect(minter).mint(student.address, 1n, "AI Workshop")
    )
      .to.emit(nft, "AchievementMinted")
      .withArgs(student.address, 1n, 1n, "AI Workshop");

    expect(await nft.ownerOf(1)).to.equal(student.address);
    const badge = await nft.badgeOf(1);
    expect(badge.activityId).to.equal(1n);
    expect(badge.activityTitle).to.equal("AI Workshop");
    expect(await nft.totalMinted()).to.equal(1n);
  });

  it("non-minter cannot mint", async function () {
    const { nft, other, student } = await loadFixture(deployFixture);
    await expect(
      nft.connect(other).mint(student.address, 1n, "AI Workshop")
    ).to.be.revertedWithCustomError(nft, "NotMinter");
  });

  it("rejects zero-address recipient", async function () {
    const { nft, minter } = await loadFixture(deployFixture);
    await expect(
      nft.connect(minter).mint(ethers.ZeroAddress, 1n, "AI Workshop")
    ).to.be.revertedWithCustomError(nft, "ZeroAddress");
  });

  it("rejects empty activity title", async function () {
    const { nft, minter, student } = await loadFixture(deployFixture);
    await expect(
      nft.connect(minter).mint(student.address, 1n, "")
    ).to.be.revertedWithCustomError(nft, "EmptyTitle");
  });

  // ── multiple badges per student ───────────────────────────────────────────────

  it("student collects one badge per activity attended", async function () {
    const { nft, minter, student } = await loadFixture(deployFixture);

    await nft.connect(minter).mint(student.address, 1n, "AI Workshop");
    await nft.connect(minter).mint(student.address, 2n, "Blockchain Seminar");
    await nft.connect(minter).mint(student.address, 3n, "Hackathon");

    const tokens = await nft.tokensOf(student.address);
    expect(tokens).to.deep.equal([1n, 2n, 3n]);
    expect(await nft.totalMinted()).to.equal(3n);

    const badge2 = await nft.badgeOf(2);
    expect(badge2.activityId).to.equal(2n);
    expect(badge2.activityTitle).to.equal("Blockchain Seminar");
  });

  it("different students each get their own badges", async function () {
    const { nft, minter, student, other } = await loadFixture(deployFixture);

    await nft.connect(minter).mint(student.address, 1n, "AI Workshop");
    await nft.connect(minter).mint(other.address,   1n, "AI Workshop");

    expect(await nft.tokensOf(student.address)).to.deep.equal([1n]);
    expect(await nft.tokensOf(other.address)).to.deep.equal([2n]);
  });

  // ── views ─────────────────────────────────────────────────────────────────────

  it("hasAnyBadge returns false before mint and true after", async function () {
    const { nft, minter, student } = await loadFixture(deployFixture);
    expect(await nft.hasAnyBadge(student.address)).to.equal(false);

    await nft.connect(minter).mint(student.address, 1n, "AI Workshop");
    expect(await nft.hasAnyBadge(student.address)).to.equal(true);
  });

  it("tokensOf returns empty array for student with no badges", async function () {
    const { nft, student } = await loadFixture(deployFixture);
    expect(await nft.tokensOf(student.address)).to.deep.equal([]);
  });

  // ── soulbound ─────────────────────────────────────────────────────────────────

  it("blocks transfer between wallets (soulbound)", async function () {
    const { nft, minter, student, other } = await loadFixture(deployFixture);
    await nft.connect(minter).mint(student.address, 1n, "AI Workshop");

    await expect(
      nft.connect(student).transferFrom(student.address, other.address, 1)
    ).to.be.revertedWithCustomError(nft, "Soulbound");

    await expect(
      nft.connect(student)["safeTransferFrom(address,address,uint256)"](
        student.address, other.address, 1
      )
    ).to.be.revertedWithCustomError(nft, "Soulbound");
  });
});


