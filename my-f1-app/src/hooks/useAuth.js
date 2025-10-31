import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers'; // Using v5, as per your package.json
import * as userService from '../services/userService'; // Import user service for profile fetch

// --- This function contains the core authentication logic ---
// It is imported by AuthContext.jsx
export function useAuthImplementation() {
  const [user, setUser] = useState(null); // Shape: { walletAddress: string, username: string | null }
  const [token, setToken] = useState(() => localStorage.getItem('f1_token')); // Initialize from localStorage
  const [loading, setLoading] = useState(true); // Start loading until token checked
  const [error, setError] = useState(null); // Add error state

  // --- Effect to Validate Token on Load ---
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      const storedToken = localStorage.getItem('f1_token');
      setToken(storedToken);

      if (storedToken) {
        try {
          // Decode token payload (no verification needed here, just check expiry)
          const payloadBase64 = storedToken.split('.')[1];
          if (!payloadBase64) throw new Error("Invalid token format");

          const payload = JSON.parse(atob(payloadBase64));
          const currentTime = Date.now() / 1000; // Current time in seconds

          if (payload.exp && payload.exp > currentTime) {
            // Token is valid and not expired
            console.log("Auth Hook: Token valid, setting user:", payload.address);
            setUser({
              walletAddress: payload.address,
              // Get username associated with this session
              username: localStorage.getItem('f1_username') || null
            });
          } else {
            // Token expired
            console.log("Auth Hook: Token expired, logging out.");
            logout(); // Call logout to clear state and localStorage
          }
        } catch (error) {
          console.error('Auth Hook: Token validation failed:', error);
          logout(); // Clear invalid/malformed token
        }
      } else {
         // No token found
         console.log("Auth Hook: No token found.");
         setUser(null); // Ensure user is null if no token
      }
      setLoading(false); // Finished checking token
    };

    initializeAuth();
  }, []); // Run only once on mount

  // --- Login Function (Sign-in-with-Ethereum Flow) ---
  const login = async () => {
    // 1. Check if MetaMask (window.ethereum) is available
    if (!window.ethereum) {
      console.error("MetaMask or compatible wallet not found.");
      alert("Please install MetaMask or a compatible wallet to connect.");
      return { success: false, message: "Wallet provider not found." };
    }

    setLoading(true);
    setError(null); // Clear previous errors
    let provider;

    try {
      // 2. Connect to Wallet & Get Address/Signer (using ethers v5)
      provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      await provider.send("eth_requestAccounts", []); // Request account access
      const signer = provider.getSigner(); // This is synchronous in v5
      const walletAddress = await signer.getAddress();
      const lowerCaseAddress = walletAddress.toLowerCase();
      console.log("Auth Hook: Wallet connected:", lowerCaseAddress);

      // 3. Request message to sign from backend
      // VITE_API_BASE_URL must be in your frontend .env.local file
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      console.log("Auth Hook: Requesting sign message from:", `${apiUrl}/auth/request-message`);
      
      const messageResponse = await fetch(`${apiUrl}/auth/request-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: lowerCaseAddress }), // Send lowercase address
      });

      if (!messageResponse.ok) {
         const errorData = await messageResponse.json();
         throw new Error(errorData.error || 'Failed to request message.');
      }
      const { messageToSign } = await messageResponse.json();
      if (!messageToSign) throw new Error("Backend did not provide a message to sign.");

      // 4. Prompt user to sign the message
      console.log("Auth Hook: Requesting signature for message:", messageToSign);
      const signature = await signer.signMessage(messageToSign);
      console.log("Auth Hook: Signature obtained.");

      // 5. Verify signature with backend and get JWT token
      console.log("Auth Hook: Verifying signature with backend...");
      const verifyResponse = await fetch(`${apiUrl}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: lowerCaseAddress, // Send lowercase address
          signature: signature
        }),
      });

       if (!verifyResponse.ok) {
         const errorData = await verifyResponse.json();
         throw new Error(errorData.error || 'Signature verification failed.');
      }
      const { token: jwtToken, message: successMessage } = await verifyResponse.json();

      // 6. Store token and update user state on success
      if (jwtToken) {
        console.log("Auth Hook: Login successful!", successMessage);
        localStorage.setItem('f1_token', jwtToken);
        setToken(jwtToken); // Update token state

        // Fetch username immediately after successful login
        // We pass the token in case the service needs it
        const profile = await userService.getUserProfile(jwtToken); 
        const username = profile?.username || localStorage.getItem('f1_username'); // Check DB, fallback local
        if (profile?.username) localStorage.setItem('f1_username', profile.username); // Sync local
        
        setUser({ walletAddress: lowerCaseAddress, username: username || null });
        
        setLoading(false);
        return { success: true, message: successMessage };
      } else {
          throw new Error("Backend did not return a token.");
      }

    } catch (error) {
      console.error('Auth Hook: Login failed:', error);
      setError(error.message || "Login failed."); // Set error state
      logout(); // Ensure clean state on failure
      setLoading(false);
      return { success: false, message: error.message || "Login failed." };
    }
  };

  // --- Logout Function ---
  const logout = () => {
    console.log("Auth Hook: Logging out.");
    localStorage.removeItem('f1_token');
    localStorage.removeItem('f1_username'); // Clear username on logout
    setToken(null);
    setUser(null);
  };

  // --- Update Username Function ---
  const updateUsername = (newUsername) => {
    // Update username in localStorage and state
    if (newUsername && typeof newUsername === 'string') {
        const trimmedUsername = newUsername.trim();
        console.log("Auth Hook: Updating username:", trimmedUsername);
        localStorage.setItem('f1_username', trimmedUsername);
        setUser(prevUser => prevUser ? { ...prevUser, username: trimmedUsername } : null);
    } else {
        console.warn("Auth Hook: Attempted to update username with invalid value:", newUsername);
    }
  };

  // Return the authentication state and methods
  return {
    user,
    token,
    login, // This is the real login function
    logout,
    loading,
    updateUsername,
    isAuthenticated: !!user, // Convenience boolean derived from user state
    error // Expose error state
  };
}

// --- THIS IS THE FIX ---
// The duplicate import `import * as userService from ...` that was here is now REMOVED.
// --- END FIX ---

