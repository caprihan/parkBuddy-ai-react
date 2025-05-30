// app/index.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import * as SecureStore from "expo-secure-store";
import {
  GoogleSignin,
  GoogleSigninButton,
  User,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { useRouter } from "expo-router";
import { useUser } from "../../context/UserContext";

import GoogleSignInButton from "@/components/GoogleSignInButton";
import Constants from "expo-constants";

export default function LoginScreen() {
  const { setUser } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const extra = Constants.expoConfig?.extra;

  // Effect to check for stored session on component mount
  useEffect(() => {
    const checkStoredSession = async () => {
      console.log("LoginScreen>>Checking for stored user session in SecureStore");
      setLoading(true);
      try {
        const sessionDataString = await SecureStore.getItemAsync("userSession");
        if (sessionDataString) {
          console.log("LoginScreen>>Found stored user session in SecureStore");
          const sessionData = JSON.parse(sessionDataString);
          // Here you might want to add token validation logic if your tokens expire
          // For this example, we assume if it exists, it's usable.
          setUser(sessionData); // Set user in context
          router.replace({ // Redirect to main app screen
            pathname: "/(tabs)/browse", // Or your preferred home screen
            // params: { user: JSON.stringify(sessionData) }, // If needed by the target screen
          });
        }
      } catch (e) {
        console.error("LoginScreen>>Failed to load user session from SecureStore", e);
        // Optionally, clear corrupted data: await SecureStore.deleteItemAsync("userSession");
      } finally {
        // Only set loading to false if no session was found,
        // otherwise, the redirect will happen.
        // If a session is found and redirect happens, this screen might unmount.
        const sessionDataString = await SecureStore.getItemAsync("userSession");
        if (!sessionDataString) {
          setLoading(false);
        }
      }
    };

    checkStoredSession();
  }, []); // Empty dependency array ensures this runs only once on mount

  GoogleSignin.configure({
    webClientId:
      extra?.webClientId,
    scopes: ["profile", "email"],
    offlineAccess: true,
    iosClientId: extra?.iosClientId,
  });

  const GoogleLogin = async () => {
    setLoading(true);
    // console.log("GoogleLogin>>Starting Google Sign-In process");
    // check if users' device has google play services
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      // google services are available
      //console.log("Google Play Services are available");
    } catch (err) {
      console.error("play services are not available");
      return err;
    }

    // console.log("GoogleLogin>>Google Play Services are available");
    // console.log("GoogleLogin>>Configuring Google Sign-In");

    try {
      // initiates signIn process
      const response = await GoogleSignin.signIn();
      // console.log("GoogleLogin>>Google Sign-In response:", response);
      if (response.type === "success") {
        return response;
      } else if (response.type === "cancelled") {
        // console.warn("GoogleLogin>>User cancelled the sign-in process");
        setLoading(false);
        return null; 
      }// User cancelled the sign-in
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            // operation (eg. sign in) already in progress
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            // Android only, play services not available or outdated
            console.error("GoogleLogin>>Play services not available");
            break;
          default:
            // some other error happened
            console.error("GoogleLogin>>Some other error occurred: ", error);
        }
      } else {
        // an error that's not related to google sign in occurred
        console.error("GoogleLogin>>Error during Google Sign-In:", error);
      }
    }
  };

  // Fetch user permissions
  // const fetchUserPermissions = async (
  //   token: string | undefined,
  //   profile: any
  // ) => {
  //   if (!token) return;

  //   const email = profile?.email;

  //   if (!email) return;

  //   try {
  //     const url = `https://vvuf6mpbnbafi71-gcatp2.adb.ap-mumbai-1.oraclecloudapps.com/ords/skosh/sk_admins/${encodeURIComponent(
  //       email.toUpperCase()
  //     )}`;
  //     const adminRes = await fetch(url, {
  //       headers: {
  //         Authorization: process.env.EXPO_PUBLIC_API_BASIC_AUTH!,
  //         Accept: "application/json",
  //       },
  //     });

  //     if (adminRes.status === 404) {
  //       setUser({ token, role: "GENERAL", email, adminRights: "NONE" });
  //     } else if (adminRes.ok) {
  //       const admin = await adminRes.json();
  //       setUser({
  //         token,
  //         role: "ADMIN",
  //         email,
  //         adminRights: admin.admin_rights || "NONE",
  //       });
  //     }

  //     //      router.replace("/");
  //     router.replace({
  //       // pathname: "/(tabs)/home",
  //       pathname: "/(tabs)/browse",
  //       params: { user: JSON.stringify(profile) },
  //     });
  //   } catch (err) {
  //     console.error("Auth error", err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const fetchUserPermissions = async (
    token: string | undefined,
    profile: any
  ) => {
    if (!token) {
      setLoading(false); // Ensure loading is stopped if token is missing
      return;
    }

    const email = profile?.email;

    if (!email) {
      setLoading(false); // Ensure loading is stopped if email is missing
      return;
    }

    try {
      const url = `https://vvuf6mpbnbafi71-gcatp2.adb.ap-mumbai-1.oraclecloudapps.com/ords/skosh/sk_admins/${encodeURIComponent(
        email.toUpperCase()
      )}`;
      const adminRes = await fetch(url, {
        headers: {
          Authorization: process.env.EXPO_PUBLIC_API_BASIC_AUTH!,
          Accept: "application/json",
        },
      });

      let userSessionData;

      if (adminRes.status === 404) {
        userSessionData = { token, role: "GENERAL" as const, email, adminRights: "NONE" };
        setUser(userSessionData);
      } else if (adminRes.ok) {
        const admin = await adminRes.json();
        userSessionData = {
          token,
          role: "ADMIN" as const,
          email,
          adminRights: admin.admin_rights || "NONE",
        };
        setUser(userSessionData);
      } else {
        // Handle other non-OK responses if necessary
        console.error("Failed to fetch user permissions:", adminRes.status);
        setLoading(false);
        return;
      }

      if (userSessionData) {
        try {
          await SecureStore.setItemAsync("userSession", JSON.stringify(userSessionData));
        } catch (e) {
          console.error("Failed to save user session to SecureStore", e);
        }
      }

      router.replace({
        pathname: "/(tabs)/browse",
        params: { user: JSON.stringify(profile) }, // Consider if you still need to pass full profile here
      });
    } catch (err) {
      console.error("Auth error", err);
    } finally {
      // setLoading(false) is called here, but if navigation occurs,
      // this screen might unmount before this is hit.
      // It's generally safe, but be mindful of unmounting effects.
      setLoading(false);
    }
  };
  // Google Sign-In workflow
  const googleSignIn = async () => {
    setLoading(true);
    try {
      const response = await GoogleLogin();
      // console.log("googleSignIn>>Google Sign-In response:", response);
      if (!response) {
        console.warn("googleSignIn>>No response from Google Sign-In");
        setLoading(false);
        return;
      }

      // retrieve user data
      const { idToken, user } = response.data ?? {};
      if (!idToken) {
        console.error("No ID token received");
        return;
      } else {
        // console.log("googleSignIn>>ID Token:", idToken);
        fetchUserPermissions(idToken, user);
      }

      //      if (idToken) {
      //        await saveToken(idToken, user);
      // Navigate to the main app screen
      // Pass the user object as a parameter
      // router.replace({
      //   pathname: "/(tabs)/home",
      //   params: { user: JSON.stringify(user) },
      // });
      //      }
    } catch (error) {
      console.error("Error during Google Sign-In:", error);
    } finally {
      // setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <Text style={styles.title}>ShabdKosh</Text>
          <GoogleSignInButton onPress={googleSignIn} style={{ width: 280 }} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 42,
    marginBottom: 20,
    color: "#5f6368",
  },
});