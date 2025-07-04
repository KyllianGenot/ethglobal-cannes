// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/NFTFractionalizationFactory.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the NFT Fractionalization Factory
        string memory nftName = "Fractional Art Collection";
        string memory nftSymbol = "FRAC";
        
        NFTFractionalizationFactory factory = new NFTFractionalizationFactory(
            nftName,
            nftSymbol
        );

        console.log("NFTFractionalizationFactory deployed at:", address(factory));
        console.log("NFT contract deployed at:", address(factory.nftContract()));
        console.log("Factory ready! You can now create NFTs using createFractionalizedNFT()");

        vm.stopBroadcast();
    }
}