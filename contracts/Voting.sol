// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface ICampusRewardTokenBalance {
    function balanceOf(address account) external view returns (uint256);
}

/// @title Voting
/// @notice CRT-gated polls: admin creates, students vote once before endTime (check-on-action).
/// @dev Does not mint/burn CRT — only reads balanceOf. Multiple polls may be open at once.
contract Voting is Ownable {
    /// @notice Minimum CRT (18 decimals) required to vote — 1 whole CRT.
    uint256 public constant MIN_CRT_TO_VOTE = 1 ether;

    struct Poll {
        uint256 id;
        string question;
        uint256 endTime;
        uint256 optionCount;
    }

    ICampusRewardTokenBalance public immutable token;

    uint256 private _nextPollId = 1;
    mapping(uint256 => Poll) private _polls;
    mapping(uint256 => mapping(uint256 => string)) private _options;
    mapping(uint256 => mapping(uint256 => uint256)) private _voteCounts;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => uint256)) private _votedOption;
    mapping(address => uint256[]) private _studentVotedPollIds;

    error PollNotFound();
    error PollClosed();
    error AlreadyVoted();
    error InvalidOption();
    error EmptyQuestion();
    error EmptyOption();
    error TooFewOptions();
    error EndTimeNotFuture();
    error InsufficientCRT();
    error ZeroAddress();
    error NotVoted();

    event PollCreated(
        uint256 indexed pollId, string question, uint256 endTime, uint256 optionCount
    );
    event Voted(uint256 indexed pollId, address indexed voter, uint256 optionIndex);

    constructor(address tokenAddress, address initialOwner) Ownable(initialOwner) {
        if (tokenAddress == address(0)) revert ZeroAddress();
        token = ICampusRewardTokenBalance(tokenAddress);
    }

    /// @notice Admin opens a poll. Closes automatically when block.timestamp >= endTime.
    function createPoll(string calldata question, string[] calldata options, uint256 endTime)
        external
        onlyOwner
        returns (uint256 pollId)
    {
        if (bytes(question).length == 0) revert EmptyQuestion();
        if (options.length < 2) revert TooFewOptions();
        if (endTime <= block.timestamp) revert EndTimeNotFuture();

        pollId = _nextPollId++;
        uint256 optionCount = options.length;

        _polls[pollId] = Poll({
            id: pollId,
            question: question,
            endTime: endTime,
            optionCount: optionCount
        });

        for (uint256 i = 0; i < optionCount; i++) {
            if (bytes(options[i]).length == 0) revert EmptyOption();
            _options[pollId][i] = options[i];
        }

        emit PollCreated(pollId, question, endTime, optionCount);
    }

    /// @notice Student casts one vote if they hold ≥1 CRT and the poll has not ended.
    function vote(uint256 pollId, uint256 optionIndex) external {
        Poll storage poll = _getPoll(pollId);
        if (block.timestamp >= poll.endTime) revert PollClosed();
        if (hasVoted[pollId][msg.sender]) revert AlreadyVoted();
        if (optionIndex >= poll.optionCount) revert InvalidOption();
        if (token.balanceOf(msg.sender) < MIN_CRT_TO_VOTE) revert InsufficientCRT();

        hasVoted[pollId][msg.sender] = true;
        _votedOption[pollId][msg.sender] = optionIndex;
        _voteCounts[pollId][optionIndex] += 1;
        _studentVotedPollIds[msg.sender].push(pollId);

        emit Voted(pollId, msg.sender, optionIndex);
    }

    function getPoll(uint256 pollId)
        external
        view
        returns (
            uint256 id,
            string memory question,
            uint256 endTime,
            uint256 optionCount,
            bool open
        )
    {
        Poll storage poll = _getPoll(pollId);
        return (
            poll.id,
            poll.question,
            poll.endTime,
            poll.optionCount,
            block.timestamp < poll.endTime
        );
    }

    function pollCount() external view returns (uint256) {
        return _nextPollId - 1;
    }

    function getOptions(uint256 pollId) external view returns (string[] memory options) {
        Poll storage poll = _getPoll(pollId);
        options = new string[](poll.optionCount);
        for (uint256 i = 0; i < poll.optionCount; i++) {
            options[i] = _options[pollId][i];
        }
    }

    function getResults(uint256 pollId) external view returns (uint256[] memory counts) {
        Poll storage poll = _getPoll(pollId);
        counts = new uint256[](poll.optionCount);
        for (uint256 i = 0; i < poll.optionCount; i++) {
            counts[i] = _voteCounts[pollId][i];
        }
    }

    /// @notice Option index the student chose; reverts if they have not voted.
    function getVotedOption(uint256 pollId, address student) external view returns (uint256) {
        _getPoll(pollId);
        if (!hasVoted[pollId][student]) revert NotVoted();
        return _votedOption[pollId][student];
    }

    function getStudentVotedPollIds(address student) external view returns (uint256[] memory) {
        return _studentVotedPollIds[student];
    }

    function _getPoll(uint256 pollId) private view returns (Poll storage poll) {
        poll = _polls[pollId];
        if (poll.id == 0) revert PollNotFound();
    }
}
