// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import {IERC165} from "@openzeppelin/contracts/interfaces/IERC165.sol";

contract Nft is ERC721, IERC2981 {
    uint256 private _tokenIdCounter;
    address public royaltyReceiver;
    uint96 private constant ROYALTY_BPS = 1000; // 10% = 1000 basis points

    constructor(address _royaltyReceiver) ERC721("Cole Palmer", "CLP") {
        _tokenIdCounter = 1;
        royaltyReceiver = _royaltyReceiver;
    }

    function mintNFT(address to) external returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _mint(to, tokenId);
        return tokenId;
    }

    function burnNFT(uint256 tokenId) external {
        _burn(tokenId);
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1; // exclude unminted token
    }

    // === Royalties ===
    function royaltyInfo(uint256 tokenId, uint256 salePrice) external view override returns (address, uint256) {
        uint256 royaltyAmount = (salePrice * ROYALTY_BPS) / 10000;
        return (royaltyReceiver, royaltyAmount);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, IERC165) returns (bool) {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }
}
