import React from 'react'; // As requested
import { ethers } from 'ethers'; // Using v5, as per your package.json

// --- Configuration ---
// Get the API URL from the .env.local file, with a fallback for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Helper to get the auth token from localStorage
const getToken = () => {
  return localStorage.getItem('f1_token');
};

/**
 * Fetches the list of all available grandstands for a specific race.
 * This function calls the GET /api/tickets/races/:raceId/stands endpoint
 * from your pitlane-api/routes/ticketRoutes.js file.
 *
 * @param {string} raceId - Identifier for the race (e.g., 'monaco-2025').
 * @returns {Promise<Array>} - A promise that resolves to an array of stand objects.
 */
export const getGrandstands = async (raceId) => {
  if (!raceId) {
    console.error("getGrandstands: raceId is required.");
    return [];
  }
  console.log(`Service: Fetching grandstands for ${raceId} from ${API_BASE_URL}...`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/races/${raceId}/stands`);
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || `Failed to fetch grandstands: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Service: Received stands data:", data);
    return Array.isArray(data) ? data : [];

  } catch (error) {
    console.error("Error in getGrandstands:", error);
    throw error; // Re-throw for the component (e.g., StadiumView) to catch
  }
};

/**
 * Fetches the availability of all seats for a specific grandstand.
 * This function calls the GET /api/tickets/races/:raceId/stands/:standId/seats endpoint
 * from your pitlane-api/routes/ticketRoutes.js file.
 *
 * @param {string} raceId - Identifier for the race.
 * @param {string} standId - Identifier for the grandstand/section (e.g., 'A', 'G_Main').
 * @returns {Promise<Array>} - A promise that resolves to an array of seat objects.
 */
export const getSeatAvailability = async (raceId, standId) => {
  if (!raceId || !standId) {
    console.error("getSeatAvailability: raceId and standId are required.");
    return [];
  }
  console.log(`Service: Fetching seats for ${raceId}, stand ${standId}...`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/races/${raceId}/stands/${standId}/seats`);
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || `Failed to fetch seats: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Service: Received seats data:", data);
    return Array.isArray(data) ? data : [];

  } catch (error) {
    console.error("Error in getSeatAvailability:", error);
    throw error;
  }
};

/**
 * Initiates the ticket purchase process by calling the secure backend API.
 * This function does NOT call the contract directly. It calls your backend,
 * which then handles the simulation and secure minting.
 *
 * @param {object} purchaseDetails - Information needed for the purchase.
 * @param {string} purchaseDetails.userAddress - The wallet address of the buyer.
 * @param {string} purchaseDetails.raceId - Identifier for the race/event.
 * @param {Array<object>} purchaseDetails.selectedSeats - Array of selected seat objects.
 * @param {string} purchaseDetails.totalPrice - The total price (as a string, e.g., "0.05").
 * @returns {Promise<object>} - A promise that resolves with the backend response.
 * @throws {Error} If the API call fails or the backend returns an error.
 */
export const purchaseTickets = async (purchaseDetails) => {
  const token = getToken();
  if (!token) {
    throw new Error("Authentication required to purchase tickets.");
  }
  
  if (!purchaseDetails || !purchaseDetails.userAddress || !purchaseDetails.selectedSeats || purchaseDetails.selectedSeats.length === 0) {
      throw new Error("Invalid purchase details provided to purchaseTickets.");
  }

  console.log("Service: Initiating ticket purchase via backend:", purchaseDetails);

  // --- THIS IS THE ENDPOINT WE NEED TO CREATE IN THE BACKEND ---
  // It's not in ticketRoutes.js; it should be in web3Routes.js or a new route.
  // Let's assume the endpoint is '/web3/purchase-ticket' for now.
  const purchaseEndpoint = `${API_BASE_URL}/web3/purchase-ticket`;
  
  try {
    const response = await fetch(purchaseEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Send the JWT token for authentication
      },
      body: JSON.stringify(purchaseDetails),
    });

    const result = await response.json(); // Read the response body

    if (!response.ok) {
      // Use the error message from the backend if available
      throw new Error(result.message || `Failed to purchase ticket: ${response.statusText}`);
    }

    console.log("Service: Ticket purchase API successful:", result);
    // Expected response: { success: true, transactionHash: '0x...', ticketIds: [...] }
    return result;

  } catch (error) {
    console.error("Error in purchaseTickets service:", error);
    throw error; // Re-throw for the component (SecureTicketPurchase) to catch
  }
};

