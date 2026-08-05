// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title AchievementNFT
/// @notice Soulbound per-activity attendance badges. Auto-minted by ActivityManager when a
///         student calls claim(). One NFT per activity per student wallet.
/// @dev No Tier enum, no GitLab URI, no admin mint step. The authorised minter (ActivityManager)
///      is set once after deploy via setMinter(). Same access-control pattern as CampusRewardToken.
contract AchievementNFT is ERC721, Ownable {
    // ── State ──────────────────────────────────────────────────────────────────

    struct Badge {
        uint256 activityId;
        string  activityTitle;
    }

    /// @notice Address authorised to mint badges (set to ActivityManager after deploy).
    address public minter;

    uint256 private _nextTokenId = 1;

    mapping(uint256 => Badge)     private _badgeOf;   // tokenId → badge data
    mapping(address => uint256[]) private _tokensOf;  // student  → owned tokenIds

    // ── Errors ─────────────────────────────────────────────────────────────────

    error Soulbound();
    error NotMinter();
    error ZeroAddress();
    error EmptyTitle();
    error AdminCannotReceiveNFT();

    // ── Events ─────────────────────────────────────────────────────────────────

    event MinterUpdated(address indexed previousMinter, address indexed newMinter);
    event AchievementMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 indexed activityId,
        string  activityTitle
    );

    // ── Constructor ────────────────────────────────────────────────────────────

    constructor(address initialOwner)
        ERC721("Campus Achievement", "URS")
        Ownable(initialOwner)
    {}

    // ── Admin ──────────────────────────────────────────────────────────────────

    /// @notice Owner sets the authorised minter (ActivityManager). Called once at deploy time.
    function setMinter(address account) external onlyOwner {
        if (account == address(0)) revert ZeroAddress();
        address previous = minter;
        minter = account;
        emit MinterUpdated(previous, account);
    }

    // ── Mint ───────────────────────────────────────────────────────────────────

    /// @notice Auto-called by ActivityManager.claim(). Mints one soulbound attendance badge.
    /// @param to            Student wallet (recipient).
    /// @param activityId    ID of the activity from ActivityManager.
    /// @param activityTitle Title of the activity (stored on-chain).
    /// @return tokenId      The new token ID.
    function mint(address to, uint256 activityId, string calldata activityTitle)
        external
        returns (uint256 tokenId)
    {
        if (msg.sender != minter)             revert NotMinter();
        if (to == address(0))                 revert ZeroAddress();
        if (to == owner())                    revert AdminCannotReceiveNFT();
        if (bytes(activityTitle).length == 0) revert EmptyTitle();

        tokenId = _nextTokenId++;
        _badgeOf[tokenId]  = Badge({activityId: activityId, activityTitle: activityTitle});
        _tokensOf[to].push(tokenId);

        _safeMint(to, tokenId);

        emit AchievementMinted(to, tokenId, activityId, activityTitle);
    }

    // ── Views ──────────────────────────────────────────────────────────────────

    /// @notice Badge data stored on-chain for a given token.
    function badgeOf(uint256 tokenId)
        external
        view
        returns (uint256 activityId, string memory activityTitle)
    {
        _requireOwned(tokenId);
        Badge storage b = _badgeOf[tokenId];
        return (b.activityId, b.activityTitle);
    }

    /// @notice All tokenIds held by a student (one per activity attended and claimed).
    function tokensOf(address student) external view returns (uint256[] memory) {
        return _tokensOf[student];
    }

    /// @notice Returns true if the student holds at least one badge.
    function hasAnyBadge(address student) external view returns (bool) {
        return _tokensOf[student].length > 0;
    }

    /// @notice Total badges minted across all students.
    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    // ── Soulbound ──────────────────────────────────────────────────────────────

    /// @dev Block wallet-to-wallet transfers; mint (from == address(0)) still allowed.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert Soulbound();
        }
        return super._update(to, tokenId, auth);
    }
}
