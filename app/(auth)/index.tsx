// File: app/(auth)/index.tsx

import React, { useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Platform, Alert } from "react-native"; // Added Alert
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
  User, // Keep User type for clarity
} from "@react-native-google-signin/google-signin";
import Constants from "expo-constants";
import { useUser } from "../../context/UserContext";
import { useRouter } from "expo-router";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function LoginScreen() {
  const { user, setUser, loading } = useUser();
  const router = useRouter();
  console.log("LoginScreen: rendered, loading:", loading, "ctx user:", user);

  // Effect for Google Sign-In Configuration (runs once)
  useEffect(() => {
    console.log("LoginScreen: Configuring Google Sign-In");
    GoogleSignin.configure({
      webClientId: Constants.expoConfig?.extra?.webClientId as string,
      iosClientId: Constants.expoConfig?.extra?.iosClientId as string,
      scopes: ["profile", "email"],
    });
    console.log("LoginScreen: GoogleSignin configured");
  }, []); // Empty dependency array ensures this runs only once

  // Effect for Silent Sign-In and Navigation Logic
  useEffect(() => {
    console.log("LoginScreen: Auth useEffect. Ctx loading:", loading, "Token:", user.googleToken);

    if (user.googleToken) {
      console.log("LoginScreen: User has googleToken, navigating to /scan");
      router.replace("/(tabs)/scan"); // Navigate to a specific tab or home
      return;
    }

    if (loading) {
      console.log("LoginScreen: Ctx loading, skip silent attempt for now.");
      return;
    }

    // Only attempt silent sign-in if not loading and no token
    const attemptSilentSignIn = async () => {
      console.log("LoginScreen: Attempting silent sign-in (ctx loaded, no token).");
      try {
        const currentUser: User | null = await GoogleSignin.getCurrentUser();
        console.log("LoginScreen: getCurrentUser result:", currentUser);

        if (currentUser && currentUser.user && currentUser.user.email && currentUser.idToken) {
          console.log(
            "LoginScreen: User from getCurrentUser. Email:",
            currentUser.user.email
          );
          setUser({
            googleToken: currentUser.idToken,
            googleEmail: currentUser.user.email,
          });
          // Navigation will be handled by the effect re-running due to setUser
        } else {
          if (currentUser) {
            console.warn("LoginScreen: getCurrentUser response missing email or idToken.", currentUser);
          }
          console.log("LoginScreen: No complete user from getCurrentUser, attempting signInSilently.");
          const signInSilentlyResponse = await GoogleSignin.signInSilently();
          console.log("LoginScreen: signInSilently response structure:", signInSilentlyResponse);

          if (signInSilentlyResponse) {
            const silentData = (signInSilentlyResponse as any).data;
            const potentialSilentUserObject = silentData || signInSilentlyResponse; // Handles direct User obj or wrapped

            const silentUserDetails = potentialSilentUserObject.user;
            const silentToken = potentialSilentUserObject.idToken;

            if (silentUserDetails && silentUserDetails.email && silentToken) {
              console.log("LoginScreen: Silent sign-in successful. Email:", silentUserDetails.email);
              setUser({
                googleToken: silentToken,
                googleEmail: silentUserDetails.email,
              });
            } else if (silentToken && (!silentUserDetails || !silentUserDetails.email)) {
              console.warn("LoginScreen: signInSilently provided idToken but no (or incomplete) user details.", signInSilentlyResponse);
              // This handles cases like {"data": {"idToken": "..."}}
              // Consider this state as requiring manual login for now.
            } else {
              console.warn("LoginScreen: Email or idToken not found in signInSilently response.", signInSilentlyResponse);
            }
          } else {
            console.log("LoginScreen: signInSilently returned null or falsy (no user or needs explicit sign-in).");
          }
        }
      } catch (error: any) {
        console.warn("LoginScreen: Silent/getCurrentUser error:", JSON.stringify(error));
        if (error.code === statusCodes.SIGN_IN_REQUIRED) {
          console.log("LoginScreen: Silent sign-in: SIGN_IN_REQUIRED. User needs to sign in manually.");
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE && Platform.OS === 'android') {
          console.error('LoginScreen: Play services not available or outdated for silent sign-in.');
        } else {
          console.warn("LoginScreen: Silent sign-in: unhandled error:", error.code, error.message);
        }
      }
    };

    if (!loading && !user.googleToken) {
      attemptSilentSignIn();
    }
  }, [user.googleToken, loading, router, setUser]); // Dependencies for the auth logic

  const GoogleLogin = useCallback(async () => { // Wrapped in useCallback
    console.log("LoginScreen: GoogleLogin button pressed.");
    try {
      await GoogleSignin.hasPlayServices();
      console.log("LoginScreen: Play Services available, attempting manual signIn.");
      const signInResponse = await GoogleSignin.signIn();
      console.log("LoginScreen: Manual signIn response structure:", signInResponse);

      // Handle wrapped response {data: {user, idToken}} or direct User object
      const signInData = (signInResponse as any).data;
      const potentialUserObject = signInData || signInResponse;

      const userDetails = potentialUserObject.user;
      const token = potentialUserObject.idToken;

      if (userDetails && userDetails.email && token) {
        console.log("LoginScreen: Manual sign-in successful. Email:", userDetails.email);
        setUser({
          googleToken: token,
          googleEmail: userDetails.email,
        });
        console.log("LoginScreen: User set after manual login, nav to /(tabs)/scan");
        router.replace("/(tabs)/scan");
      } else {
        console.error("LoginScreen: Email or idToken not found in manual signIn response.", signInResponse);
        Alert.alert("Sign-In Error", "Could not retrieve complete user information from Google. Please try again.");
      }
    } catch (error: any) {
      console.warn("LoginScreen: GoogleLogin (manual) error:", JSON.stringify(error));
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("LoginScreen: Manual login: SIGN_IN_CANCELLED.");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("LoginScreen: Manual login: IN_PROGRESS.");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE && Platform.OS === 'android') {
        console.error("LoginScreen: Manual login: PLAY_SERVICES_NOT_AVAILABLE.");
      } else {
        console.warn("LoginScreen: Manual login: unhandled error:", error.code, error.message);
      }
    }
  }, [router, setUser]); // Added dependencies for useCallback

  console.log("LoginScreen: Rendering. Ctx loading:", loading, "Token:", user.googleToken);
  // Conditional rendering logic: Show loading indicator if context is loading OR if there's a token but navigation hasn't happened yet.
  // The `!router.canGoBack()` might not be the most reliable check here.
  // A simpler check is if `loading` is true, or if `user.googleToken` is present (implying a navigation is or was pending).
  if (loading || user.googleToken) {
    console.log("LoginScreen: Displaying loading indicator (ctx loading or token present).");
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }

  console.log("LoginScreen: Displaying Sign-In button.");
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ParkBuddyAI</Text>
      <Text style={styles.subtitle}>Sign in to find your spot</Text>
      <GoogleSignInButton onPress={GoogleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F5F5F5",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#555",
    marginBottom: 40,
    textAlign: "center",
  },
});