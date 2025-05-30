import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { GoogleSignin } from "@react-native-google-signin/google-signin"; // Import GoogleSignin


type User = {
  token: string | null;
  email?: string;
  role: "GENERAL" | "ADMIN";
  adminRights?: string;
};

const UserContext = createContext<{
  user: User;
  setUser: (u: User) => void;
  logout: () => void;
}>({
  user: { token: null, role: "GENERAL" },
  setUser: () => {},
  logout: () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUserState] = useState<User>({ token: null, role: "GENERAL" });

  // On mount, load the user from SecureStore (ensure key is "userSession")
  useEffect(() => {
    console.log("UserProvider>>Loading user from SecureStore");
    const loadUser = async () => {
      try {
        const userString = await SecureStore.getItemAsync("userSession"); // Ensure key matches LoginScreen
        if (userString) {
          console.log("UserProvider>>Found user in SecureStore");
          setUserState(JSON.parse(userString));
        }
      } catch (err) {
        console.error("UserProvider>>Failed to load user from SecureStore", err);
        console.error("Failed to load user from SecureStore", err);
      }
    };
    loadUser();
  }, []);

  // Save the user to SecureStore whenever it changes.
  useEffect(() => {
    const persistUser = async () => {
      try {
        if (user.token) {
          console.log("UserProvider>>Saving user to SecureStore");
          await SecureStore.setItemAsync("userSession", JSON.stringify(user)); // Ensure key matches LoginScreen
        } else {
          console.log("UserProvider>>User token is null, deleting from SecureStore");
          await SecureStore.deleteItemAsync("userSession"); // Ensure key matches LoginScreen
        }
      } catch (err) {
        console.error("UserProvider>>Failed to save user to SecureStore", err);
      }
    };
    persistUser();
  }, [user]);

  const logout = async () => {
    try {
      console.log("UserProvider>>Logging out user");
      // Check if user has previously signed in with Google before trying to signOut
      if (GoogleSignin.hasPreviousSignIn()) { // This is synchronous
        console.log("UserProvider>>hasPreviousSignIn...Signing out from Google");
        await GoogleSignin.signOut();
      }
    } catch (error) {
      console.error("UserProvider>>Error signing out from Google:", error);
    }
    console.log("UserProvider>>Clearing user state and SecureStore");
    setUserState({ token: null, role: "GENERAL" }); // Clear local user state
    // The useEffect above will handle deleting from SecureStore
  };

  return (
    <UserContext.Provider value={{ user, setUser: setUserState, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);