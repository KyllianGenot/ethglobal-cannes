// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FractionalizedNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    mapping(uint256 => address) public fractionalizedContracts;

    // Mapping to store the IPFS URI of each NFT
    mapping(uint256 => string) private _tokenURIs;

    event NFTCreated(uint256 indexed tokenId, address indexed creator, address fractionalContract, string uri);

    constructor(string memory name, string memory symbol) ERC721(name, symbol) Ownable(msg.sender) {
        _tokenIdCounter = 1;
    }

    /**
     * @dev Mint a new NFT (only owner can mint)
     * @param to The address to mint the NFT to
     * @param fractionalContract The address of the fractional contract managing this NFT
     * @param uri The IPFS URI containing the NFT metadata (image, description, etc.)
     */
    function mint(address to, address fractionalContract, string memory uri) external onlyOwner returns (uint256) {
        require(bytes(uri).length > 0, "URI cannot be empty");

        uint256 tokenId = _tokenIdCounter++;
        _mint(to, tokenId);
        fractionalizedContracts[tokenId] = fractionalContract;
        _tokenURIs[tokenId] = uri;

        emit NFTCreated(tokenId, to, fractionalContract, uri);
        return tokenId;
    }

    /**
     * @dev Get the IPFS URI for a specific token
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        ownerOf(tokenId);
        return _tokenURIs[tokenId];
    }

    /**
     * @dev Get the fractional contract address for a token
     */
    function getFractionalContract(uint256 tokenId) external view returns (address) {
        return fractionalizedContracts[tokenId];
    }

    /**
     * @dev Get total number of minted tokens
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
}
