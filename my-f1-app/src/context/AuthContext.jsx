import React, { createContext, useContext } from 'react';
// Corrected Import: Import the actual implementation function
import { useAuthImplementation as useAuthHook } from '../hooks/useAuth';

// 1. Create the context object
const AuthContext = createContext(null);

// 2. Create the Provider component
export function AuthProvider({ children }) {
  // Use the hook containing the logic within the provider
  // useAuthHook now correctly refers to useAuthImplementation
  const auth = useAuthHook();

  // Provide the hook's return value (state + functions) to children
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Create a custom hook to consume the context easily
// This hook IS correctly named 'useAuth' and is what components should import
export function useAuth() {
  const context = useContext(AuthContext);
  // Ensure the hook is used within the Provider
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

