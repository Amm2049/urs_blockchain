// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface ICampusRewardTokenBurn {
    function burn(address from, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
}

/// @title RewardManager
/// @notice Reward catalog and CRT redemption (burn + on-chain record).
/// @dev This contract must be Token burner. Fulfillment of physical rewards is off-chain.
contract RewardManager is Ownable {
    struct Reward {
        uint256 id;
        string title;
        uint256 cost;
        bool active;
    }

    struct Redemption {
        uint256 id;
        uint256 rewardId;
        address student;
        uint256 cost;
        uint256 timestamp;
    }

    ICampusRewardTokenBurn public immutable token;

    uint256 private _nextRewardId = 1;
    uint256 private _nextRedemptionId = 1;

    mapping(uint256 => Reward) private _rewards;
    mapping(uint256 => Redemption) private _redemptions;
    mapping(address => uint256[]) private _studentRedemptionIds;

    error RewardNotFound();
    error RedemptionNotFound();
    error RewardInactive();
    error EmptyTitle();
    error ZeroCost();
    error InsufficientBalance();
    error ZeroAddress();
    error AdminCannotRedeem();

    event RewardCreated(uint256 indexed rewardId, string title, uint256 cost);
    event RewardActiveUpdated(uint256 indexed rewardId, bool active);
    event Redeemed(
        uint256 indexed redemptionId,
        uint256 indexed rewardId,
        address indexed student,
        uint256 cost
    );

    constructor(address tokenAddress, address initialOwner) Ownable(initialOwner) {
        if (tokenAddress == address(0)) revert ZeroAddress();
        token = ICampusRewardTokenBurn(tokenAddress);
    }

    /// @notice Admin adds a redeemable reward (title + CRT cost).
    function createReward(string calldata title, uint256 cost)
        external
        onlyOwner
        returns (uint256 rewardId)
    {
        if (bytes(title).length == 0) revert EmptyTitle();
        if (cost == 0) revert ZeroCost();

        rewardId = _nextRewardId++;
        _rewards[rewardId] = Reward({id: rewardId, title: title, cost: cost, active: true});

        emit RewardCreated(rewardId, title, cost);
    }

    /// @notice Admin activates or deactivates a reward (inactive cannot be redeemed).
    function setRewardActive(uint256 rewardId, bool active) external onlyOwner {
        Reward storage reward = _getReward(rewardId);
        reward.active = active;
        emit RewardActiveUpdated(rewardId, active);
    }

    /// @notice Student redeems an active reward: burns CRT and records the redemption.
    function redeem(uint256 rewardId) external {
        if (msg.sender == owner()) revert AdminCannotRedeem();
        Reward storage reward = _getReward(rewardId);
        if (!reward.active) revert RewardInactive();

        uint256 cost = reward.cost;
        if (token.balanceOf(msg.sender) < cost) revert InsufficientBalance();

        uint256 redemptionId = _nextRedemptionId++;
        _redemptions[redemptionId] = Redemption({
            id: redemptionId,
            rewardId: rewardId,
            student: msg.sender,
            cost: cost,
            timestamp: block.timestamp
        });
        _studentRedemptionIds[msg.sender].push(redemptionId);

        token.burn(msg.sender, cost);

        emit Redeemed(redemptionId, rewardId, msg.sender, cost);
    }

    function getReward(uint256 rewardId)
        external
        view
        returns (uint256 id, string memory title, uint256 cost, bool active)
    {
        Reward storage reward = _getReward(rewardId);
        return (reward.id, reward.title, reward.cost, reward.active);
    }

    function rewardCount() external view returns (uint256) {
        return _nextRewardId - 1;
    }

    function getRedemption(uint256 redemptionId)
        external
        view
        returns (uint256 id, uint256 rewardId, address student, uint256 cost, uint256 timestamp)
    {
        Redemption storage redemption = _getRedemption(redemptionId);
        return (
            redemption.id,
            redemption.rewardId,
            redemption.student,
            redemption.cost,
            redemption.timestamp
        );
    }

    function redemptionCount() external view returns (uint256) {
        return _nextRedemptionId - 1;
    }

    /// @notice Redemption IDs for a student (dashboard / history).
    function getStudentRedemptionIds(address student) external view returns (uint256[] memory) {
        return _studentRedemptionIds[student];
    }

    function _getReward(uint256 rewardId) private view returns (Reward storage reward) {
        reward = _rewards[rewardId];
        if (reward.id == 0) revert RewardNotFound();
    }

    function _getRedemption(uint256 redemptionId)
        private
        view
        returns (Redemption storage redemption)
    {
        redemption = _redemptions[redemptionId];
        if (redemption.id == 0) revert RedemptionNotFound();
    }
}
