// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol"; // For tracking listed tokens

contract TicketMarketplace is Ownable, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.UintSet;

    IERC721 private immutable _ticketContract; // Make immutable if set only once

    struct Listing {
        address seller;
        uint256 price; // Store price in Wei
    }

    // Mapping from Token ID -> Listing details
    mapping(uint256 => Listing) private _listings;

    // Keep track of all listed token IDs for easier querying
    EnumerableSet.UintSet private _listedTokenIds;

    // --- Events ---
    event TicketListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event TicketUnlisted(uint256 indexed tokenId, address indexed seller);
    event TicketSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);

    constructor(address ticketContractAddress) {
        require(ticketContractAddress != address(0), "Marketplace: Invalid ticket contract address");
        _ticketContract = IERC721(ticketContractAddress);
    }

    /**
     * @dev Lists an F1Ticket NFT for sale on the marketplace.
     * Requirements:
     * - Caller must be the owner of the tokenId.
     * - Marketplace contract must be approved to transfer the tokenId.
     * - Price must be greater than 0.
     * - Token must not already be listed.
     */
    function listTicket(uint256 tokenId, uint256 price) public nonReentrant { // Added nonReentrant for safety
        require(price > 0, "Marketplace: Price must be > 0");
        require(_ticketContract.ownerOf(tokenId) == msg.sender, "Marketplace: Not token owner");
        require(_ticketContract.getApproved(tokenId) == address(this) || _ticketContract.isApprovedForAll(msg.sender, address(this)), "Marketplace: Not approved");
        require(_listings[tokenId].price == 0, "Marketplace: Token already listed"); // Check if already listed

        _listings[tokenId] = Listing(msg.sender, price);
        _listedTokenIds.add(tokenId); // Add to tracking set

        emit TicketListed(tokenId, msg.sender, price);
    }

    /**
     * @dev Allows the seller to remove their listing.
     */
    function unlistTicket(uint256 tokenId) public nonReentrant {
        Listing storage listing = _listings[tokenId]; // Use storage pointer
        require(listing.seller == msg.sender, "Marketplace: Not seller");
        require(listing.price > 0, "Marketplace: Not listed"); // Ensure it is listed

        delete _listings[tokenId]; // Remove listing
        _listedTokenIds.remove(tokenId); // Remove from tracking set

        emit TicketUnlisted(tokenId, msg.sender);
    }

    /**
     * @dev Allows a user to buy a listed ticket.
     * Sends the required Ether amount (price). Ether is transferred to the seller.
     * Transfers the NFT from the seller to the buyer via the marketplace approval.
     */
    function buyTicket(uint256 tokenId) public payable nonReentrant {
        Listing memory listing = _listings[tokenId]; // Load listing details into memory
        address seller = listing.seller;

        // --- Checks-Effects-Interactions Pattern ---
        // 1. CHECKS: Validate conditions first.
        require(listing.price > 0, "Marketplace: Ticket not listed for sale");
        require(msg.value == listing.price, "Marketplace: Incorrect Ether value sent");
        require(seller != address(0), "Marketplace: Invalid seller address"); // Safety check
        // Check if marketplace still has approval (in case seller revoked it)
        require(_ticketContract.getApproved(tokenId) == address(this) || _ticketContract.isApprovedForAll(seller, address(this)), "Marketplace: Approval revoked");

        // 2. EFFECTS: Update the contract state.
        delete _listings[tokenId]; // Remove the listing
        _listedTokenIds.remove(tokenId); // Remove from tracking set

        // 3. INTERACTIONS: Perform external calls last.
        // Transfer the NFT. This will revert if marketplace isn't approved.
        _ticketContract.transferFrom(seller, msg.sender, tokenId);

        // Transfer payment to the seller. Use call for safety.
        (bool success, ) = seller.call{value: msg.value}("");
        require(success, "Marketplace: Ether transfer failed");

        emit TicketSold(tokenId, seller, msg.sender, listing.price);
    }

    // --- View Functions ---

    /**
     * @dev Get the details of a specific listing.
     * @return seller The address of the seller.
     * @return price The price in Wei.
     */
    function getListing(uint256 tokenId) public view returns (address seller, uint256 price) {
        Listing memory listing = _listings[tokenId];
        return (listing.seller, listing.price);
    }

    /**
     * @dev Get the total number of tickets currently listed.
     */
    function listedTokenCount() public view returns (uint256) {
        return _listedTokenIds.length();
    }

    /**
     * @dev Get a listed token ID by its index in the tracking set.
     */
    function listedTokenAtIndex(uint256 index) public view returns (uint256) {
        return _listedTokenIds.at(index);
    }

    /**
    * @dev Get the address of the underlying F1Ticket NFT contract.
    */
    function getTicketContractAddress() public view returns (address) {
        return address(_ticketContract);
    }
}
