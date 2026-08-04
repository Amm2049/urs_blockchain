// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title Campus Reward Token (CRT)
/// @notice Locked ERC20 with owner-managed minter/burner roles.
/// @dev Mint is called by ActivityManager; burn by RewardManager. Transfers between wallets are disabled.
contract CampusRewardToken is ERC20, Ownable {
    address public minter;
    address public burner;

    error TransfersDisabled();
    error NotMinter();
    error NotBurner();
    error ZeroAddress();

    event MinterUpdated(address indexed previousMinter, address indexed newMinter);
    event BurnerUpdated(address indexed previousBurner, address indexed newBurner);

    constructor(address initialOwner) ERC20("Campus Reward Token", "CRT") Ownable(initialOwner) {}

    /// @notice Authorize the contract allowed to mint CRT (ActivityManager).
    function setMinter(address account) external onlyOwner {
        if (account == address(0)) revert ZeroAddress();
        address previous = minter;
        minter = account;
        emit MinterUpdated(previous, account);
    }

    /// @notice Authorize the contract allowed to burn CRT (RewardManager).
    function setBurner(address account) external onlyOwner {
        if (account == address(0)) revert ZeroAddress();
        address previous = burner;
        burner = account;
        emit BurnerUpdated(previous, account);
    }

    /// @notice Mint CRT to a student wallet. Only the authorized minter may call.
    function mint(address to, uint256 amount) external {
        if (msg.sender != minter) revert NotMinter();
        _mint(to, amount);
    }

    /// @notice Burn CRT from a student wallet. Only the authorized burner may call.
    function burn(address from, uint256 amount) external {
        if (msg.sender != burner) revert NotBurner();
        _burn(from, amount);
    }

    /// @dev Block wallet-to-wallet transfers; still allow mint (from=0) and burn (to=0).
    function _update(address from, address to, uint256 value) internal override {
        // override check rules
        if (from != address(0) && to != address(0)) {
            revert TransfersDisabled();
        }
        // Calls OpenZeppelin's original _update() implementation to actually update balances and emit the standard Transfer event
        super._update(from, to, value);
    }
}
