// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Nft is ERC721 {
    uint256 private _tokenIdCounter;

    constructor() ERC721("Cole Palmer", "CLP") {
        _tokenIdCounter = 1; 
    }

    // External functions
    function mintNFT(address to) external returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _mint(to, tokenId);
        return tokenId;
    }

    function burnNFT(uint256 tokenId) external {
        _burn(tokenId);
    }

    // View functions
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
}
