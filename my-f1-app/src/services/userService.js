import React from 'react'; // Added React import

// Replace with your actual backend API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'; // Example

/**
 * Fetches the current user's profile data from the backend.
 * Assumes authentication token is handled (e.g., sent automatically via headers).
 * @returns {Promise<object|null>} The user profile object or null on error.
 */
export const getUserProfile = async () => {
  // Helper to get token - ideally from auth context, fallback localStorage
  const getToken = () => localStorage.getItem('f1_token');
  const token = getToken();

  if (!token) {
      console.warn("getUserProfile: No auth token found.");
      // Decide behavior: return null, throw error, or return mock?
      return null; // Returning null if not authenticated
  }

  try {
    // TODO: Replace '/users/profile' with your actual endpoint if different
    const profileEndpoint = `${API_BASE_URL}/users/profile`;
    console.log(`Fetching user profile from ${profileEndpoint}`);

    const response = await fetch(profileEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header with the JWT token
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            console.error('getUserProfile: Authentication error.');
             // Optionally trigger logout here via auth context
        }
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }
    const data = await response.json();
    console.log("Fetched profile data:", data);
    return data; // Return the actual data from the backend

    // --- Mock Data (Remove when API call is implemented) ---
    /*
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    console.log("Returning mock profile data.");
    return {
      _id: 'mockUserId', // Example ID
      walletAddress: '0x123...abc', // Example address
      username: localStorage.getItem('f1_username') || 'F1Fanatic_Mock', // Use local or default
      email: 'mock@example.com', // Example email
      profile: { // Nested profile object as used in UserProfile.jsx
          favoriteTeam: 'ferrari',
          bio: 'Passionate F1 enthusiast!'
      },
      stats: { // Nested stats object
          memberSince: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // ~1 month ago
      }
      // ownedTickets and clubMemberships likely come from separate endpoints/stats
    };
    */
    // --- End Mock Data ---

  } catch (error) {
    console.error("Error fetching user profile:", error);
    // Depending on how useAuth handles errors, you might re-throw
    // throw error;
    return null; // Return null on error
  }
};

/**
 * Updates the user's profile data on the backend.
 * @param {object} profileData - The updated profile data (e.g., { username, email, profile: { favoriteTeam, bio } }).
 * @returns {Promise<object>} The updated user profile object from the backend.
 * @throws {Error} If the update fails.
 */
export const updateUserProfile = async (profileData) => {
  const getToken = () => localStorage.getItem('f1_token');
  const token = getToken();

  if (!token) {
      throw new Error("Authentication required to update profile.");
  }

  try {
    // TODO: Replace '/users/profile' and 'PUT'/'PATCH' with your actual endpoint/method
    const updateEndpoint = `${API_BASE_URL}/users/profile`;
    console.log(`Updating user profile at ${updateEndpoint} with data:`, profileData);

    const response = await fetch(updateEndpoint, {
      method: 'PUT', // Or 'PATCH'
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData), // Send the whole formData object
    });

     const result = await response.json(); // Read body even on error

    if (!response.ok) {
      throw new Error(result.message || `Failed to update user profile: ${response.statusText}`);
    }

    console.log("Profile update successful:", result);
    return result; // Return the updated profile from the backend

    // --- Mock Update (Remove when API call is implemented) ---
    /*
     await new Promise(resolve => setTimeout(resolve, 300));
     console.log("Profile update simulated successfully.");
     // Return the data sent back, simulating backend echoing the update
     return {
        ...profileData,
        // Potentially include other fields returned by the backend like updatedAt
     };
    */
    // --- End Mock Update ---

  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error; // Re-throw for the component to catch and display feedback
  }
};


// --- Functions needed by UserProfile.jsx ---

/**
 * Fetches user statistics (ticket count, club count, spending) from the backend.
 * @returns {Promise<object|null>} The user stats object or null on error.
 */
export const getUserStats = async () => {
    const getToken = () => localStorage.getItem('f1_token');
    const token = getToken();
    if (!token) return null;

    try {
        // TODO: Replace '/users/stats' with your actual endpoint
        const response = await fetch(`${API_BASE_URL}/users/stats`, {
             headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch user stats');
        const data = await response.json();
        console.log("Fetched user stats:", data);
        return data;

        // --- Mock Data ---
        // await new Promise(resolve => setTimeout(resolve, 400));
        // return {
        //     tickets: { total: 5 },
        //     clubs: { total: 2 },
        //     spending: { total: 0.123 } // Example ETH spent
        // };
        // --- End Mock ---

    } catch (error) {
        console.error("Error fetching user stats:", error);
        return null;
    }
};

/**
 * Fetches the user's purchased tickets from the backend.
 * @returns {Promise<Array|null>} An array of ticket objects or null on error.
 */
export const getUserTickets = async () => {
    const getToken = () => localStorage.getItem('f1_token');
    const token = getToken();
    if (!token) return null;

     try {
        // TODO: Replace '/users/tickets' with your actual endpoint
        const response = await fetch(`${API_BASE_URL}/users/tickets`, {
             headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch user tickets');
        const data = await response.json();
         console.log("Fetched user tickets:", data);
        return Array.isArray(data) ? data : []; // Ensure it returns an array

        // --- Mock Data ---
        // await new Promise(resolve => setTimeout(resolve, 600));
        // return [
        //     { _id: 'tkt1', event: { name: 'Monaco Grand Prix 2025', circuit: 'Monaco', date: new Date(Date.now() + 10*24*60*60*1000) }, seat: { section: 'A', row: 5, number: 12 } },
        //     { _id: 'tkt2', event: { name: 'British Grand Prix 2025', circuit: 'Silverstone', date: new Date(Date.now() + 30*24*60*60*1000) }, seat: { section: 'H', row: 10, number: 3 } },
        // ];
        // --- End Mock ---

    } catch (error) {
        console.error("Error fetching user tickets:", error);
        return null; // Return null or empty array on error
    }
};


// --- Function needed by Chat.jsx ---

/**
 * Sets/Updates the user's chat username on the backend.
 * @param {string} username - The desired username.
 * @returns {Promise<object>} Backend confirmation response.
 * @throws {Error} If the update fails.
 */
export const setUsername = async (username) => {
    const getToken = () => localStorage.getItem('f1_token');
    const token = getToken();
    if (!token) throw new Error("Authentication required to set username.");
    if (!username || typeof username !== 'string' || username.trim().length < 2 || username.trim().length > 20) {
        throw new Error("Invalid username provided.");
    }

    try {
        // TODO: Replace '/users/username' with your actual endpoint
        const response = await fetch(`${API_BASE_URL}/users/username`, {
            method: 'POST', // Or PUT/PATCH
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username: username.trim() })
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || `Failed to set username: ${response.statusText}`);
        }
        console.log("Set username response:", result);
        return result; // e.g., { success: true, user: updatedUserObject }

        // --- Mock Success ---
        // await new Promise(resolve => setTimeout(resolve, 200));
        // console.log("Simulated setting username:", username.trim());
        // return { success: true, message: "Username updated successfully." };
        // --- End Mock ---

    } catch (error) {
        console.error("Error setting username:", error);
        throw error; // Re-throw for component
    }
};

// Add other user-related service functions if needed
// e.g., deleteAccount, changePassword (if applicable)

