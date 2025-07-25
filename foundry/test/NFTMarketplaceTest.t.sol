// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
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
    address whale = makeAddr("whale");
    address royaltyReceiver = makeAddr("royaltyReceiver");
    address feeRecipient = makeAddr("feeReceiver");
    address forwarder = makeAddr("forwarder");

    uint256 private constant STARTING_MINT = 100e18;
    uint256 private constant INITIAL_SUPPLY = 100_000e18;

    function setUp() external {
        usdt = new USDT(INITIAL_SUPPLY);
        nft = new Nft(royaltyReceiver);

        nftMarketplace = new NFTMarketplace(feeRecipient, address(usdt), forwarder);

        // mint buyer and seller usdt, eth and nfts
        vm.deal(buyer, STARTING_MINT);
        vm.deal(seller, STARTING_MINT);
        vm.deal(whale, STARTING_MINT);

        usdt.mint(buyer, STARTING_MINT);
        usdt.mint(seller, STARTING_MINT);
        usdt.mint(whale, STARTING_MINT);
        nft.mintNFT(buyer);
        nft.mintNFT(seller);
        nft.mintNFT(whale);

        // Approve marketplace to transfer NFT and USDT tokens
        vm.startPrank(buyer);
        nft.setApprovalForAll(address(nftMarketplace), true);
        usdt.approve(address(nftMarketplace), STARTING_MINT);
        vm.stopPrank();

        vm.startPrank(seller);
        nft.setApprovalForAll(address(nftMarketplace), true);
        usdt.approve(address(nftMarketplace), STARTING_MINT);
        vm.stopPrank();

        vm.startPrank(whale);
        nft.setApprovalForAll(address(nftMarketplace), true);
        usdt.approve(address(nftMarketplace), STARTING_MINT);
        vm.stopPrank();
    }

    function testInitialization() public {
        assertEq(nftMarketplace.feeRecipient(), feeRecipient);
    }

    function testListNft() public {
        vm.startPrank(seller);
        uint256 price = 1 ether;
        bool isUSDT = false;

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

    function testBuyNft() public {
        vm.startPrank(seller);
        uint256 price = 1 ether;
        bool isUSDT = false;

        nftMarketplace.listNFT(address(nft), 2, price, isUSDT);

        vm.startPrank(buyer);
        nftMarketplace.buyNFT{value: price}(1);

        NFTMarketplace.Listing memory listing = nftMarketplace.getListing(1);
        assertEq(nft.ownerOf(2), buyer);
        assertEq(listing.nftContract, address(nft));
        assertEq(listing.tokenId, 2);
        assertEq(listing.seller, seller);
        assertEq(listing.price, price);
        assertEq(listing.isUSDT, isUSDT);
        assertFalse(listing.active);
    }

    function testBuyNftWithUsdt() public {
        vm.startPrank(seller);
        uint256 price = 1 ether;
        bool isUSDT = true;

        nftMarketplace.listNFT(address(nft), 2, price, isUSDT);

        vm.startPrank(buyer);
        nftMarketplace.buyNFT(1);

        NFTMarketplace.Listing memory listing = nftMarketplace.getListing(1);
        assertEq(nft.ownerOf(2), buyer);
        assertEq(listing.nftContract, address(nft));
        assertEq(listing.tokenId, 2);
        assertEq(listing.seller, seller);
        assertEq(listing.price, price);
        assertEq(listing.isUSDT, isUSDT);
        assertFalse(listing.active);
    }

    function testCreateAuction() public {
        vm.startPrank(seller);
        uint256 startingPrice = 1 ether;
        bool isUSDT = true;
        uint256 tokenId = 2;

        nftMarketplace.createAuction(address(nft), tokenId, startingPrice, 1 days, isUSDT);

        // Fetch the auctions
        NFTMarketplace.Auction memory auction = nftMarketplace.getAuction(1);

        assertEq(auction.endTime - block.timestamp, 1 days);
        assertEq(auction.isUSDT, true);
        assertEq(auction.startingPrice, startingPrice);
        assertEq(auction.tokenId, tokenId);
        assertEq(auction.active, true);
    }

    function testPlaceBid() public {
        vm.startPrank(seller);
        uint256 startingPrice = 1 ether;
        bool isUSDT = true;
        uint256 tokenId = 2;
        uint256 bidAmount = 1.5 ether;

        nftMarketplace.createAuction(address(nft), tokenId, startingPrice, 1 days, isUSDT);

        vm.startPrank(buyer);
        nftMarketplace.placeBid(1, bidAmount);

        NFTMarketplace.Auction memory auction = nftMarketplace.getAuction(1);

        assertEq(auction.highestBid, bidAmount);
        assertEq(auction.highestBidder, buyer);

        vm.startPrank(whale);
        nftMarketplace.placeBid(1, bidAmount + 50 ether);

        NFTMarketplace.Auction memory auction2 = nftMarketplace.getAuction(1);

        assertEq(auction2.highestBid, bidAmount + 50 ether);
        assertEq(auction2.highestBidder, whale);

        vm.warp(2 days);
        console.log("Auction active:", auction.active);
        console.log("Block timestamp:", block.timestamp);
        console.log("Auction end time:", auction.endTime);
        console.log("NFT owner:", nft.ownerOf(tokenId));

        nftMarketplace.endAuction(1);
        NFTMarketplace.Auction memory auction3 = nftMarketplace.getAuction(1);
        // confirm whale owns the NFT now
        assertEq(nft.ownerOf(tokenId), whale);
        assertEq(auction3.active, false);
    }

    function testCancelAuction() public {}
}
