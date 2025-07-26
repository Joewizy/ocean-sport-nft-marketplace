// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721Burnable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {ERC2771Context} from "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

contract OceanSport is ERC2771Context, ERC721, ERC721URIStorage, ERC721Enumerable, ERC721Burnable, ERC2981 {
    uint256 private _nextTokenId;
    address public immutable trustedForwarder;

    constructor(address royaltyReceiver, uint96 royaltyFeeNumerator, address _trustedForwarder)
        ERC2771Context(_trustedForwarder)
        ERC721("Ocean Sport", "OSNFT")
    {
        trustedForwarder = _trustedForwarder;
        _setDefaultRoyalty(royaltyReceiver, royaltyFeeNumerator); // e.g. 500 = 5%
    }

    function safeMint(address to, string memory uri) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }

    // Required override for Solidity due to multiple inheritance
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    // Required override for _burn function due to multiple inheritance
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    // Required override
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
     internal override(ERC721, ERC721Enumerable) {
    super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    // Fix: Need to specify both Context and ERC2771Context in override
    function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    // Fix: Need to specify both Context and ERC2771Context in override
    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    // Fix: Need to specify both Context and ERC2771Context in override
    function _contextSuffixLength() internal view override(Context, ERC2771Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }
}