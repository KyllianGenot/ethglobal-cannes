// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FractionalToken is ERC20, ReentrancyGuard, Ownable {
    uint256 public nftTokenId;
    address public immutable nftContract;
    uint256 public immutable totalShares;
    uint256 public sharePrice;
    bool public tradingEnabled = true;
    bool public initialized = false;

    // Tracking of shares sold
    uint256 public sharesSold;
    mapping(address => uint256) public sharesPurchased;

    // Events
    event SharesPurchased(address indexed buyer, uint256 shares, uint256 totalCost);
    event SharesSold(address indexed seller, uint256 shares, uint256 totalReceived);
    event SharePriceUpdated(uint256 newPrice);
    event TradingStatusChanged(bool enabled);

    constructor(
        address _nftContract,
        uint256 _totalShares,
        uint256 _sharePrice,
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        nftContract = _nftContract;
        totalShares = _totalShares;
        sharePrice = _sharePrice;

        // Mint all shares to this contract initially
        _mint(address(this), _totalShares);
    }

    /**
     * @dev Initialize the NFT token ID (can only be called once by owner)
     * @param _nftTokenId The NFT token ID
     */
    function initialize(uint256 _nftTokenId) external onlyOwner {
        require(!initialized, "Already initialized");
        nftTokenId = _nftTokenId;
        initialized = true;
    }

    /**
     * @dev Purchase fractional shares of the NFT
     * @param _shares Number of shares to purchase
     */
    function purchaseShares(uint256 _shares) external payable nonReentrant {
        _purchaseSharesFor(msg.sender, _shares);
    }

    /**
     * @dev Purchase fractional shares of the NFT for a specific recipient
     * @param _recipient Address to receive the shares
     * @param _shares Number of shares to purchase
     */
    function purchaseSharesFor(address _recipient, uint256 _shares) external payable nonReentrant {
        _purchaseSharesFor(_recipient, _shares);
    }

    /**
     * @dev Internal function to purchase shares for a recipient
     */
    function _purchaseSharesFor(address _recipient, uint256 _shares) internal {
        require(initialized, "Contract not initialized");
        require(tradingEnabled, "Trading is disabled");
        require(_shares > 0, "Must purchase at least 1 share");
        require(_shares <= balanceOf(address(this)), "Not enough shares available");
        require(_recipient != address(0), "Invalid recipient");

        uint256 totalCost = _shares * sharePrice;
        require(msg.value == totalCost, "Incorrect ETH amount");

        // Transfer shares to recipient
        _transfer(address(this), _recipient, _shares);

        // Update tracking
        sharesSold += _shares;
        sharesPurchased[_recipient] += _shares;

        emit SharesPurchased(_recipient, _shares, totalCost);
    }

    /**
     * @dev Sell fractional shares back to the contract
     * @param _shares Number of shares to sell
     */
    function sellShares(uint256 _shares) external nonReentrant {
        require(initialized, "Contract not initialized");
        require(tradingEnabled, "Trading is disabled");
        require(_shares > 0, "Must sell at least 1 share");
        require(balanceOf(msg.sender) >= _shares, "Insufficient shares");

        uint256 totalValue = _shares * sharePrice;
        require(address(this).balance >= totalValue, "Contract has insufficient ETH");

        // Transfer shares back to contract
        _transfer(msg.sender, address(this), _shares);

        // Send ETH to seller
        payable(msg.sender).transfer(totalValue);

        // Update tracking
        sharesSold -= _shares;
        sharesPurchased[msg.sender] -= _shares;

        emit SharesSold(msg.sender, _shares, totalValue);
    }

    /**
     * @dev Update share price (only owner)
     * @param _newPrice New price per share in wei
     */
    function updateSharePrice(uint256 _newPrice) external onlyOwner {
        require(_newPrice > 0, "Price must be greater than 0");
        sharePrice = _newPrice;
        emit SharePriceUpdated(_newPrice);
    }

    /**
     * @dev Enable/disable trading (only owner)
     * @param _enabled Whether trading should be enabled
     */
    function setTradingEnabled(bool _enabled) external onlyOwner {
        tradingEnabled = _enabled;
        emit TradingStatusChanged(_enabled);
    }

    /**
     * @dev Get available shares for purchase
     */
    function getAvailableShares() external view returns (uint256) {
        return balanceOf(address(this));
    }

    /**
     * @dev Get contract info
     */
    function getContractInfo()
        external
        view
        returns (
            address _nftContract,
            uint256 _nftTokenId,
            uint256 _totalShares,
            uint256 _sharesSold,
            uint256 _sharePrice,
            bool _tradingEnabled,
            uint256 _availableShares
        )
    {
        return (nftContract, nftTokenId, totalShares, sharesSold, sharePrice, tradingEnabled, balanceOf(address(this)));
    }

    /**
     * @dev Withdraw accumulated ETH (only owner)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        payable(owner()).transfer(balance);
    }

    /**
     * @dev Get user's share information
     */
    function getUserInfo(address user)
        external
        view
        returns (uint256 _shareBalance, uint256 _sharesPurchased, uint256 _shareValue)
    {
        uint256 balance = balanceOf(user);
        return (balance, sharesPurchased[user], balance * sharePrice);
    }
}
