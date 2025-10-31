import React from 'react'; // Import React
import { ethers } from 'ethers'; // Using v5 as assumed previously

// Import web3Service statically - Assuming it has a default export
// If it uses named exports: import * as web3Service from './web3Service';
import web3Service from './web3Service';

// --- Configuration ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// --- Hardcoded Club Details (Merge with API data) ---
// (Keep your getClubDetails function as is, or fetch this from API too)
const clubDetailsMap = {
  ferrari: { name: "Ferrari Fan Club", icon: "🐎", description: "Join the legendary Ferrari fan community", benefits: ["Early ticket access", "Exclusive merchandise", "Behind-the-scenes content", "Voting rights"], joinFee: 0.02, color: "#FF2800", contractAddress: "0xabc...YourFerrariNFTAddress"}, // Example address
  mclaren: { name: "McLaren Fan Club", icon: "🍊", description: "The papaya family - join McLaren fans worldwide", benefits: ["McLaren garage tour", "Meet & greet", "Technical insights", "Member events"], joinFee: 0.015, color: "#FF8000", contractAddress: "0x123...YourMcLarenNFTAddress"}, // Example address
  mercedes: { name: "Mercedes Fan Club", icon: "⭐", description: "Join the Silver Arrows elite", benefits: ["Priority grandstands", "Factory tour invites", "Driver Q&A", "Historical archive"], joinFee: 0.025, color: "#00D2BE", contractAddress: "0x789...YourMercedesNFTAddress"}, // Example address
  redbull: { name: "Red Bull Racing Club", icon: "🐂", description: "Energy and excitement", benefits: ["Energy Station access", "Party invites", "Limited merch", "Paddock opportunities"], joinFee: 0.018, color: "#0600EF", contractAddress: "0xdef...YourRedBullNFTAddress"}, // Example address
  alpine: { name: "Alpine Fan Community", icon: "🔵", description: "French excellence", benefits: ["Factory experiences", "French GP privileges", "Technical deep dives", "Heritage content"], joinFee: 0.012, color: "#0090FF", contractAddress: "0x456...YourAlpineNFTAddress"} // Example address
  // Add other teams...
};

const getDefaultClubDetails = (clubId) => ({
    name: `${clubId || 'Unknown'} Fan Club`,
    icon: "🏎️",
    description: "Join this exclusive fan community",
    benefits: ["Exclusive content", "Voting rights", "Special events"],
    joinFee: 0.01,
    color: "#646cff",
    contractAddress: "0x000...UnknownAddress"
});
// --- End Hardcoded Details ---


class FanClubService {
  provider = null; // Ethers provider

  // Initialize ethers provider (call this once when app loads or wallet connects)
  async init() {
    if (window.ethereum) {
      try {
        // Use ethers v5 provider
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        await this.provider.send("eth_requestAccounts", []); // Request connection
        console.log("Web3 provider initialized for FanClubService.");
        return true;
      } catch (error) {
        console.error("Failed to initialize Web3 provider:", error);
        this.provider = null;
        return false;
      }
    }
    console.warn("No Web3 provider (e.g., MetaMask) found.");
    return false;
  }

  // Helper to get the current auth token
  _getToken() {
    // Ideally, get this from useAuth context if possible, otherwise localStorage
    return localStorage.getItem('f1_token');
  }

  /**
   * Fetches the basic list of clubs from the public backend endpoint.
   * Merges with hardcoded details.
   */
  async getClubs() {
    console.log("Fetching clubs from API...");
    try {
      // Assumes backend endpoint '/clubs' returns [{ id: 'ferrari', name: 'Ferrari Fan Club' }, ...]
      const response = await fetch(`${API_BASE_URL}/clubs`);
      if (!response.ok) {
        throw new Error(`Failed to fetch clubs: ${response.statusText}`);
      }
      const backendClubList = await response.json(); // e.g., [{ id: 'ferrari', name: '...'}]

      // Enhance with local details
      const enhancedClubs = backendClubList.map(backendClub => {
         const details = clubDetailsMap[backendClub.id.toLowerCase()] || getDefaultClubDetails(backendClub.id);
         return {
             ...backendClub, // Takes 'id' and 'name' from backend
             ...details,     // Merges icon, desc, benefits, fee, color, contractAddress
             // Ensure 'id' remains consistent from backend
             id: backendClub.id
         };
      });

      console.log("Enhanced clubs:", enhancedClubs);
      return enhancedClubs;

    } catch (error) {
      console.error('Error fetching clubs:', error);
      return []; // Return empty array on failure
    }
  }

