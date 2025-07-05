// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/NFTFractionalizationFactory.sol";
import "../src/FractionalizedNFT.sol";
import "../src/FractionalToken.sol";

contract NFTFractionalizationFactoryTest is Test {
    NFTFractionalizationFactory factory;
    
    address constant USDF_ADDRESS = 0xd7d43ab7b365f0d0789aE83F4385fA710FfdC98F;
    
    address owner = address(0x1);
    address user1 = address(0x2);
    address user2 = address(0x3);

    uint256 constant TOTAL_SHARES = 1000;
    uint256 constant TOTAL_PRICE = 1000 * 10**6; // 1000 USDf (6 decimals)
    uint256 constant SHARE_PRICE = TOTAL_PRICE / TOTAL_SHARES; // 1 USDf per share

    function setUp() public {
        // Initialize factory contract with owner privileges
        vm.startPrank(owner);
        factory = new NFTFractionalizationFactory("FractionalizedNFTs", "FNFT");
        vm.stopPrank();

        // Mock USDf token interactions to simulate successful transfers and balances
        // This prevents external token dependency issues during testing
        vm.mockCall(
            USDF_ADDRESS,
            abi.encodeWithSelector(bytes4(keccak256("transferFrom(address,address,uint256)"))),
            abi.encode(true)
        );
        
        vm.mockCall(
            USDF_ADDRESS,
            abi.encodeWithSelector(bytes4(keccak256("transfer(address,uint256)"))),
            abi.encode(true)
        );
        
        vm.mockCall(
            USDF_ADDRESS,
            abi.encodeWithSelector(bytes4(keccak256("balanceOf(address)"))),
            abi.encode(10000 * 10**6) // Mock sufficient balance for all test scenarios
        );
    }

    function testCreateFractionalizedNFT() public {
        vm.startPrank(owner);

        (uint256 tokenId, address fractionalToken) = factory.createFractionalizedNFT(
            TOTAL_SHARES, TOTAL_PRICE, "Fractional Art #1", "FART1", "ipfs://QmExample1"
        );

        vm.stopPrank();

        // Verify NFT creation and token ID assignment
        assertEq(tokenId, 1);
        assertEq(factory.nftContract().totalSupply(), 1);

        // Verify fractional token deployment and proper initialization
        FractionalToken fracToken = FractionalToken(fractionalToken);
        assertEq(fracToken.nftTokenId(), tokenId);
        assertEq(fracToken.totalShares(), TOTAL_SHARES * 10**6); // Adjusted for decimals
        assertEq(fracToken.sharePrice(), SHARE_PRICE);
        assertEq(fracToken.name(), "Fractional Art #1");
        assertEq(fracToken.symbol(), "FART1");
        assertTrue(fracToken.initialized());

        // Verify initial share distribution - all shares should be held by the contract
        assertEq(fracToken.balanceOf(fractionalToken), TOTAL_SHARES * 10**6);
        assertEq(fracToken.getAvailableShares(), TOTAL_SHARES * 10**6);
    }

    function testOnlyOwnerCanCreateNFT() public {
        vm.startPrank(user1);

        // Attempt to create NFT as non-owner should fail
        vm.expectRevert();
        factory.createFractionalizedNFT(TOTAL_SHARES, TOTAL_PRICE, "Fractional Art #1", "FART1", "ipfs://QmExample2");

        vm.stopPrank();
    }

    function testPurchaseShares() public {
        // Setup: Owner creates fractionalized NFT
        vm.startPrank(owner);
        (uint256 tokenId, address fractionalToken) = factory.createFractionalizedNFT(
            TOTAL_SHARES, TOTAL_PRICE, "Fractional Art #1", "FART1", "ipfs://QmExample3"
        );
        vm.stopPrank();

        // Test: User purchases shares directly from fractional token contract
        uint256 sharesToBuy = 100;

        vm.startPrank(user1);
        FractionalToken fracToken = FractionalToken(fractionalToken);
        fracToken.purchaseShares(sharesToBuy);
        vm.stopPrank();

        // Verify share purchase affects user balance and contract state
        assertEq(fracToken.balanceOf(user1), sharesToBuy * 10**6); // Adjusted for decimals
        assertEq(fracToken.sharesSold(), sharesToBuy * 10**6);
        assertEq(fracToken.getAvailableShares(), (TOTAL_SHARES - sharesToBuy) * 10**6);

        // Verify user information tracking
        (uint256 shareBalance, uint256 sharesPurchased, uint256 shareValue) = fracToken.getUserInfo(user1);
        assertEq(shareBalance, sharesToBuy * 10**6);
        assertEq(sharesPurchased, sharesToBuy * 10**6);
        // Share value calculation includes decimals in balance
        assertEq(shareValue, sharesToBuy * 10**6 * SHARE_PRICE);
    }

    function testPurchaseSharesViaFactory() public {
        // Setup: Owner creates fractionalized NFT
        vm.startPrank(owner);
        (uint256 tokenId, address fractionalToken) = factory.createFractionalizedNFT(
            TOTAL_SHARES, TOTAL_PRICE, "Fractional Art #1", "FART1", "ipfs://QmExample4"
        );
        vm.stopPrank();

        // Test: User purchases shares through factory interface
        uint256 sharesToBuy = 100;

        vm.startPrank(user1);
        factory.purchaseShares(tokenId, sharesToBuy);
        vm.stopPrank();

        // Verify factory purchase delegation works correctly
        FractionalToken fracToken = FractionalToken(fractionalToken);
        assertEq(fracToken.balanceOf(user1), sharesToBuy * 10**6);
    }

    function testSellShares() public {
        // Setup: Owner creates fractionalized NFT
        vm.startPrank(owner);
        (uint256 tokenId, address fractionalToken) = factory.createFractionalizedNFT(
            TOTAL_SHARES, TOTAL_PRICE, "Fractional Art #1", "FART1", "ipfs://QmExample5"
        );
        vm.stopPrank();

        // Setup: User purchases shares to have something to sell
        uint256 sharesToBuy = 100;

        vm.startPrank(user1);
        FractionalToken fracToken = FractionalToken(fractionalToken);
        fracToken.purchaseShares(sharesToBuy);

        // Test: User sells portion of their shares
        fracToken.sellShares(50);
        vm.stopPrank();

        // Verify share sale reduces user balance and updates contract state
        assertEq(fracToken.balanceOf(user1), 50 * 10**6);
        assertEq(fracToken.sharesSold(), 50 * 10**6);
    }

    function testUpdateSharePrice() public {
        vm.startPrank(owner);
        (uint256 tokenId,) = factory.createFractionalizedNFT(
            TOTAL_SHARES, TOTAL_PRICE, "Fractional Art #1", "FART1", "ipfs://QmExample6"
        );

        // Test: Owner updates total price which affects individual share price
        uint256 newTotalPrice = 2000 * 10**6; // 2000 USDf
        factory.updateTotalPrice(tokenId, newTotalPrice);
        vm.stopPrank();

        // Verify price update recalculates share price correctly
        // Share price = total price / (total shares with decimals)
        uint256 expectedSharePrice = newTotalPrice / (TOTAL_SHARES * 10**6);
        uint256 actualSharePrice = factory.getSharePrice(tokenId);
        assertEq(actualSharePrice, expectedSharePrice);
    }

    function testSetTradingEnabled() public {
        vm.startPrank(owner);
        (uint256 tokenId, address fractionalToken) = factory.createFractionalizedNFT(
            TOTAL_SHARES, TOTAL_PRICE, "Fractional Art #1", "FART1", "ipfs://QmExample7"
        );

        // Test: Owner disables trading for the fractionalized NFT
        factory.setTradingEnabled(tokenId, false);
        vm.stopPrank();

        // Verify trading state is properly updated
        FractionalToken fracToken = FractionalToken(fractionalToken);
        (,,,,, bool tradingEnabled,) = fracToken.getContractInfo();
        assertFalse(tradingEnabled);

        // Verify trading restriction prevents share purchases
        vm.startPrank(user1);
        vm.expectRevert();
        fracToken.purchaseShares(1);
        vm.stopPrank();
    }

    function testGetFractionalToken() public {
        vm.startPrank(owner);
        (uint256 tokenId, address fractionalToken) = factory.createFractionalizedNFT(
            TOTAL_SHARES, TOTAL_PRICE, "Fractional Art #1", "FART1", "ipfs://QmExample8"
        );
        vm.stopPrank();

        // Test: Factory can retrieve fractional token address by NFT token ID
        address retrievedToken = factory.getFractionalToken(tokenId);
        assertEq(retrievedToken, fractionalToken);
    }

    function testGetContractInfo() public {
        vm.startPrank(owner);
        (uint256 tokenId, address fractionalToken) = factory.createFractionalizedNFT(
            TOTAL_SHARES, TOTAL_PRICE, "Fractional Art #1", "FART1", "ipfs://QmExample9"
        );
        vm.stopPrank();

        // Test: Fractional token provides comprehensive contract information
        FractionalToken fracToken = FractionalToken(fractionalToken);
        (
            address nftContract,
            uint256 nftTokenId,
            uint256 totalShares,
            uint256 sharesSold,
            uint256 sharePrice,
            bool tradingEnabled,
            uint256 availableShares
        ) = fracToken.getContractInfo();

        // Verify all contract information is accurate
        assertEq(nftContract, address(factory.nftContract()));
        assertEq(nftTokenId, tokenId);
        assertEq(totalShares, TOTAL_SHARES * 10**6);
        assertEq(sharesSold, 0);
        assertEq(sharePrice, SHARE_PRICE);
        assertTrue(tradingEnabled);
        assertEq(availableShares, TOTAL_SHARES * 10**6);
    }

    function testWithdrawFromFractionalToken() public {
        // Setup: Owner creates fractionalized NFT
        vm.startPrank(owner);
        (uint256 tokenId, address fractionalToken) = factory.createFractionalizedNFT(
            TOTAL_SHARES, TOTAL_PRICE, "Fractional Art #1", "FART1", "ipfs://QmExample10"
        );
        vm.stopPrank();

        // Setup: User purchases shares to add funds to the contract
        uint256 sharesToBuy = 100;

        vm.startPrank(user1);
        FractionalToken fracToken = FractionalToken(fractionalToken);
        fracToken.purchaseShares(sharesToBuy);
        vm.stopPrank();

        // Test: Owner withdraws accumulated funds from fractional token contract
        vm.startPrank(owner);
        factory.withdrawFromFractionalToken(tokenId);
        vm.stopPrank();

        // Verify withdrawal executes without reverting (exact balance verification requires non-mocked tokens)
    }

    function testNFTContract() public {
        vm.startPrank(owner);
        (uint256 tokenId,) = factory.createFractionalizedNFT(
            TOTAL_SHARES, TOTAL_PRICE, "Fractional Art #1", "FART1", "ipfs://QmExample11"
        );
        vm.stopPrank();

        // Test: NFT contract maintains proper state and metadata
        FractionalizedNFT nftContract = factory.nftContract();
        assertEq(nftContract.totalSupply(), 1);
        assertEq(nftContract.tokenURI(tokenId), "ipfs://QmExample11");
        assertEq(nftContract.ownerOf(tokenId), owner);
    }
}

