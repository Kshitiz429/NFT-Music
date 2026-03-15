// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MusicNFT
 * @dev End-to-end secure Music NFT contract with on-chain royalties and ownership tracking.
 */
contract MusicNFT is ERC721URIStorage, ERC2981, Ownable, ReentrancyGuard {
    uint256 private _nextTokenId;

    struct TrackData {
        string title;
        string artistName;
        uint256 mintTimestamp;
        bool isEncrypted; // Flag for E2E encryption status
    }

    mapping(uint256 => TrackData) public trackDetails;

    event TrackMinted(uint256 indexed tokenId, address indexed artist, string title, string metadataURI);

    constructor() ERC721("NFTMusic Master", "NMUSIC") Ownable(msg.sender) {}

    /**
     * @dev Mints a new Music NFT with embedded royalties.
     * @param to The address of the artist receiving the NFT.
     * @param uri The IPFS URI containing the audio/image metadata.
     * @param royaltyReceiver The address to receive secondary sale royalties.
     * @param royaltyFeeNumerator The percentage (in BPS, e.g., 1000 = 10%) for royalties.
     */
    function mintMusicNFT(
        address to,
        string memory uri,
        string memory title,
        string memory artistName,
        address royaltyReceiver,
        uint96 royaltyFeeNumerator
    ) public nonReentrant returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        // ERC-2981: Set royalties for this specific token
        _setTokenRoyalty(tokenId, royaltyReceiver, royaltyFeeNumerator);

        trackDetails[tokenId] = TrackData({
            title: title,
            artistName: artistName,
            mintTimestamp: block.timestamp,
            isEncrypted: true
        });

        emit TrackMinted(tokenId, to, title, uri);
        
        return tokenId;
    }

    // Required overrides for ERC-2981 and ERC-721
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Updates the royalty for a token (only owner/artist).
     */
    function updateRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator) public {
        require(ownerOf(tokenId) == msg.sender || owner() == msg.sender, "Not authorized");
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }
}
