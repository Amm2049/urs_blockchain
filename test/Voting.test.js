const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Voting", function () {
  async function deployFixture() {
    const [owner, student, other] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("CampusRewardToken");
    const token = await Token.deploy(owner.address);
    await token.waitForDeployment();

    const Voting = await ethers.getContractFactory("Voting");
    const voting = await Voting.deploy(await token.getAddress(), owner.address);
    await voting.waitForDeployment();

    // Tests mint via owner-as-minter; Voting only reads balanceOf (no burner/minter role).
    await token.setMinter(owner.address);

    return { token, voting, owner, student, other };
  }

  async function openPoll(voting, question = "Next reward?", options = ["Coffee", "Hoodie"], duration = 3600) {
    const endTime = (await time.latest()) + duration;
    await voting.createPoll(question, options, endTime);
    return { pollId: 1n, endTime };
  }

  async function fundStudent(token, student, amount = "1") {
    await token.mint(student.address, ethers.parseEther(amount));
  }

  it("creates a poll with question, options, and endTime", async function () {
    const { voting } = await loadFixture(deployFixture);
    const endTime = (await time.latest()) + 3600;
    await voting.createPoll("Next reward?", ["Coffee", "Hoodie"], endTime);

    const poll = await voting.getPoll(1);
    expect(poll.id).to.equal(1n);
    expect(poll.question).to.equal("Next reward?");
    expect(poll.endTime).to.equal(endTime);
    expect(poll.optionCount).to.equal(2n);
    expect(poll.open).to.equal(true);
    expect(await voting.pollCount()).to.equal(1n);
    expect(await voting.getOptions(1)).to.deep.equal(["Coffee", "Hoodie"]);
  });

  it("rejects bad create inputs", async function () {
    const { voting } = await loadFixture(deployFixture);
    const endTime = (await time.latest()) + 3600;

    await expect(voting.createPoll("", ["A", "B"], endTime)).to.be.revertedWithCustomError(
      voting,
      "EmptyQuestion"
    );
    await expect(voting.createPoll("Q", ["OnlyOne"], endTime)).to.be.revertedWithCustomError(
      voting,
      "TooFewOptions"
    );
    await expect(
      voting.createPoll("Q", ["A", ""], endTime)
    ).to.be.revertedWithCustomError(voting, "EmptyOption");
    await expect(
      voting.createPoll("Q", ["A", "B"], await time.latest())
    ).to.be.revertedWithCustomError(voting, "EndTimeNotFuture");
  });

  it("reverts when admin attempts to vote", async function () {
    const { token, voting, owner } = await loadFixture(deployFixture);
    await openPoll(voting);
    await fundStudent(token, owner, "10");

    await expect(voting.connect(owner).vote(1, 0)).to.be.revertedWithCustomError(
      voting,
      "AdminCannotVote"
    );
  });

  it("eligible student votes once; results and history update", async function () {
    const { token, voting, student } = await loadFixture(deployFixture);
    await openPoll(voting);
    await fundStudent(token, student, "1");

    await expect(voting.connect(student).vote(1, 0))
      .to.emit(voting, "Voted")
      .withArgs(1n, student.address, 0n);

    expect(await voting.hasVoted(1, student.address)).to.equal(true);
    expect(await voting.getVotedOption(1, student.address)).to.equal(0n);
    expect(await voting.getResults(1)).to.deep.equal([1n, 0n]);
    expect(await voting.getStudentVotedPollIds(student.address)).to.deep.equal([1n]);

    await expect(voting.connect(student).vote(1, 1)).to.be.revertedWithCustomError(
      voting,
      "AlreadyVoted"
    );
  });

  it("rejects vote without ≥1 CRT", async function () {
    const { token, voting, student } = await loadFixture(deployFixture);
    await openPoll(voting);
    await fundStudent(token, student, "0.5");

    await expect(voting.connect(student).vote(1, 0)).to.be.revertedWithCustomError(
      voting,
      "InsufficientCRT"
    );
  });

  it("rejects vote after endTime (check-on-action)", async function () {
    const { token, voting, student } = await loadFixture(deployFixture);
    const { endTime } = await openPoll(voting, "Q", ["A", "B"], 100);
    await fundStudent(token, student, "1");

    await time.increaseTo(endTime);

    const poll = await voting.getPoll(1);
    expect(poll.open).to.equal(false);

    await expect(voting.connect(student).vote(1, 0)).to.be.revertedWithCustomError(
      voting,
      "PollClosed"
    );
  });

  it("rejects invalid option index", async function () {
    const { token, voting, student } = await loadFixture(deployFixture);
    await openPoll(voting);
    await fundStudent(token, student, "1");

    await expect(voting.connect(student).vote(1, 2)).to.be.revertedWithCustomError(
      voting,
      "InvalidOption"
    );
  });

  it("allows multiple open polls at once", async function () {
    const { token, voting, student } = await loadFixture(deployFixture);
    const t = (await time.latest()) + 7200;
    await voting.createPoll("Poll A", ["Yes", "No"], t);
    await voting.createPoll("Poll B", ["X", "Y", "Z"], t);
    await fundStudent(token, student, "1");

    await voting.connect(student).vote(1, 1);
    await voting.connect(student).vote(2, 2);

    expect(await voting.pollCount()).to.equal(2n);
    expect(await voting.getResults(1)).to.deep.equal([0n, 1n]);
    expect(await voting.getResults(2)).to.deep.equal([0n, 0n, 1n]);
    expect(await voting.getStudentVotedPollIds(student.address)).to.deep.equal([1n, 2n]);
  });

  it("non-owner cannot create polls", async function () {
    const { voting, student } = await loadFixture(deployFixture);
    const endTime = (await time.latest()) + 3600;
    await expect(
      voting.connect(student).createPoll("Hack", ["A", "B"], endTime)
    ).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
  });
});
