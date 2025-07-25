// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Nft} from "../src/Nft.sol";
import {USDT} from "../test/mocks/USDT.sol";
import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {NFTMarketplace} from "../src/NFTMarketplace.sol";
import {OceanSport} from "../src/OceanSport.sol";
import {MinimalForwarder} from "@openzeppelin/contracts/metatx/MinimalForwarder.sol";

contract DeployContract is Script {
    Nft public nftColePalmer;
    USDT public usdt;
    OceanSport public oceanSport;
    NFTMarketplace public nftMarketplace;
    MinimalForwarder public minimalForwarder;

    function run() external {
        vm.startBroadcast();
        address royaltyReceiver = 0xa2791e44234Dc9C96F260aD15fdD09Fe9B597FE1;
        uint96 royaltyFee = 500; // 5% fee base on basis point of 10000
        uint256 FIRST_MINT = 100_000e18; // 100K token minted to deployer

        minimalForwarder = new MinimalForwarder();
        address forwarder = address(minimalForwarder);
        
        nftColePalmer = new Nft(royaltyReceiver);
        usdt = new USDT(FIRST_MINT);
        oceanSport = new OceanSport(royaltyReceiver, royaltyFee, forwarder);
        nftMarketplace = new NFTMarketplace(royaltyReceiver, address(usdt), forwarder);

        console.log("MinimalForwarder deployed at:", address(minimalForwarder));
        console.log("Nft deployed at:", address(nftColePalmer));
        console.log("USDT deployed at:", address(usdt));
        console.log("OceanSport deployed at:", address(oceanSport));
        console.log("Marketplace deployed at:", address(nftMarketplace));

        // Create minimal JSON deployment file
        string memory deploymentJson = string.concat(
            '{\n',
            '  "network": "', getNetworkName(block.chainid), '",\n',
            '  "deployer": "', vm.toString(msg.sender), '",\n',
            '  "MinimalForwarder": "', vm.toString(address(minimalForwarder)), '",\n',
            '  "Nft": "', vm.toString(address(nftColePalmer)), '",\n',
            '  "USDT": "', vm.toString(address(usdt)), '",\n',
            '  "OceanSport": "', vm.toString(address(oceanSport)), '",\n',
            '  "NFTMarketplace": "', vm.toString(address(nftMarketplace)), '"\n',
            '}'
        );

        // Save to deployments folder
        string memory deploymentPath = string.concat(
            vm.projectRoot(), 
            "/deployments/", 
            vm.toString(block.chainid), 
            ".json"
        );
        
        vm.writeFile(deploymentPath, deploymentJson);
        
        console.log("Deployment saved to:", deploymentPath);
        vm.stopBroadcast();
    }

    function getNetworkName(uint256 chainId) internal pure returns (string memory) {
        if (chainId == 1) return "mainnet";
        if (chainId == 84532) return "base-sepolia";
        if (chainId == 11155111) return "sepolia";
        if (chainId == 5) return "goerli";
        if (chainId == 137) return "polygon";
        if (chainId == 80001) return "mumbai";
        if (chainId == 56) return "bsc";
        if (chainId == 97) return "bsc-testnet";
        if (chainId == 43114) return "avalanche";
        if (chainId == 43113) return "fuji";
        if (chainId == 31337) return "localhost";
        if (chainId == 133718) return "laza-testnet";
        if (chainId == 50312) return "somnia-testnet";
        return "unknown";
    }
}