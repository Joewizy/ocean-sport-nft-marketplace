// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {IERC165} from "@openzeppelin/contracts/interfaces/IERC165.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import {ERC2771Context} from "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarketplace is ERC2771Context, ReentrancyGuard, IERC721Receiver {
    uint256 private _listingIds;
    uint256 private _auctionIds;

    struct Listing {
        address nftContract;
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isUSDT; // true for USDT, false for ETH
        bool active;
    }

    struct Auction {
        address nftContract;
        uint256 tokenId;
        address seller;
        uint256 startingPrice;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
        bool isUSDT; // true for USDT, false for ETH
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Auction) public auctions;

    uint256 public marketplaceFee = 250; // 2.5%
    address public immutable feeRecipient;
    address public immutable trustedForwarder;
    IERC20 public immutable usdt;

    event NFTListed(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price,
        bool isUSDT
    );
    event NFTSold(uint256 indexed listingId, address buyer, uint256 price, bool isUSDT);
    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 startingPrice,
        uint256 endTime,
        bool isUSDT
    );
    event BidPlaced(uint256 indexed auctionId, address bidder, uint256 amount);
    event AuctionEnded(uint256 indexed auctionId, address winner, uint256 amount);

    constructor(address _feeRecipient, address _usdt, address _trustedForwarder) ERC2771Context(_trustedForwarder) {
        feeRecipient = _feeRecipient;
        trustedForwarder = _trustedForwarder;
        usdt = IERC20(_usdt);
    }

    // LISTING FUNCTIONS
    function listNFT(address nftContract, uint256 tokenId, uint256 price, bool isUSDT) external nonReentrant {
        require(price > 0, "Price must be > 0");
        require(IERC721(nftContract).ownerOf(tokenId) == _msgSender(), "Not owner");
        require(
            IERC721(nftContract).isApprovedForAll(_msgSender(), address(this))
                || IERC721(nftContract).getApproved(tokenId) == address(this),
            "Not approved"
        );

        IERC721(nftContract).safeTransferFrom(_msgSender(), address(this), tokenId);

        _listingIds++;
        uint256 listingId = _listingIds;

        listings[listingId] = Listing(nftContract, tokenId, _msgSender(), price, isUSDT, true);

        emit NFTListed(listingId, nftContract, tokenId, _msgSender(), price, isUSDT);
    }

    function buyNFT(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Not active");

        listing.active = false;

        // Calculate royalties and fees
        (address royaltyRecipient, uint256 royaltyAmount) =
            _getRoyalty(listing.nftContract, listing.tokenId, listing.price);
        uint256 marketplaceFeeAmount = (listing.price * marketplaceFee) / 10000;
        uint256 sellerAmount = listing.price - marketplaceFeeAmount - royaltyAmount;

        // Transfer NFT
        IERC721(listing.nftContract).safeTransferFrom(address(this), _msgSender(), listing.tokenId);

        if (listing.isUSDT) {
            // USDT payment
            require(msg.value == 0, "Don't send ETH for USDT listing");
            require(usdt.balanceOf(_msgSender()) >= listing.price, "Insufficient USDT balance");
            require(usdt.allowance(_msgSender(), address(this)) >= listing.price, "Insufficient USDT allowance");

            // Transfer USDT from buyer to contract
            require(usdt.transferFrom(_msgSender(), address(this), listing.price), "USDT transfer failed");

            // Distribute USDT payments
            _transferUSDTPayments(listing.seller, sellerAmount, royaltyRecipient, royaltyAmount, marketplaceFeeAmount);
        } else {
            // ETH payment
            require(msg.value >= listing.price, "Insufficient ETH payment");

            // Distribute ETH payments
            _transferETHPayments(listing.seller, sellerAmount, royaltyRecipient, royaltyAmount, marketplaceFeeAmount);

            // Refund excess ETH
            if (msg.value > listing.price) {
                payable(_msgSender()).transfer(msg.value - listing.price);
            }
        }

        emit NFTSold(listingId, _msgSender(), listing.price, listing.isUSDT);
    }

    // AUCTION FUNCTIONS
    function createAuction(address nftContract, uint256 tokenId, uint256 startingPrice, uint256 duration, bool isUSDT)
        external
        nonReentrant
    {
        require(startingPrice > 0, "Starting price must be > 0");
        require(duration > 0, "Duration must be > 0");
        require(IERC721(nftContract).ownerOf(tokenId) == _msgSender(), "Not owner");
        require(
            IERC721(nftContract).isApprovedForAll(_msgSender(), address(this))
                || IERC721(nftContract).getApproved(tokenId) == address(this),
            "Not approved"
        );

        IERC721(nftContract).safeTransferFrom(_msgSender(), address(this), tokenId);

        _auctionIds++;
        uint256 auctionId = _auctionIds;

        uint256 endTime = block.timestamp + duration;
        auctions[auctionId] =
            Auction(nftContract, tokenId, _msgSender(), startingPrice, 0, address(0), endTime, isUSDT, true);

        emit AuctionCreated(auctionId, nftContract, tokenId, startingPrice, endTime, isUSDT);
    }

    function placeBid(uint256 auctionId, uint256 bidAmount) external payable nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.active, "Not active");
        require(block.timestamp < auction.endTime, "Auction ended");

        if (auction.isUSDT) {
            // USDT bidding
            require(msg.value == 0, "Don't send ETH for USDT auction");
            require(bidAmount > auction.highestBid && bidAmount >= auction.startingPrice, "Bid too low");
            require(usdt.balanceOf(_msgSender()) >= bidAmount, "Insufficient USDT balance");
            require(usdt.allowance(_msgSender(), address(this)) >= bidAmount, "Insufficient USDT allowance");

            // Refund previous bidder in USDT
            if (auction.highestBidder != address(0)) {
                require(usdt.transfer(auction.highestBidder, auction.highestBid), "USDT refund failed");
            }

            // Transfer USDT from new bidder to contract
            require(usdt.transferFrom(_msgSender(), address(this), bidAmount), "USDT transfer failed");

            auction.highestBid = bidAmount;
            auction.highestBidder = _msgSender();

            emit BidPlaced(auctionId, _msgSender(), bidAmount);
        } else {
            // ETH bidding
            require(bidAmount == 0, "Use msg.value for ETH bids");
            require(msg.value > auction.highestBid && msg.value >= auction.startingPrice, "Bid too low");

            // Refund previous bidder in ETH
            if (auction.highestBidder != address(0)) {
                payable(auction.highestBidder).transfer(auction.highestBid);
            }

            auction.highestBid = msg.value;
            auction.highestBidder = _msgSender();

            emit BidPlaced(auctionId, _msgSender(), msg.value);
        }
    }

    function endAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.active, "Not active");
        require(block.timestamp >= auction.endTime, "Still ongoing");

        auction.active = false;

        if (auction.highestBidder != address(0)) {
            // Calculate royalties and fees
            (address royaltyRecipient, uint256 royaltyAmount) =
                _getRoyalty(auction.nftContract, auction.tokenId, auction.highestBid);
            uint256 marketplaceFeeAmount = (auction.highestBid * marketplaceFee) / 10000;
            uint256 sellerAmount = auction.highestBid - marketplaceFeeAmount - royaltyAmount;

            // Transfer NFT to winner
            IERC721(auction.nftContract).safeTransferFrom(address(this), auction.highestBidder, auction.tokenId);

            // Transfer payments based on currency type
            if (auction.isUSDT) {
                _transferUSDTPayments(
                    auction.seller, sellerAmount, royaltyRecipient, royaltyAmount, marketplaceFeeAmount
                );
            } else {
                _transferETHPayments(
                    auction.seller, sellerAmount, royaltyRecipient, royaltyAmount, marketplaceFeeAmount
                );
            }

            emit AuctionEnded(auctionId, auction.highestBidder, auction.highestBid);
        } else {
            // No bids, return NFT
            IERC721(auction.nftContract).safeTransferFrom(address(this), auction.seller, auction.tokenId);
            emit AuctionEnded(auctionId, address(0), 0);
        }
    }

    // INTERNAL FUNCTIONS
    function _getRoyalty(address nftContract, uint256 tokenId, uint256 salePrice)
        internal
        view
        returns (address recipient, uint256 amount)
    {
        // Check if contract supports EIP-2981 royalty standard
        if (IERC165(nftContract).supportsInterface(type(IERC2981).interfaceId)) {
            return IERC2981(nftContract).royaltyInfo(tokenId, salePrice);
        }
        return (address(0), 0);
    }

    function _transferETHPayments(
        address seller,
        uint256 sellerAmount,
        address royaltyRecipient,
        uint256 royaltyAmount,
        uint256 marketplaceFeeAmount
    ) internal {
        if (sellerAmount > 0) {
            payable(seller).transfer(sellerAmount);
        }
        if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
            payable(royaltyRecipient).transfer(royaltyAmount);
        }
        if (marketplaceFeeAmount > 0) {
            payable(feeRecipient).transfer(marketplaceFeeAmount);
        }
    }

    function _transferUSDTPayments(
        address seller,
        uint256 sellerAmount,
        address royaltyRecipient,
        uint256 royaltyAmount,
        uint256 marketplaceFeeAmount
    ) internal {
        if (sellerAmount > 0) {
            require(usdt.transfer(seller, sellerAmount), "USDT transfer to seller failed");
        }
        if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
            require(usdt.transfer(royaltyRecipient, royaltyAmount), "USDT transfer to royalty recipient failed");
        }
        if (marketplaceFeeAmount > 0) {
            require(usdt.transfer(feeRecipient, marketplaceFeeAmount), "USDT transfer to fee recipient failed");
        }
    }

    // ADMIN FUNCTIONS
    function setMarketplaceFee(uint256 _fee) external {
        require(_msgSender() == feeRecipient, "Not authorized");
        require(_fee <= 1000, "Fee too high"); // Max 10%
        marketplaceFee = _fee;
    }

    // VIEW FUNCTIONS
    function getListingId() external view returns (uint256) {
        return _listingIds;
    }

    function getAuctionId() external view returns (uint256) {
        return _auctionIds;
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function getListing(uint256 listingId) public view returns (Listing memory) {
        return listings[listingId];
    }

    function getAuction(uint256 auctionId) public view returns (Auction memory) {
        return auctions[auctionId];
    }

   // =================================================================
   // |                      Forwarder-functions                      |
   // =================================================================

    function _msgSender() internal view override(ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view override(ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    function _contextSuffixLength() internal view override(ERC2771Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }
}
