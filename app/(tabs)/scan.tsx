// File: app/(tabs)/scan.tsx

import React, { useState, useEffect } from "react";
import { View, StyleSheet, Image, ActivityIndicator, Alert, SafeAreaView } from "react-native"; // Added SafeAreaView
import { Text, Button, Card, IconButton, useTheme } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import Constants from "expo-constants";
import { useUser } from "../../context/UserContext";
import { useRouter } from "expo-router";

export default function ScanScreen() {
  const theme = useTheme();
  const router = useRouter();
  console.log("ScanScreen: Rendered");

  const { user, getValidJwt, loading: userContextLoading, logout } = useUser(); // Added logout
  console.log(`ScanScreen: UserContext initial - user.googleToken: ${!!user.googleToken}, contextLoading: ${userContextLoading}`);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [result, setResult] = useState<{
    decision: string;
    parkTill: string;
    explanation: string;
  } | null>(null);

  useEffect(() => {
    console.log(`ScanScreen: useEffect for permissions and auth check. user.googleToken: ${!!user.googleToken}, contextLoading: ${userContextLoading}`);
    (async () => {
      console.log("ScanScreen: Requesting camera permissions...");
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log("ScanScreen: Camera permission status:", status);
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Camera permission is required to scan parking signs.");
        console.warn("ScanScreen: Camera permission not granted.");
      }
    })();

    if (!userContextLoading && !user.googleToken) {
      console.log("ScanScreen: useEffect - No googleToken AND userContext not loading. Redirecting to /(auth).");
      router.replace("/(auth)");
    } else if (userContextLoading) {
      console.log("ScanScreen: useEffect - userContext is loading, deferring auth check.");
    } else {
      console.log("ScanScreen: useEffect - googleToken present. No redirect needed from useEffect.");
    }
  }, [user.googleToken, userContextLoading, router]);

  const takePhoto = async () => {
    console.log(`ScanScreen: takePhoto called. user.googleToken: ${!!user.googleToken}, contextLoading: ${userContextLoading}`);
    if (userContextLoading) {
      console.log("ScanScreen: takePhoto - userContext is loading. Aborting photo capture.");
      Alert.alert("Loading", "User session is still loading, please wait a moment.");
      return;
    }
    if (!user.googleToken) {
      console.log("ScanScreen: takePhoto - No googleToken and context not loading. Redirecting to /(auth).");
      router.replace("/(auth)");
      return;
    }

    console.log("ScanScreen: Launching camera...");
    try {
      const photoResult = await ImagePicker.launchCameraAsync({
        base64: true,
        quality: 0.7,
      });

      if (!photoResult.canceled && photoResult.assets && photoResult.assets.length > 0) {
        const asset = photoResult.assets[0];
        console.log("ScanScreen: Photo taken, URI:", asset.uri);
        setImageUri(asset.uri);
        if (asset.base64) {
          processPhoto(asset.base64);
        } else {
          console.error("ScanScreen: Photo taken but base64 data is missing.");
          Alert.alert("Error", "Failed to get image data. Please try again.");
        }
      } else {
        console.log("ScanScreen: Photo capture canceled or no assets found.");
      }
    } catch (error) {
      console.error("ScanScreen: Error launching camera or processing result:", error);
      Alert.alert("Camera Error", "Could not take photo. Please try again.");
    }
  };

  const processPhoto = async (base64: string) => {
    console.log(`ScanScreen: processPhoto called. user.googleToken: ${!!user.googleToken}, contextLoading: ${userContextLoading}`);
    setProcessingPhoto(true);
    setResult(null);
    try {
      if (userContextLoading) {
        console.warn("ScanScreen: processPhoto - User context still loading. Aborting API call.");
        Alert.alert("Loading", "User session is still loading, please try again.");
        setProcessingPhoto(false);
        return;
      }
      if (!user.googleToken) {
        console.error("ScanScreen: processPhoto - Not signed in (checked before API call). Redirecting.");
        throw new Error("Not signed in");
      }

      const token = await getValidJwt();
      console.log("ScanScreen: getValidJwt successful, proceeding with API call.");
      const BACKEND_HOST = (Constants.expoConfig?.extra ?? {})
        .backendHost as string;

      console.log(`ScanScreen: Sending request to ${BACKEND_HOST}/parking/sign`);
      const response = await fetch(`${BACKEND_HOST}/parking/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: base64,
          timestamp: new Date().toISOString(),
        }),
      });
      console.log("ScanScreen: API response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("ScanScreen: Sign parse API failed. Status:", response.status, "Response:", errorText);
        throw new Error(`Sign parse failed: ${response.status}. ${errorText}`);
      }
      const json = await response.json();
      console.log("ScanScreen: API response JSON:", json);
      setResult({
        decision: json.decision,
        parkTill: json.parkTill,
        explanation: json.explanation,
      });
    } catch (e: any) {
      console.warn("ScanScreen: processPhoto error - Message:", e.message, "Full error:", e);
      if (e.message?.includes("Not signed in")) {
        console.log("ScanScreen: processPhoto error indicates 'Not signed in', redirecting to /(auth).");
        router.replace("/(auth)");
      } else {
        Alert.alert("Processing Error", "Failed to parse sign. Please try again.");
      }
    } finally {
      console.log("ScanScreen: processPhoto finished.");
      setProcessingPhoto(false);
    }
  };

  const handleLogout = async () => {
    console.log("ScanScreen: Logout button pressed.");
    await logout();
    // The useEffect should handle navigation to /auth after user.googleToken is null and loading is false
    console.log("ScanScreen: Logout process initiated.");
  };

  if (userContextLoading) {
    console.log("ScanScreen: Rendering loading indicator due to userContextLoading.");
    return (
      <SafeAreaView style={styles.loadingContainer}> 
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10 }}>Loading user session...</Text>
      </SafeAreaView>
    );
  }

  console.log("ScanScreen: Rendering main content.");
  return (
    <SafeAreaView style={styles.safeAreaContainer}> 
      <View style={styles.headerContainer}>
        <IconButton
          icon="logout"
          size={24}
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </View>
      <View style={styles.contentContainer}>
        <Button
          mode="contained"
          onPress={takePhoto}
          icon="camera"
          style={styles.captureButton}
          disabled={processingPhoto}
        >
          Take Photo of Parking Sign
        </Button>

        {processingPhoto && (
          <ActivityIndicator
            animating
            size="large"
            color={theme.colors.primary}
            style={{ marginVertical: 10 }}
          />
        )}

        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        )}

        {result && (
          <Card style={styles.resultCard}>
            <Card.Title
              title={`Decision: ${result.decision}`}
              subtitle={`Park Till: ${result.parkTill}`}
              left={(props: { size: number; }) => (
                <IconButton
                  icon={
                    result.decision === "Yes"
                      ? "check-circle"
                      : "close-circle"
                  }
                  size={props.size} // Use size from props
                  iconColor={ // Use iconColor prop for react-native-paper IconButton
                    result.decision === "Yes"
                      ? "#4CAF50" // Fallback green for success
                      : "#F44336" // Fallback red for error
                  }
                />
              )}
            />
            <Card.Content>
              <Text>{result.explanation}</Text>
            </Card.Content>
          </Card>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: { // Renamed from container to safeAreaContainer, added flex: 1
    flex: 1,
    backgroundColor: "#F5F5F5", // Optional: set a background color for the safe area
  },
  loadingContainer: { // Style for the loading state
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 10,
    paddingTop: 10, // Adjust as needed for spacing from the top edge
  },
  logoutButton: {
    // Additional styling for the button if needed, e.g., margin
  },
  contentContainer: { // Extracted from the old container style
    flex: 1, 
    alignItems: "center", 
    padding: 16 
  },
  captureButton: { marginVertical: 16 },
  previewImage: {
    width: 240,
    height: 240,
    marginVertical: 12,
    borderRadius: 8,
  },
  resultCard: { width: "100%", marginTop: 16 },
});
