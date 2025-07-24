// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {USDT} from "./mocks/USDT.sol";
import {Nft} from "../src/Nft.sol";
import {NFTMarketplace} from "../src/NFTMarketplace.sol";

contract NFTMarketplaceTest is Test {
    USDT public usdt;
    Nft public nft;
    NFTMarketplace public nftMarketplace;

    address owner = address(this);
    address buyer = makeAddr("buyer");
    address seller = makeAddr("seller");
    address feeRecipient = makeAddr("feeReceiver");

    uint256 private constant STARTING_MINT = 100e18;
    uint private constant INITIAL_SUPPLY = 100_000e18;

    function setUp() external {
        usdt = new USDT(INITIAL_SUPPLY);
        nft = new Nft();

        nftMarketplace = new NFTMarketplace(feeRecipient, address(usdt));

        // mint buyer and seller usdt, eth and nfts
        vm.deal(buyer, STARTING_MINT);
        vm.deal(seller, STARTING_MINT);

        usdt.mint(buyer, STARTING_MINT);
        usdt.mint(seller, STARTING_MINT);
        nft.mintNFT(buyer);
        nft.mintNFT(seller);
    }  

    function testInitialization() public {
        assertEq(nftMarketplace.feeRecipient(), feeRecipient);
    }

    function testListNft() public {
        vm.startPrank(seller);
        uint256 price = 1 ether;
        bool isUSDT = false;

        // Approve marketplace to transfer NFT
        nft.setApprovalForAll(address(nftMarketplace), true);
        nftMarketplace.listNFT(address(nft), 2, price, isUSDT);

        uint256 listingId = nftMarketplace.getListingId();

        // Fetch the listing
        NFTMarketplace.Listing memory listing = nftMarketplace.getListing(listingId);

        // Assertions to confirm correctness
        assertEq(listing.nftContract, address(nft));
        assertEq(listing.tokenId, 2);
        assertEq(listing.seller, seller);
        assertEq(listing.price, price);
        assertEq(listing.isUSDT, isUSDT);
        assertTrue(listing.active);
    }

}
