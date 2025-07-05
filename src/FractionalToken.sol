// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FractionalToken is ERC20, ReentrancyGuard, Ownable {
    uint256 public nftTokenId;
    address public immutable nftContract;
    uint256 public immutable totalShares;
    uint256 public sharePrice;
    bool public tradingEnabled = true;
    bool public initialized = false;

    IERC20 public constant usdfToken = IERC20(0xd7d43ab7b365f0d0789aE83F4385fA710FfdC98F);

    uint256 public sharesSold;
    mapping(address => uint256) public sharesPurchased;

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
        totalShares = _totalShares * (10 ** decimals());
        sharePrice = _sharePrice;
        _mint(address(this), totalShares);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function initialize(uint256 _nftTokenId) external onlyOwner {
        require(!initialized, "Already initialized");
        nftTokenId = _nftTokenId;
        initialized = true;
    }

    function purchaseShares(uint256 _shares) external nonReentrant {
        _purchaseSharesFor(msg.sender, _shares);
    }

    function purchaseSharesFor(address _recipient, uint256 _shares) external nonReentrant {
        _purchaseSharesFor(_recipient, _shares);
    }

    function _purchaseSharesFor(address _recipient, uint256 _shares) internal {
        require(initialized && tradingEnabled && _shares > 0, "Invalid purchase");

        uint256 adjustedShares = _shares * (10 ** decimals());
        require(adjustedShares <= balanceOf(address(this)), "Not enough shares available");
        require(_recipient != address(0), "Invalid recipient");

        uint256 totalCost = _shares * sharePrice;
        require(usdfToken.transferFrom(msg.sender, address(this), totalCost), "USDf transfer failed");

        _transfer(address(this), _recipient, adjustedShares);
        sharesSold += adjustedShares;
        sharesPurchased[_recipient] += adjustedShares;

        emit SharesPurchased(_recipient, adjustedShares, totalCost);
    }

    function sellShares(uint256 _shares) external nonReentrant {
        require(initialized && tradingEnabled && _shares > 0, "Invalid sale");

        uint256 adjustedShares = _shares * (10 ** decimals());
        require(balanceOf(msg.sender) >= adjustedShares, "Insufficient shares");

        uint256 totalValue = _shares * sharePrice;
        require(usdfToken.balanceOf(address(this)) >= totalValue, "Contract has insufficient USDf");

        _transfer(msg.sender, address(this), adjustedShares);
        require(usdfToken.transfer(msg.sender, totalValue), "USDf transfer failed");

        sharesSold -= adjustedShares;
        sharesPurchased[msg.sender] -= adjustedShares;

        emit SharesSold(msg.sender, adjustedShares, totalValue);
    }

    function updateSharePrice(uint256 _newPrice) external onlyOwner {
        require(_newPrice > 0, "Price must be greater than 0");
        sharePrice = _newPrice;
        emit SharePriceUpdated(_newPrice);
    }

    function setTradingEnabled(bool _enabled) external onlyOwner {
        tradingEnabled = _enabled;
        emit TradingStatusChanged(_enabled);
    }

    function getAvailableShares() external view returns (uint256) {
        return balanceOf(address(this));
    }

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

    function withdraw() external onlyOwner {
        uint256 balance = usdfToken.balanceOf(address(this));
        require(balance > 0, "No USDf to withdraw");
        require(usdfToken.transfer(owner(), balance), "USDf transfer failed");
    }

    function getUserInfo(address user)
        external
        view
        returns (uint256 _shareBalance, uint256 _sharesPurchased, uint256 _shareValue)
    {
        uint256 balance = balanceOf(user);
        return (balance, sharesPurchased[user], balance * sharePrice);
    }
}
