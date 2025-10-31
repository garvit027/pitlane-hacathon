// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol"; // Use URIStorage for flexibility

// Changed inheritance to ERC721URIStorage for easier URI management
contract F1Ticket is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // --- Events ---
    event TicketMinted(uint256 indexed tokenId, address indexed owner, string tokenURI);

    constructor() ERC721("Formula 1 Ticket", "F1T") {}

    // --- URI Management ---
    // The _setTokenURI function is provided by ERC721URIStorage
    // The tokenURI function is provided by ERC721URIStorage

    /**
     * @dev Mints a new ticket NFT. Can only be called by the contract owner (backend).
     * @param to The address to mint the ticket to.
     * @param uri The metadata URI (e.g., pointing to IPFS or an API) for this ticket.
     * @return tokenId The ID of the newly minted token.
     */
    function mintTicket(address to, string memory uri) public onlyOwner returns (uint256) {
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _safeMint(to, tokenId); // Mint the NFT
        _setTokenURI(tokenId, uri); // Set its metadata URI

        emit TicketMinted(tokenId, to, uri);
        return tokenId;
    }

    // --- OpenZeppelin Overrides ---
    // The following functions are overrides required by Solidity >=0.8.0 possibly combined with inheritance.
    // Usually needed if inheriting from multiple contracts modifying the same base functions.
    // Add if compiler complains, otherwise they might not be needed depending on exact OZ version.

    /*
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    */

    // --- Optional: Batch Minting ---
    /**
     * @dev Mints multiple tickets in a single transaction. Can only be called by the owner.
     * Useful for pre-minting before a sale.
     * @param tos Array of addresses to mint tickets to.
     * @param uris Array of metadata URIs corresponding to each recipient.
     */
    function batchMintTickets(address[] memory tos, string[] memory uris) public onlyOwner {
        require(tos.length == uris.length, "F1Ticket: Mismatched input array lengths");
        for (uint i = 0; i < tos.length; i++) {
            mintTicket(tos[i], uris[i]);
        }
    }
}