  /**
   * Fetches member-exclusive perks for a specific club. Requires authentication.
   * Uses the /api/clubs/:clubId/perks endpoint.
   */
  async getClubPerks(clubId) {
    const token = this._getToken();
    if (!token) {
      throw new Error("Authentication required to fetch perks.");
    }
    if (!clubId) {
        throw new Error("Club ID is required to fetch perks.");
    }
    console.log(`Fetching perks for club: ${clubId}`);

    try {
      const response = await fetch(`${API_BASE_URL}/clubs/${clubId}/perks`, {
        headers: {
          'Authorization': `Bearer ${token}` // Send JWT token
        }
      });

      if (response.status === 401) throw new Error("Authentication failed (Invalid Token).");
      if (response.status === 403) throw new Error('Access denied: Not a club member.'); // Specific error for non-member
      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error || `Failed to fetch club perks (${response.status})`);
      }

      const perksData = await response.json();
      console.log(`Perks for ${clubId}:`, perksData);
      return perksData; // Assuming backend returns { message: '...', perks: [...] }

    } catch (error) {
      console.error(`Error fetching perks for ${clubId}:`, error);
      throw error; // Re-throw for component to handle
    }
  }

  /**
   * Checks if the authenticated user is a member of a specific club.
   * RECOMMENDED: Use a dedicated backend endpoint for this if available.
   * Current implementation tries fetching perks and checks for 403 error.
   */
  async checkClubMembership(clubId) {
     // Check if user is logged in first (token exists)
     const token = this._getToken();
     if (!token) {
         console.log("Cannot check membership, user not logged in.");
         return { isMember: false, reason: 'Not authenticated' };
     }

    console.log(`Checking membership status for club: ${clubId}`);
    try {
      // Attempt to fetch the protected perks data
      await this.getClubPerks(clubId);
      // If the above line doesn't throw an error, the user has access
      console.log(`Membership check for ${clubId}: Access granted.`);
      return { isMember: true };
    } catch (error) {
      // Check if the error is specifically the "Access Denied" error
      if (error.message.includes('Access denied')) {
        console.log(`Membership check for ${clubId}: Access denied (Not a member).`);
        return { isMember: false, reason: 'Not a member' };
      }
      // For other errors (network, server error, invalid token), return false and log
      console.error(`Membership check for ${clubId} failed with error:`, error);
      return { isMember: false, reason: `Verification failed: ${error.message}` };
    }
  }


  /**
   * Fetches details for all clubs the current user is a member of.
   */
  async getUserClubs() {
     const token = this._getToken();
     if (!token) {
        console.log("Cannot get user clubs, user not logged in.");
        return []; // Return empty if not authenticated
     }

    console.log("Fetching user's owned clubs...");
    const allClubs = await this.getClubs(); // Get the full list
    const ownedClubs = [];

    // Check membership for each club in parallel
    const membershipChecks = await Promise.allSettled(
        allClubs.map(club => this.checkClubMembership(club.id))
    );

    for (let i = 0; i < allClubs.length; i++) {
       const checkResult = membershipChecks[i];
       if (checkResult.status === 'fulfilled' && checkResult.value.isMember) {
           console.log(`User owns club: ${allClubs[i].name}`);
           // OPTIONAL: Fetch perks here if needed immediately, but might be slow
           // try {
           //     const perks = await this.getClubPerks(allClubs[i].id);
           //     ownedClubs.push({ ...allClubs[i], isMember: true, perks: perks.perks });
           // } catch (perkError) {
           //     console.error(`Failed to get perks for owned club ${allClubs[i].id}`, perkError);
                 ownedClubs.push({ ...allClubs[i], isMember: true, perks: null }); // Add without perks on error
           // }
            ownedClubs.push({ ...allClubs[i], isMember: true }); // Just add basic info + isMember flag
       }
    }

    console.log("User's owned clubs:", ownedClubs);
    return ownedClubs;
  }

 /**
  * Initiates the process to join a fan club (mint NFT).
  * RECOMMENDED: This should ideally call a dedicated backend API endpoint
  * (e.g., POST /api/clubs/:clubId/join) which handles the secure minting.
  * The current implementation attempts to reuse the frontend secure purchase flow,
  * which is likely incorrect given the contract's onlyOwner mint function.
  */
  async joinClub(clubId) {
    console.warn("Attempting to join club via frontend - Ensure backend API handles minting!");
    // --- This section needs verification based on backend API ---
    try {
        const clubDetails = clubDetailsMap[clubId.toLowerCase()] || getDefaultClubDetails(clubId);
        if (!clubDetails || !clubDetails.contractAddress || clubDetails.contractAddress === '0x000...UnknownAddress') {
            throw new Error(`Invalid configuration for club ${clubId}`);
        }

        await this.init(); // Ensure provider is ready
        if (!this.provider) throw new Error("Web3 provider not available.");

        const signer = await this.provider.getSigner();
        const userAddress = await signer.getAddress();
        const valueToSend = ethers.utils.parseEther((clubDetails.joinFee || 0).toString());

        // ** THIS IS THE LIKELY INCORRECT PART **
        // The frontend likely cannot mint directly due to 'onlyOwner'.
        // It should call a BACKEND API endpoint instead.
        // Example: Call backend API
         const token = this._getToken();
         const response = await fetch(`${API_BASE_URL}/clubs/${clubId}/join`, { // Assuming this endpoint exists
             method: 'POST',
             headers: {
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${token}`
             },
             body: JSON.stringify({ userAddress: userAddress /* Add other needed data */ })
         });
         const result = await response.json();
         if (!response.ok) throw new Error(result.message || 'Failed to join club via backend');
         console.log("Backend join response:", result);
         return { success: true, ...result }; // Return backend result


        // --- Commenting out the direct frontend transaction attempt ---
        /*
        const transactionData = this.generateMintData(clubDetails.contractAddress); // Pass address for context

        const transactionRequest = {
            to: clubDetails.contractAddress,
            data: transactionData,
            value: valueToSend,
            from: userAddress,
            // Gas estimation should happen here or in web3Service
        };

        console.log("Preparing secure transaction for joining club:", transactionRequest);

        // Assuming web3Service.sendSecureTransaction exists for generic secure sending
        const result = await web3Service.sendSecureTransaction(
            transactionRequest,
            (status) => console.log(`Join Club Status: ${status}`) // Status callback
        );

        console.log("Secure join transaction result:", result);
        return result; // { success: true/false, transactionHash?, error? }
        */
        // --- End commented out section ---

    } catch (error) {
        console.error(`Join club (${clubId}) failed:`, error);
        // Provide user-friendly error
        throw new Error(`Failed to join club: ${error.message || 'Unknown error'}`);
    }
  }

  // Generate mint data - simplified as backend should handle this
  // Kept for reference but likely unused if backend handles minting
  generateMintData(contractAddress) {
      // We don't actually know the function name. Backend should handle this.
      console.warn("generateMintData called on frontend - This should likely happen on backend.");
      // Return simple data or placeholder if absolutely needed for simulation structure
      const iface = new ethers.utils.Interface(["function mint() public payable"]); // Guessing 'mint'
      try {
          return iface.encodeFunctionData("mint", []);
      } catch {
          return '0x'; // Fallback
      }
  }

}

// Export a singleton instance
const fanClubServiceInstance = new FanClubService();
export default fanClubServiceInstance;

