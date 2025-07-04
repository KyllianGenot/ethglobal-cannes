// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./FractionalizedNFT.sol";
import "./FractionalToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFTFractionalizationFactory is Ownable, ReentrancyGuard {
    FractionalizedNFT public nftContract;
    
    // Mapping from token ID to fractional token contract
    mapping(uint256 => address) public fractionalTokens;
    
    // Array to track all created NFTs
    uint256[] public allNFTs;
    
    // Events
    event NFTCreatedAndFractionalized(
        uint256 indexed tokenId,
        address indexed fractionalToken,
        uint256 totalShares,
        uint256 sharePrice,
        string name,
        string symbol,
        string uri
    );
    
    constructor(string memory nftName, string memory nftSymbol) Ownable(msg.sender) {
        nftContract = new FractionalizedNFT(nftName, nftSymbol);
    }
    
    /**
     * @dev Create a new NFT and automatically fractionalize it
     * @param _totalShares Total number of shares to create
     * @param _sharePrice Price per share in wei
     * @param _name Name for the fractional token
     * @param _symbol Symbol for the fractional token
     */
    function createFractionalizedNFT(
        uint256 _totalShares,
        uint256 _sharePrice,
        string memory _name,
        string memory _symbol,
        string memory _uri
    ) external onlyOwner nonReentrant returns (uint256 tokenId, address fractionalToken) {
        require(_totalShares > 0, "Total shares must be greater than 0");
        require(_sharePrice > 0, "Share price must be greater than 0");
        require(bytes(_uri).length > 0, "Token URI cannot be empty");
        
        // Deploy fractional token contract first
        FractionalToken newFractionalToken = new FractionalToken(
            address(nftContract),
            _totalShares,
            _sharePrice,
            _name,
            _symbol
        );
        
        fractionalToken = address(newFractionalToken);
        
        // Mint NFT to the factory owner (deployer) instead of the fractional token
        tokenId = nftContract.mint(owner(), fractionalToken, _uri);
        
        // Initialize the fractional token with the correct token ID
        newFractionalToken.initialize(tokenId);
        
        // Store the mapping
        fractionalTokens[tokenId] = fractionalToken;
        allNFTs.push(tokenId);
        
        emit NFTCreatedAndFractionalized(
            tokenId,
            fractionalToken,
            _totalShares,
            _sharePrice,
            _name,
            _symbol,
            _uri
        );
        
        return (tokenId, fractionalToken);
    }
    
    /**
     * @dev Purchase shares of a fractionalized NFT
     * @param _tokenId The NFT token ID
     * @param _shares Number of shares to purchase
     */
    function purchaseShares(uint256 _tokenId, uint256 _shares) external payable nonReentrant {
        address fractionalTokenAddress = fractionalTokens[_tokenId];
        require(fractionalTokenAddress != address(0), "NFT not fractionalized");
        
        FractionalToken fractionalToken = FractionalToken(fractionalTokenAddress);
        
        // Purchase shares for the caller
        fractionalToken.purchaseSharesFor{value: msg.value}(msg.sender, _shares);
    }
    
    /**
     * @dev Get fractional token contract to interact with directly
     * Users should call sellShares directly on the fractional token contract
     * @param _tokenId The NFT token ID
     */
    function getFractionalTokenContract(uint256 _tokenId) external view returns (FractionalToken) {
        address fractionalTokenAddress = fractionalTokens[_tokenId];
        require(fractionalTokenAddress != address(0), "NFT not fractionalized");
        return FractionalToken(fractionalTokenAddress);
    }
    
    /**
     * @dev Get information about a fractionalized NFT
     */
    function getNFTInfo(uint256 _tokenId) external view returns (
        address fractionalTokenAddress,
        address nftOwner,
        uint256 totalShares,
        uint256 sharesSold,
        uint256 sharePrice,
        bool tradingEnabled,
        uint256 availableShares
    ) {
        fractionalTokenAddress = fractionalTokens[_tokenId];
        if (fractionalTokenAddress == address(0)) {
            return (address(0), address(0), 0, 0, 0, false, 0);
        }
        
        nftOwner = nftContract.ownerOf(_tokenId);
        FractionalToken fractionalToken = FractionalToken(fractionalTokenAddress);
        
        (
            ,
            ,
            totalShares,
            sharesSold,
            sharePrice,
            tradingEnabled,
            availableShares
        ) = fractionalToken.getContractInfo();
    }
    
    /**
     * @dev Get user's information for a specific NFT
     */
    function getUserNFTInfo(uint256 _tokenId, address _user) external view returns (
        uint256 shareBalance,
        uint256 sharesPurchased,
        uint256 shareValue
    ) {
        address fractionalTokenAddress = fractionalTokens[_tokenId];
        if (fractionalTokenAddress == address(0)) {
            return (0, 0, 0);
        }
        
        FractionalToken fractionalToken = FractionalToken(fractionalTokenAddress);
        return fractionalToken.getUserInfo(_user);
    }
    
    /**
     * @dev Get all created NFT token IDs
     */
    function getAllNFTs() external view returns (uint256[] memory) {
        return allNFTs;
    }
    
    /**
     * @dev Get fractional token contract address for an NFT
     */
    function getFractionalToken(uint256 _tokenId) external view returns (address) {
        return fractionalTokens[_tokenId];
    }
    
    /**
     * @dev Get total number of created NFTs
     */
    function getTotalNFTs() external view returns (uint256) {
        return allNFTs.length;
    }
    
    /**
     * @dev Update share price for a specific NFT (only owner)
     */
    function updateSharePrice(uint256 _tokenId, uint256 _newPrice) external onlyOwner {
        address fractionalTokenAddress = fractionalTokens[_tokenId];
        require(fractionalTokenAddress != address(0), "NFT not fractionalized");
        
        FractionalToken fractionalToken = FractionalToken(fractionalTokenAddress);
        fractionalToken.updateSharePrice(_newPrice);
    }
    
    /**
     * @dev Enable/disable trading for a specific NFT (only owner)
     */
    function setTradingEnabled(uint256 _tokenId, bool _enabled) external onlyOwner {
        address fractionalTokenAddress = fractionalTokens[_tokenId];
        require(fractionalTokenAddress != address(0), "NFT not fractionalized");
        
        FractionalToken fractionalToken = FractionalToken(fractionalTokenAddress);
        fractionalToken.setTradingEnabled(_enabled);
    }
    
    /**
     * @dev Withdraw accumulated ETH from a fractional token contract (only owner)
     */
    function withdrawFromFractionalToken(uint256 _tokenId) external onlyOwner {
        address fractionalTokenAddress = fractionalTokens[_tokenId];
        require(fractionalTokenAddress != address(0), "NFT not fractionalized");
        
        FractionalToken fractionalToken = FractionalToken(fractionalTokenAddress);
        fractionalToken.withdraw();
    }
} 