// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./FractionalizedNFT.sol";
import "./FractionalToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract NFTFractionalizationFactory is Ownable, ReentrancyGuard {
    FractionalizedNFT public nftContract;
    IERC20 public constant usdfToken = IERC20(0xd7d43ab7b365f0d0789aE83F4385fA710FfdC98F);
    mapping(uint256 => address) public fractionalTokens;

    event NFTCreatedAndFractionalized(
        uint256 indexed tokenId, address indexed fractionalToken, uint256 totalShares, uint256 sharePrice
    );

    constructor(string memory nftName, string memory nftSymbol) Ownable(msg.sender) {
        nftContract = new FractionalizedNFT(nftName, nftSymbol);
    }

    function createFractionalizedNFT(
        uint256 _totalShares,
        uint256 _totalPrice,
        string memory _name,
        string memory _symbol,
        string memory _uri
    ) external onlyOwner nonReentrant returns (uint256 tokenId, address fractionalToken) {
        require(_totalShares > 0 && _totalPrice > 0, "Invalid parameters");
        require(bytes(_uri).length > 0, "Empty URI");

        uint256 sharePrice = _totalPrice / _totalShares;
        require(sharePrice > 0, "Share price too small");

        FractionalToken newFractionalToken =
            new FractionalToken(address(nftContract), _totalShares, sharePrice, _name, _symbol);

        fractionalToken = address(newFractionalToken);
        tokenId = nftContract.mint(owner(), fractionalToken, _uri);
        newFractionalToken.initialize(tokenId);
        fractionalTokens[tokenId] = fractionalToken;

        emit NFTCreatedAndFractionalized(tokenId, fractionalToken, _totalShares, sharePrice);
    }

    function purchaseShares(uint256 _tokenId, uint256 _shares) external nonReentrant {
        address fractionalTokenAddress = fractionalTokens[_tokenId];
        require(fractionalTokenAddress != address(0), "NFT not fractionalized");
        FractionalToken(fractionalTokenAddress).purchaseSharesFor(msg.sender, _shares);
    }

    function getFractionalToken(uint256 _tokenId) external view returns (address) {
        return fractionalTokens[_tokenId];
    }

    function getSharePrice(uint256 _tokenId) external view returns (uint256 sharePrice) {
        address fractionalTokenAddress = fractionalTokens[_tokenId];
        require(fractionalTokenAddress != address(0), "NFT not fractionalized");
        (,,,, sharePrice,,) = FractionalToken(fractionalTokenAddress).getContractInfo();
    }

    function updateTotalPrice(uint256 _tokenId, uint256 _newTotalPrice) external onlyOwner {
        address fractionalTokenAddress = fractionalTokens[_tokenId];
        require(fractionalTokenAddress != address(0), "NFT not fractionalized");

        FractionalToken fractionalToken = FractionalToken(fractionalTokenAddress);
        (,, uint256 totalShares,,,,) = fractionalToken.getContractInfo();
        uint256 newSharePrice = _newTotalPrice / totalShares;
        require(newSharePrice > 0, "Share price too small");

        fractionalToken.updateSharePrice(newSharePrice);
    }

    function setTradingEnabled(uint256 _tokenId, bool _enabled) external onlyOwner {
        address fractionalTokenAddress = fractionalTokens[_tokenId];
        require(fractionalTokenAddress != address(0), "NFT not fractionalized");
        FractionalToken(fractionalTokenAddress).setTradingEnabled(_enabled);
    }

    function withdrawFromFractionalToken(uint256 _tokenId) external onlyOwner {
        address fractionalTokenAddress = fractionalTokens[_tokenId];
        require(fractionalTokenAddress != address(0), "NFT not fractionalized");
        FractionalToken(fractionalTokenAddress).withdraw();
    }
}
