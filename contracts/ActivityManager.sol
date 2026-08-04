// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface ICampusRewardToken {
    function mint(address to, uint256 amount) external;
}

interface IAchievementNFT {
    function mint(address to, uint256 activityId, string calldata activityTitle) external returns (uint256 tokenId);
}

/// @title ActivityManager
/// @notice Create activities, student Join, admin confirm attendance, student claim CRT.
/// @dev Pull-model claim: confirmed student calls claim() and pays gas; this contract must be Token minter.
contract ActivityManager is Ownable {
    enum Status {
        Open,
        Closed
    }

    struct Activity {
        uint256 id;
        string title;
        uint256 rewardAmount;
        Status status;
    }

    ICampusRewardToken public immutable token;
    IAchievementNFT    public immutable nft;

    uint256 private _nextActivityId = 1;
    mapping(uint256 => Activity) private _activities;

    mapping(uint256 => mapping(address => bool)) public isEligible;
    mapping(uint256 => mapping(address => bool)) public isConfirmed;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    mapping(uint256 => address[]) private _eligibleStudents;
    mapping(uint256 => address[]) private _confirmedStudents;

    error ActivityNotFound();
    error ActivityIsClosed();
    error EmptyTitle();
    error ZeroReward();
    error AlreadyJoined();
    error NotEligible();
    error AlreadyConfirmed();
    error NotConfirmed();
    error AlreadyClaimed();
    error ZeroAddress();

    event ActivityCreated(uint256 indexed activityId, string title, uint256 rewardAmount);
    event ActivityClosed(uint256 indexed activityId);
    event Joined(uint256 indexed activityId, address indexed student);
    event AttendanceConfirmed(uint256 indexed activityId, address indexed student);
    event Claimed(uint256 indexed activityId, address indexed student, uint256 amount);

    constructor(address tokenAddress, address nftAddress, address initialOwner) Ownable(initialOwner) {
        if (tokenAddress == address(0)) revert ZeroAddress();
        if (nftAddress == address(0))   revert ZeroAddress();
        token = ICampusRewardToken(tokenAddress);
        nft   = IAchievementNFT(nftAddress);
    }

    /// @notice Admin creates an on-chain activity (title + CRT reward amount).
    function createActivity(string calldata title, uint256 rewardAmount)
        external
        onlyOwner
        returns (uint256 activityId)
    {
        if (bytes(title).length == 0) revert EmptyTitle();
        if (rewardAmount == 0) revert ZeroReward();

        activityId = _nextActivityId++;
        _activities[activityId] = Activity({
            id: activityId,
            title: title,
            rewardAmount: rewardAmount,
            status: Status.Open
        });

        emit ActivityCreated(activityId, title, rewardAmount);
    }

    /// @notice Admin closes an activity to stop new joins. Confirm/claim still allowed.
    function closeActivity(uint256 activityId) external onlyOwner {
        Activity storage activity = _getActivity(activityId);
        activity.status = Status.Closed;
        emit ActivityClosed(activityId);
    }

    /// @notice Student self-registers for an open activity (eligible list).
    function join(uint256 activityId) external {
        Activity storage activity = _getActivity(activityId);
        if (activity.status != Status.Open) revert ActivityIsClosed();
        if (isEligible[activityId][msg.sender]) revert AlreadyJoined();

        isEligible[activityId][msg.sender] = true;
        _eligibleStudents[activityId].push(msg.sender);

        emit Joined(activityId, msg.sender);
    }

    /// @notice Admin confirms attendance for a student who already joined.
    function confirmAttendance(uint256 activityId, address student) external onlyOwner {
        if (student == address(0)) revert ZeroAddress();
        _getActivity(activityId);
        if (!isEligible[activityId][student]) revert NotEligible();
        if (isConfirmed[activityId][student]) revert AlreadyConfirmed();

        isConfirmed[activityId][student] = true;
        _confirmedStudents[activityId].push(student);

        emit AttendanceConfirmed(activityId, student);
    }

    /// @notice Confirmed student claims CRT and receives a soulbound attendance NFT.
    ///         Both actions happen in the same transaction — student pays gas once.
    function claim(uint256 activityId) external {
        Activity storage activity = _getActivity(activityId);
        if (!isConfirmed[activityId][msg.sender]) revert NotConfirmed();
        if (hasClaimed[activityId][msg.sender])   revert AlreadyClaimed();

        hasClaimed[activityId][msg.sender] = true;
        uint256 amount = activity.rewardAmount;

        // Mint CRT reward
        token.mint(msg.sender, amount);

        // Auto-mint soulbound attendance badge for this activity
        nft.mint(msg.sender, activityId, activity.title);

        emit Claimed(activityId, msg.sender, amount);
    }

    function getActivity(uint256 activityId)
        external
        view
        returns (uint256 id, string memory title, uint256 rewardAmount, Status status)
    {
        Activity storage activity = _getActivity(activityId);
        return (activity.id, activity.title, activity.rewardAmount, activity.status);
    }

    function activityCount() external view returns (uint256) {
        return _nextActivityId - 1;
    }

    function getEligibleStudents(uint256 activityId) external view returns (address[] memory) {
        _getActivity(activityId);
        return _eligibleStudents[activityId];
    }

    function getConfirmedStudents(uint256 activityId) external view returns (address[] memory) {
        _getActivity(activityId);
        return _confirmedStudents[activityId];
    }

    function _getActivity(uint256 activityId) private view returns (Activity storage activity) {
        activity = _activities[activityId];
        if (activity.id == 0) revert ActivityNotFound();
    }
}
