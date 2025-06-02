// File: context/UserContext.tsx

import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { GoogleSignin } from "@react-native-google-signin/google-signin"; // Import GoogleSignin

interface AppUser {
  googleToken: string | null;
  googleEmail: string | null;
}

interface UserContextType {
  user: AppUser;
  setUser: (u: AppUser) => void;
  logout: () => Promise<void>;

  backendJwt: string | null;
  backendJwtExpiry: number;
  getValidJwt: () => Promise<string>;

  loading: boolean;
  error: string | null;
}

const defaultContext: UserContextType = {
  user: { googleToken: null, googleEmail: null },
  setUser: () => {},
  logout: async () => {},
  backendJwt: null,
  backendJwtExpiry: 0,
  async getValidJwt() {
    throw new Error("getValidJwt not initialized");
  },
  loading: false,
  error: null,
};

export const UserContext = createContext<UserContextType>(defaultContext);

const SECURE_KEY_USER = "userSession";
const SECURE_KEY_JWT = "backendJwt";
const SECURE_KEY_JWT_EXPIRY = "backendJwtExpiry";

export function UserProvider({ children }: { children: React.ReactNode }) {
  console.log("UserProvider: Initializing");
  const [user, setUserState] = useState<AppUser>(() => {
    console.log("UserProvider: Initializing user state");
    return { googleToken: null, googleEmail: null };
  });
  const [backendJwt, setBackendJwt] = useState<string | null>(() => {
    console.log("UserProvider: Initializing backendJwt state");
    return null;
  });
  const [backendJwtExpiry, setBackendJwtExpiry] = useState<number>(() => {
    console.log("UserProvider: Initializing backendJwtExpiry state");
    return 0;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    console.log("UserProvider: Initializing loading state to true");
    return true;
  });
  const [error, setError] = useState<string | null>(() => {
    console.log("UserProvider: Initializing error state to null");
    return null;
  });

  // A) On mount, restore stored User + JWT (if still valid)
  // This hook runs only once when the UserProvider component 
  // is first mounted (added to the screen). 
  // This is because its dependency array is empty ([]).
  useEffect(() => {
    console.log("\n\nUserProvider: useEffect A - Mount: Attempting to restore session.");
    (async () => {
      try {
        console.log("UserProvider: useEffect A - Reading userSession from SecureStore.");
        const storedUser = await SecureStore.getItemAsync(SECURE_KEY_USER);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log("UserProvider: useEffect A - Found stored userSession:", parsedUser);
          setUserState(parsedUser);
        } else {
          console.log("UserProvider: useEffect A - No stored userSession found.");
        }

        console.log("UserProvider: useEffect A - Reading backendJwt from SecureStore.");
        const storedJwt = await SecureStore.getItemAsync(SECURE_KEY_JWT);
        console.log("UserProvider: useEffect A - Reading backendJwtExpiry from SecureStore.");
        const storedExpiryStr = await SecureStore.getItemAsync(
          SECURE_KEY_JWT_EXPIRY
        );
        const storedExpiry = storedExpiryStr
          ? parseInt(storedExpiryStr, 10)
          : 0;
        console.log(`UserProvider: useEffect A - Stored JWT: ${storedJwt ? 'found' : 'not found'}, Stored Expiry: ${storedExpiry}`);

        if (storedJwt && storedExpiry > Date.now()) {
          console.log("UserProvider: useEffect A - Restoring valid backendJwt.");
          setBackendJwt(storedJwt);
          setBackendJwtExpiry(storedExpiry);
        } else {
          console.log("UserProvider: useEffect A - No valid backendJwt found or expired. Deleting any stale JWT from SecureStore.");
          await SecureStore.deleteItemAsync(SECURE_KEY_JWT);
          await SecureStore.deleteItemAsync(SECURE_KEY_JWT_EXPIRY);
        }
      } catch (e) {
        console.warn("UserProvider: useEffect A - Initialization error:", e);
        setError("Failed to load auth data");
      } finally {
        console.log("UserProvider: useEffect A - Setting loading to false.");
        setLoading(false);
      }
    })();
  }, []);

  // B) Persist `user` changes to SecureStore
  useEffect(() => {
    console.log("\n\nUserProvider: useEffect B - User state changed:", user);
    (async () => {
      try {
        if (user.googleToken && user.googleEmail) {
          console.log("UserProvider: useEffect B - Persisting userSession to SecureStore.");
          await SecureStore.setItemAsync(
            SECURE_KEY_USER,
            JSON.stringify(user)
          );
          console.log("UserProvider: useEffect B - userSession persisted.");
        } else {
          console.log("UserProvider: useEffect B - User data is null/incomplete, deleting userSession from SecureStore.");
          await SecureStore.deleteItemAsync(SECURE_KEY_USER);
          console.log("UserProvider: useEffect B - userSession deleted.");
        }
      } catch (e) {
        console.warn("UserProvider: useEffect B - Failed to persist userSession:", e);
      }
    })();
  }, [user]);

  // C) Persist backend JWT changes
  useEffect(() => {
    console.log(`\n\nUserProvider: useEffect C - backendJwt or backendJwtExpiry changed. JWT: ${backendJwt ? 'exists' : 'null'}, Expiry: ${backendJwtExpiry}`);
    (async () => {
      try {
        if (backendJwt && backendJwtExpiry > Date.now()) {
          console.log("UserProvider: useEffect C - Persisting backendJwt to SecureStore.");
          await SecureStore.setItemAsync(SECURE_KEY_JWT, backendJwt);
          await SecureStore.setItemAsync(
            SECURE_KEY_JWT_EXPIRY,
            backendJwtExpiry.toString()
          );
          console.log("UserProvider: useEffect C - backendJwt persisted.");
        } else {
          console.log("UserProvider: useEffect C - backendJwt is null or expired, deleting from SecureStore.");
          await SecureStore.deleteItemAsync(SECURE_KEY_JWT);
          await SecureStore.deleteItemAsync(SECURE_KEY_JWT_EXPIRY);
          console.log("UserProvider: useEffect C - backendJwt deleted.");
        }
      } catch (e) {
        console.warn("UserProvider: useEffect C - Failed to persist backend JWT:", e);
      }
    })();
  }, [backendJwt, backendJwtExpiry]);

  // D) getValidJwt(): returns a valid JWT, refreshing if expired
  const getValidJwt = async (): Promise<string> => {
    console.log("UserProvider: getValidJwt called.");
    if (backendJwt && backendJwtExpiry > Date.now() + 5000) { // 5 seconds buffer
      console.log("UserProvider: getValidJwt - Returning existing valid JWT.");
      return backendJwt;
    }
    console.log("UserProvider: getValidJwt - Existing JWT is invalid or expiring soon. Fetching new token.");
    setLoading(true); // Indicate loading state during token refresh
    setError(null);
    // Attempt to fetch a new JWT if the current one is invalid or expiring soon
    try {
      console.log("UserProvider: getValidJwt - Evaluating MCP_CLIENT_URL. Constants.expoConfig?.extra:", Constants.expoConfig?.extra);
      const MCP_CLIENT_URL = (Constants.expoConfig?.extra ?? {})
        .mcpClientURL as string; // Ensure this matches the key in app.config.js

      if (!MCP_CLIENT_URL || typeof MCP_CLIENT_URL !== 'string' || MCP_CLIENT_URL.trim() === '' || MCP_CLIENT_URL === 'undefined') {
        console.error("UserProvider: getValidJwt - MCP_CLIENT_URL is not defined, is invalid, or is the string 'undefined' in app.config.js extra. Current value:", MCP_CLIENT_URL, "Full expoConfig.extra:", Constants.expoConfig?.extra);
        setError("Backend configuration error. Please contact support.");
        throw new Error("MCP_CLIENT_URL is not configured or is 'undefined'.");
      }

      console.log(`UserProvider: getValidJwt - Fetching from ${MCP_CLIENT_URL}/auth/token`);
      const resp = await fetch(`${MCP_CLIENT_URL}/auth/token`, {
        method: "POST",
        headers: {
          Authorization:
            "Basic cGFya2J1ZGR5LW1vYmlsZTpXZWxjMG1lQDc4OSE=", // Consider moving to a safer place if sensitive
        },
      });
      console.log(`UserProvider: getValidJwt - Auth/token response status: ${resp.status}`);
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error(`UserProvider: getValidJwt - Auth/token failed: ${resp.status}, ${errorText}`);
        setError(`Failed to authenticate with backend (${resp.status})`);
        throw new Error(`Auth/token failed: ${resp.status}`);
      }
      const json = await resp.json();
      const newJwt = (json.token as string) || "";
      if (!newJwt) {
        console.error("UserProvider: getValidJwt - Auth/token response did not include a token.", json);
        setError("Failed to retrieve token from backend.");
        throw new Error("No token in auth response.");
      }
      const newExpiry = Date.now() + 1000 * 3600; // Assuming 1 hour expiry
      console.log(`UserProvider: getValidJwt - New JWT obtained. Expiry: ${new Date(newExpiry).toISOString()}`);
      setBackendJwt(newJwt);
      setBackendJwtExpiry(newExpiry);
      return newJwt;
    } catch (e: any) {
      console.error("UserProvider: getValidJwt - Failed to fetch backend JWT:", e.message, e);
      
      // Determine if setError was already called with a specific message from the try block
      let specificErrorAlreadySetInTryBlock = false;
      if (e && e.message) {
          // These are the messages of errors thrown from the try block *after* setError was called with a custom message.
          if (e.message === "MCP_CLIENT_URL is not configured or is \'undefined\'." || 
              e.message.startsWith("Auth/token failed:") || // Check for prefix
              e.message === "No token in auth response.") {
            specificErrorAlreadySetInTryBlock = true;
          }
      }

      if (!specificErrorAlreadySetInTryBlock) {
        // If setError wasn't called with a specific message for this exception `e`
        // from the try block, then this is likely a more generic error (e.g., network
        // failure from fetch itself, or a JSON parsing error before our checks).
        // Set the context error to reflect this, including e.message if available.
        let detailedContextErrorMessage = "Unable to obtain backend token";
        if (e && e.message) {
            // e.g., "Unable to obtain backend token: Network request failed"
            // or "Unable to obtain backend token: JSON Parse error: Unexpected EOF"
            detailedContextErrorMessage += `: ${e.message}`; 
        } else {
            detailedContextErrorMessage += " due to an unexpected server or network issue.";
        }
        setError(detailedContextErrorMessage);
      }
      // If specificErrorAlreadySetInTryBlock is true, UserContext.error already holds 
      // the more specific message set within the try block (e.g., "Backend configuration error...", 
      // "Failed to authenticate...", "Failed to retrieve token...").
      // The `error` state in UserContext will now be more informative.

      // Re-throw the error so the calling function knows something went wrong.
      // The calling function (e.g., in ScanScreen) should also have a try-catch.
      throw e; 
    } finally {
      console.log("UserProvider: getValidJwt - Setting loading to false after token fetch attempt.");
      setLoading(false);
    }
  };

  // E) logout(): clears both Google user and backend JWT, and signs out from Google
  const logout = async () => {
    console.log("UserProvider: logout called.");
    setLoading(true);
    setError(null);
    try {
      console.log("UserProvider: logout - Attempting Google Sign-Out.");
      await GoogleSignin.signOut();
      console.log("UserProvider: logout - Google Sign-Out successful.");
      
      console.log("UserProvider: logout - Clearing local user state.");
      setUserState({ googleToken: null, googleEmail: null });
      console.log("UserProvider: logout - Clearing local backend JWT state.");
      setBackendJwt(null);
      setBackendJwtExpiry(0);
      // SecureStore items will be cleared by the respective useEffects (B and C)
      // when user and backendJwt are set to null.
      console.log("UserProvider: logout - Local state cleared. SecureStore will update via useEffects.");
    } catch (e: any) { // Explicitly type e
      console.warn("UserProvider: logout - Logout error:", e.message, e);
      // Even if Google Signout fails, attempt to clear local state
      console.log("UserProvider: logout - Error during Google Sign-Out, attempting to clear local state anyway.");
      setUserState({ googleToken: null, googleEmail: null });
      setBackendJwt(null);
      setBackendJwtExpiry(0);
      setError("An error occurred during logout. Local session cleared despite potential Google Sign-Out issue.");
      console.log("UserProvider: logout - Local state cleared despite error. SecureStore will update via useEffects.");
    } finally {
      console.log("UserProvider: logout - Setting loading to false.");
      setLoading(false);
    }
  };

  console.log("UserProvider: Rendering Provider. Current state:", { user, backendJwtExists: !!backendJwt, backendJwtExpiry, loading, error });
  return (
    <UserContext.Provider
      value={{
        user,
        setUser: setUserState,
        logout,
        backendJwt,
        backendJwtExpiry,
        getValidJwt,
        loading,
        error,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
