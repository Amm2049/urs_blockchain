const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("CampusRewardToken", function () {
  async function deployTokenFixture() {
    const [owner, minter, burner, student, other] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("CampusRewardToken");
    const token = await Token.deploy(owner.address);
    await token.waitForDeployment();
    return { token, owner, minter, burner, student, other };
  }

  it("sets name, symbol, decimals, and owner", async function () {
    const { token, owner } = await loadFixture(deployTokenFixture);
    expect(await token.name()).to.equal("Campus Reward Token");
    expect(await token.symbol()).to.equal("CRT");
    expect(await token.decimals()).to.equal(18);
    expect(await token.owner()).to.equal(owner.address);
  });

  it("lets owner set minter and burner", async function () {
    const { token, minter, burner } = await loadFixture(deployTokenFixture);
    await token.setMinter(minter.address);
    await token.setBurner(burner.address);
    expect(await token.minter()).to.equal(minter.address);
    expect(await token.burner()).to.equal(burner.address);
  });

  it("rejects zero-address minter/burner", async function () {
    const { token } = await loadFixture(deployTokenFixture);
    await expect(token.setMinter(ethers.ZeroAddress)).to.be.revertedWithCustomError(
      token,
      "ZeroAddress"
    );
    await expect(token.setBurner(ethers.ZeroAddress)).to.be.revertedWithCustomError(
      token,
      "ZeroAddress"
    );
  });

  it("only authorized minter can mint", async function () {
    const { token, minter, student, other } = await loadFixture(deployTokenFixture);
    await token.setMinter(minter.address);

    const amount = ethers.parseEther("20");
    await expect(token.connect(other).mint(student.address, amount)).to.be.revertedWithCustomError(
      token,
      "NotMinter"
    );

    await token.connect(minter).mint(student.address, amount);
    expect(await token.balanceOf(student.address)).to.equal(amount);
  });

  it("only authorized burner can burn", async function () {
    const { token, minter, burner, student, other } = await loadFixture(deployTokenFixture);
    await token.setMinter(minter.address);
    await token.setBurner(burner.address);

    const amount = ethers.parseEther("20");
    await token.connect(minter).mint(student.address, amount);

    await expect(token.connect(other).burn(student.address, amount)).to.be.revertedWithCustomError(
      token,
      "NotBurner"
    );

    await token.connect(burner).burn(student.address, amount);
    expect(await token.balanceOf(student.address)).to.equal(0n);
  });

  it("blocks transfers between wallets but allows mint and burn", async function () {
    const { token, minter, burner, student, other } = await loadFixture(deployTokenFixture);
    await token.setMinter(minter.address);
    await token.setBurner(burner.address);

    const amount = ethers.parseEther("10");
    await token.connect(minter).mint(student.address, amount);

    await expect(
      token.connect(student).transfer(other.address, amount)
    ).to.be.revertedWithCustomError(token, "TransfersDisabled");

    // Approve so transferFrom reaches the locked _update hook (not the allowance check).
    await token.connect(student).approve(other.address, amount);
    await expect(
      token.connect(other).transferFrom(student.address, other.address, amount)
    ).to.be.revertedWithCustomError(token, "TransfersDisabled");

    await token.connect(burner).burn(student.address, amount);
    expect(await token.balanceOf(student.address)).to.equal(0n);
  });

  it("non-owner cannot set roles", async function () {
    const { token, other, minter } = await loadFixture(deployTokenFixture);
    await expect(token.connect(other).setMinter(minter.address)).to.be.revertedWithCustomError(
      token,
      "OwnableUnauthorizedAccount"
    );
  });
});
