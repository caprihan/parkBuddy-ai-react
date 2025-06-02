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
  const [user, setUserState] = useState<AppUser>({
    googleToken: null,
    googleEmail: null,
  });
  const [backendJwt, setBackendJwt] = useState<string | null>(null);
  const [backendJwtExpiry, setBackendJwtExpiry] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // A) On mount, restore stored User + JWT (if still valid)
  useEffect(() => {
    (async () => {
      try {
        const storedUser = await SecureStore.getItemAsync(SECURE_KEY_USER);
        if (storedUser) {
          setUserState(JSON.parse(storedUser));
        }

        const storedJwt = await SecureStore.getItemAsync(SECURE_KEY_JWT);
        const storedExpiryStr = await SecureStore.getItemAsync(
          SECURE_KEY_JWT_EXPIRY
        );
        const storedExpiry = storedExpiryStr
          ? parseInt(storedExpiryStr, 10)
          : 0;

        if (storedJwt && storedExpiry > Date.now()) {
          setBackendJwt(storedJwt);
          setBackendJwtExpiry(storedExpiry);
        } else {
          await SecureStore.deleteItemAsync(SECURE_KEY_JWT);
          await SecureStore.deleteItemAsync(SECURE_KEY_JWT_EXPIRY);
        }
      } catch (e) {
        console.warn("UserProvider init error:", e);
        setError("Failed to load auth data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // B) Persist `user` changes to SecureStore
  useEffect(() => {
    (async () => {
      try {
        if (user.googleToken && user.googleEmail) {
          await SecureStore.setItemAsync(
            SECURE_KEY_USER,
            JSON.stringify(user)
          );
        } else {
          await SecureStore.deleteItemAsync(SECURE_KEY_USER);
        }
      } catch (e) {
        console.warn("Failed to persist userSession:", e);
      }
    })();
  }, [user]);

  // C) Persist backend JWT changes
  useEffect(() => {
    (async () => {
      try {
        if (backendJwt && backendJwtExpiry > Date.now()) {
          await SecureStore.setItemAsync(SECURE_KEY_JWT, backendJwt);
          await SecureStore.setItemAsync(
            SECURE_KEY_JWT_EXPIRY,
            backendJwtExpiry.toString()
          );
        } else {
          await SecureStore.deleteItemAsync(SECURE_KEY_JWT);
          await SecureStore.deleteItemAsync(SECURE_KEY_JWT_EXPIRY);
        }
      } catch (e) {
        console.warn("Failed to persist backend JWT:", e);
      }
    })();
  }, [backendJwt, backendJwtExpiry]);

  // D) getValidJwt(): returns a valid JWT, refreshing if expired
  const getValidJwt = async (): Promise<string> => {
    if (backendJwt && backendJwtExpiry > Date.now() + 5000) {
      return backendJwt;
    }
    try {
      const BACKEND_HOST = (Constants.expoConfig?.extra ?? {})
        .backendHost as string;
      const resp = await fetch(`${BACKEND_HOST}/auth/token`, {
        method: "POST",
        headers: {
          Authorization:
            "Basic cGFya2J1ZGR5LW1vYmlsZTpXZWxjMG1lQDc4OTE=",
        },
      });
      if (!resp.ok) {
        throw new Error(`Auth/token failed: ${resp.status}`);
      }
      const json = await resp.json();
      const newJwt = (json.token as string) || "";
      const newExpiry = Date.now() + 1000 * 3600;
      setBackendJwt(newJwt);
      setBackendJwtExpiry(newExpiry);
      return newJwt;
    } catch (e: any) {
      console.warn("Failed to fetch backend JWT:", e);
      throw new Error("Unable to obtain backend token");
    }
  };

  // E) logout(): clears both Google user and backend JWT, and signs out from Google
  const logout = async () => {
    setLoading(true);
    try {
      await GoogleSignin.signOut(); // Add this line
      console.log("UserContext: Google Sign-Out successful.");
      setUserState({ googleToken: null, googleEmail: null });
      setBackendJwt(null);
      setBackendJwtExpiry(0);
      // SecureStore items will be cleared by the respective useEffects
      // when user and backendJwt are set to null.
    } catch (e: any) { // Explicitly type e
      console.warn("UserContext: Logout error:", e.message, e);
      // Even if Google Signout fails, attempt to clear local state
      setUserState({ googleToken: null, googleEmail: null });
      setBackendJwt(null);
      setBackendJwtExpiry(0);
      setError("An error occurred during logout. Local session cleared.");
    } finally {
      setLoading(false);
    }
  };

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
