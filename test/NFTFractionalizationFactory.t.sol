// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/NFTFractionalizationFactory.sol";
import "../src/FractionalizedNFT.sol";
import "../src/FractionalToken.sol";

contract NFTFractionalizationFactoryTest is Test {
    NFTFractionalizationFactory factory;
    address owner = address(0x1);
    address user1 = address(0x2);
    address user2 = address(0x3);

    uint256 constant TOTAL_SHARES = 1000;
    uint256 constant SHARE_PRICE = 0.001 ether;

    function setUp() public {
        vm.startPrank(owner);
        factory = new NFTFractionalizationFactory("FractionalizedNFTs", "FNFT");
        vm.stopPrank();

        // Give users some ETH
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }

    function testCreateFractionalizedNFT() public {
        vm.startPrank(owner);

        (uint256 tokenId, address fractionalToken) = factory.createFractionalizedNFT(
            TOTAL_SHARES, SHARE_PRICE, "Fractional Art #1", "FART1", "ipfs://QmExample1"
        );

        vm.stopPrank();

        // Verify NFT was created
        assertEq(tokenId, 1);
        assertEq(factory.getTotalNFTs(), 1);

        // Verify fractional token was created and initialized
        FractionalToken fracToken = FractionalToken(fractionalToken);
        assertEq(fracToken.nftTokenId(), tokenId);
        assertEq(fracToken.totalShares(), TOTAL_SHARES);
        assertEq(fracToken.sharePrice(), SHARE_PRICE);
        assertEq(fracToken.name(), "Fractional Art #1");
        assertEq(fracToken.symbol(), "FART1");
        assertTrue(fracToken.initialized());

        // Verify all shares are in the contract initially
        assertEq(fracToken.balanceOf(fractionalToken), TOTAL_SHARES);
        assertEq(fracToken.getAvailableShares(), TOTAL_SHARES);
    }

    function testOnlyOwnerCanCreateNFT() public {
        vm.startPrank(user1);

        vm.expectRevert();
        factory.createFractionalizedNFT(TOTAL_SHARES, SHARE_PRICE, "Fractional Art #1", "FART1", "ipfs://QmExample2");

        vm.stopPrank();
    }

    function testPurchaseShares() public {
        // Owner creates NFT
        vm.startPrank(owner);
        (uint256 tokenId, address fractionalToken) = factory.createFractionalizedNFT(
            TOTAL_SHARES, SHARE_PRICE, "Fractional Art #1", "FART1", "ipfs://QmExample3"
        );
        vm.stopPrank();

        // User1 purchases shares
        uint256 sharesToBuy = 100;
        uint256 totalCost = sharesToBuy * SHARE_PRICE;

        vm.startPrank(user1);
        factory.purchaseShares{value: totalCost}(tokenId, sharesToBuy);
        vm.stopPrank();

        // Verify purchase
        FractionalToken fracToken = FractionalToken(fractionalToken);
        assertEq(fracToken.balanceOf(user1), sharesToBuy);
        assertEq(fracToken.sharesSold(), sharesToBuy);
        assertEq(fracToken.getAvailableShares(), TOTAL_SHARES - sharesToBuy);

        // Verify user info
        (uint256 shareBalance, uint256 sharesPurchased, uint256 shareValue) = factory.getUserNFTInfo(tokenId, user1);
        assertEq(shareBalance, sharesToBuy);
        assertEq(sharesPurchased, sharesToBuy);
        assertEq(shareValue, sharesToBuy * SHARE_PRICE);
    }

    function testPurchaseSharesInsufficientETH() public {
        vm.startPrank(owner);
        (uint256 tokenId,) = factory.createFractionalizedNFT(
            TOTAL_SHARES, SHARE_PRICE, "Fractional Art #1", "FART1", "ipfs://QmExample4"
        );
        vm.stopPrank();

        vm.startPrank(user1);
        vm.expectRevert("Incorrect ETH amount");
        factory.purchaseShares{value: 0.0005 ether}(tokenId, 100);
        vm.stopPrank();
    }

    function testSellSharesDirectly() public {
        // Owner creates NFT
        vm.startPrank(owner);
        (uint256 tokenId, address fractionalToken) = factory.createFractionalizedNFT(
            TOTAL_SHARES, SHARE_PRICE, "Fractional Art #1", "FART1", "ipfs://QmExample5"
        );
        vm.stopPrank();

        // User1 purchases shares
        uint256 sharesToBuy = 100;
        uint256 totalCost = sharesToBuy * SHARE_PRICE;

        vm.startPrank(user1);
        factory.purchaseShares{value: totalCost}(tokenId, sharesToBuy);

        // User1 sells shares directly to fractional contract
        FractionalToken fracToken = FractionalToken(fractionalToken);
        uint256 initialBalance = user1.balance;

        fracToken.sellShares(50);
        vm.stopPrank();

        // Verify sale
        assertEq(fracToken.balanceOf(user1), 50);
        assertEq(fracToken.sharesSold(), 50);
        assertEq(user1.balance, initialBalance + (50 * SHARE_PRICE));
    }

    function testMultipleNFTs() public {
        vm.startPrank(owner);

        // Create first NFT
        (uint256 tokenId1,) = factory.createFractionalizedNFT(
            TOTAL_SHARES, SHARE_PRICE, "Fractional Art #1", "FART1", "ipfs://QmExample6"
        );

        // Create second NFT
        (uint256 tokenId2,) =
            factory.createFractionalizedNFT(500, 0.002 ether, "Fractional Art #2", "FART2", "ipfs://QmExample7");

        vm.stopPrank();

        // Verify both NFTs exist
        assertEq(tokenId1, 1);
        assertEq(tokenId2, 2);
        assertEq(factory.getTotalNFTs(), 2);

        uint256[] memory allNFTs = factory.getAllNFTs();
        assertEq(allNFTs.length, 2);
        assertEq(allNFTs[0], 1);
        assertEq(allNFTs[1], 2);

        // Verify different parameters
        (,, uint256 totalShares1,, uint256 sharePrice1,,) = factory.getNFTInfo(tokenId1);
        (,, uint256 totalShares2,, uint256 sharePrice2,,) = factory.getNFTInfo(tokenId2);

        assertEq(totalShares1, TOTAL_SHARES);
        assertEq(sharePrice1, SHARE_PRICE);
        assertEq(totalShares2, 500);
        assertEq(sharePrice2, 0.002 ether);
    }

    function testUpdateSharePrice() public {
        vm.startPrank(owner);
        (uint256 tokenId,) = factory.createFractionalizedNFT(
            TOTAL_SHARES, SHARE_PRICE, "Fractional Art #1", "FART1", "ipfs://QmExample8"
        );

        // Update share price
        uint256 newPrice = 0.002 ether;
        factory.updateSharePrice(tokenId, newPrice);
        vm.stopPrank();

        // Verify price update
        (,,,, uint256 sharePrice,,) = factory.getNFTInfo(tokenId);
        assertEq(sharePrice, newPrice);
    }

    function testSetTradingEnabled() public {
        vm.startPrank(owner);
        (uint256 tokenId,) = factory.createFractionalizedNFT(
            TOTAL_SHARES, SHARE_PRICE, "Fractional Art #1", "FART1", "ipfs://QmExample9"
        );

        // Disable trading
        factory.setTradingEnabled(tokenId, false);
        vm.stopPrank();

        // Verify trading is disabled
        (,,,,, bool tradingEnabled,) = factory.getNFTInfo(tokenId);
        assertFalse(tradingEnabled);

        // Try to purchase shares (should fail)
        vm.startPrank(user1);
        vm.expectRevert("Trading is disabled");
        factory.purchaseShares{value: SHARE_PRICE}(tokenId, 1);
        vm.stopPrank();
    }

    function testGetNFTInfo() public {
        vm.startPrank(owner);
        (uint256 tokenId, address fractionalToken) = factory.createFractionalizedNFT(
            TOTAL_SHARES, SHARE_PRICE, "Fractional Art #1", "FART1", "ipfs://QmExample10"
        );
        vm.stopPrank();

        (
            address fractionalTokenAddress,
            address nftOwner,
            uint256 totalShares,
            uint256 sharesSold,
            uint256 sharePrice,
            bool tradingEnabled,
            uint256 availableShares
        ) = factory.getNFTInfo(tokenId);

        assertEq(fractionalTokenAddress, fractionalToken);
        assertEq(nftOwner, owner); // NFT is owned by the factory owner (deployer)
        assertEq(totalShares, TOTAL_SHARES);
        assertEq(sharesSold, 0);
        assertEq(sharePrice, SHARE_PRICE);
        assertTrue(tradingEnabled);
        assertEq(availableShares, TOTAL_SHARES);
    }

    function testGetFractionalTokenContract() public {
        vm.startPrank(owner);
        (uint256 tokenId, address fractionalToken) = factory.createFractionalizedNFT(
            TOTAL_SHARES, SHARE_PRICE, "Fractional Art #1", "FART1", "ipfs://QmExample11"
        );
        vm.stopPrank();

        FractionalToken retrievedContract = factory.getFractionalTokenContract(tokenId);
        assertEq(address(retrievedContract), fractionalToken);
    }
}
