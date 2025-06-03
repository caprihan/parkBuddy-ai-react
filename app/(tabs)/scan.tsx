// File: app/(tabs)/scan.tsx

import React, { useState, useEffect, useRef } from "react"; // Added useRef
import { View, StyleSheet, Image, ActivityIndicator, Alert, SafeAreaView, ScrollView } from "react-native";
import { Text, Button, Card, IconButton, useTheme } from "react-native-paper";
// import * as ImagePicker from "expo-image-picker"; // Removed ImagePicker
import { CameraView, useCameraPermissions } from "expo-camera"; // Added CameraView and useCameraPermissions
import Constants from "expo-constants";
import { useUser } from "../../context/UserContext";
import { useRouter } from "expo-router";
import * as Localization from 'expo-localization';
import * as ImageManipulator from 'expo-image-manipulator';

export default function ScanScreen() {
  const theme = useTheme();
  const router = useRouter();
  console.log("ScanScreen: Rendered");

  const { user, getValidJwt, loading: userContextLoading, logout } = useUser();
  console.log(`ScanScreen: UserContext initial - user.googleToken: ${!!user.googleToken}, contextLoading: ${userContextLoading}`);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [result, setResult] = useState<{ decision: string; parkTill: string | null; explanation: string } | null>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    console.log(`ScanScreen: useEffect for permissions and auth check. user.googleToken: ${!!user.googleToken}, contextLoading: ${userContextLoading}`);
    
    if (!permission) {
      // Permissions are still loading, request them
      (async () => {
        console.log("ScanScreen: Requesting camera permissions via useCameraPermissions...");
        const perm = await requestPermission();
        console.log("ScanScreen: Camera permission status from hook:", perm?.status);
        if (perm && perm.status !== "granted") {
          Alert.alert("Permission Denied", "Camera permission is required to scan parking signs.");
          console.warn("ScanScreen: Camera permission not granted.");
        }
      })();
    } else if (!permission.granted) {
        // Permissions are determined but not granted
        // Optionally, prompt again or show a message. For now, an alert is shown if initial request failed.
        console.warn("ScanScreen: Camera permission was not granted on previous check.");
    }


    if (!userContextLoading && !user.googleToken) {
      console.log("ScanScreen: useEffect - No googleToken AND userContext not loading. Redirecting to /(auth).");
      router.replace("/(auth)");
    } else if (userContextLoading) {
      console.log("ScanScreen: useEffect - userContext is loading, deferring auth check.");
    } else {
      console.log("ScanScreen: useEffect - googleToken present. No redirect needed from useEffect.");
    }
  }, [user.googleToken, userContextLoading, router, permission, requestPermission]);

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
      const photoResult = await cameraRef.current?.takePictureAsync({
        quality: 0.5,  // lower resolution
      });

      if (photoResult?.uri) {
        console.log("ScanScreen: Photo taken, URI:", photoResult.uri);
        const fullUri = photoResult.uri;

        // Set imageUri to switch to the results view immediately
        setImageUri(fullUri); 

        // Option B: Kick off upload and resize concurrently - RESIZE PART REMOVED
        const uploadPromise = processPhoto(fullUri);
        // const resizePromise = ImageManipulator.manipulateAsync(
        //   fullUri,
        //   [{ resize: { width: 240, height: 320 } }],
        //   { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        // );
        // resizePromise.then(({ uri }: { uri: string }) => { // Type annotation for destructuring
        //   console.log("ScanScreen: Small image URI (Option B):", uri);
        //   setImageUri(uri);
        // });
        await uploadPromise;
      } else {
        console.log("ScanScreen: Photo capture canceled or no assets found, or URI missing.");
        Alert.alert("Error", "Failed to capture image. Please try again.");
      }
    } catch (error) {
      console.error("ScanScreen: Error launching camera or processing result:", error);
      Alert.alert("Camera Error", "Could not take photo. Please try again.");
    }
  };

  const processPhoto = async (photoUri: string) => { // Changed parameter from base64 to photoUri
    console.log(`ScanScreen: processPhoto called with URI: ${photoUri}. user.googleToken: ${!!user.googleToken}, contextLoading: ${userContextLoading}`);
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
      const MCP_CLIENT_URL = (Constants.expoConfig?.extra ?? {}) 
        .mcpClientURL as string;

      const formData = new FormData();
      const filename = photoUri.split('/').pop() || "photo.jpg";
      let type = "image/jpeg"; // Default type
      const extensionMatch = /\.(\w+)$/.exec(filename);
      if (extensionMatch && extensionMatch[1]) {
        type = `image/${extensionMatch[1].toLowerCase() === 'jpg' ? 'jpeg' : extensionMatch[1].toLowerCase()}`;
      }
      
      formData.append('file', {
        uri: photoUri,
        name: filename,
        type: type,
      } as any); // Using 'as any' to handle potential TypeScript strictness with FormData append for files in React Native
      // formData.append('timestamp', new Date().toISOString()); // Backend expects timestamp in the body if not using JSON

      console.log(`ScanScreen: Sending request to ${MCP_CLIENT_URL}/signs/readParkingSign as multipart/form-data`);

      // Generate current datetime string with local timezone offset manually
      const date = new Date();
      const pad = (num: number, size = 2) => String(num).padStart(size, '0');
      const offsetMinutes = -date.getTimezoneOffset(); // inverted to get + for UTC+N
      const offsetSign = offsetMinutes >= 0 ? '+' : '-';
      const absOffset = Math.abs(offsetMinutes);
      const offsetHours = pad(Math.floor(absOffset / 60));
      const offsetMins = pad(absOffset % 60);
      const timezoneOffset = `${offsetSign}${offsetHours}:${offsetMins}`;
      const currentDatetime =
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
        `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
        `.${String(date.getMilliseconds()).padStart(3, '0')}${timezoneOffset}`;
      
      console.log("ScanScreen: Current datetime for request header (local):", currentDatetime);

      const response = await fetch(`${MCP_CLIENT_URL}/signs/readParkingSign`, {
        method: "POST",
        headers: {
          // 'Content-Type': 'multipart/form-data', // fetch automatically sets this with boundary for FormData
          Authorization: `Bearer ${token}`,
          "current-datetime": currentDatetime,
        },
        body: formData, // Send formData object
      });
      
      console.log("ScanScreen: API response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("ScanScreen: Sign parse API failed. Status:", response.status, "Response:", errorText);
        throw new Error(`Sign parse failed: ${response.status}. ${errorText}`);
      }
      const jsonResponse = await response.json();
      console.log("ScanScreen: API response JSON (raw):", jsonResponse);
      // If backend returned JSON within markdown fences, clean and parse it
      let parsedData: any = jsonResponse;
      if (typeof jsonResponse.result === 'string') {
        const cleaned = jsonResponse.result
          .replace(/^```json\s*/, '')
          .replace(/\s*```$/, '');
        console.log("ScanScreen: Cleaned API result string:", cleaned);
        try {
          parsedData = JSON.parse(cleaned);
        } catch (parseErr) {
          console.warn("ScanScreen: Failed to parse cleaned API result:", parseErr);
          // Fallback: manual parse of lines like '- Key: Value,'
          const obj: any = {};
          cleaned.split(/\r?\n/).forEach((line: string) => {
            const trimmed = line.trim();
            if (!trimmed) return;
            // Remove leading hyphens or bullets
            const withoutDash = trimmed.replace(/^[-*]\s*/, '');
            const [rawKey, ...rest] = withoutDash.split(':');
            if (!rest.length) return;
            const key = rawKey.trim();
            let value = rest.join(':').trim();
            // Remove trailing commas
            if (value.endsWith(',')) value = value.slice(0, -1);
            obj[key] = value;
          });
          parsedData = obj;
        }
      }
      // Map parsed data to result state
      setResult({
        decision: parsedData.Decision ?? parsedData.decision,
        parkTill: parsedData.hasOwnProperty("Park Till") ? parsedData["Park Till"] : parsedData.parkTill,
        explanation: parsedData.Explanation ?? parsedData.explanation,
      });
    } catch (e: any) {
      console.warn("ScanScreen: processPhoto error - Message:", e.message, "Full error:", e);
      if (e.message?.includes("Not signed in")) {
        console.log("ScanScreen: processPhoto error indicates 'Not signed in', redirecting to /(auth).");
        router.replace("/(auth)");
      } else {
        let alertMessage = "Failed to process photo. Please try again."; // Default message
        if (e && e.message) {
          alertMessage = e.message; // Use the more specific message from the caught error
        }
        Alert.alert("Processing Error", alertMessage);
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

  // Handle camera permissions
  if (!permission) {
    // Permissions are still loading
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10 }}>Loading camera permissions...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    // Permissions are not granted
    return (
      <SafeAreaView style={styles.centeredMessageContainer}>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>Camera permission is required to scan parking signs.</Text>
        <Button onPress={() => requestPermission()} mode="outlined">Grant Permission</Button>
      </SafeAreaView>
    );
  }

  console.log("ScanScreen: Rendering main content. ImageURI:", imageUri);
  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <IconButton
            icon="logout"
            size={24}
            onPress={handleLogout}
            style={styles.logoutButton}
            // iconColor={theme.colors.primary} // Consider using theme color
          />
        </View>

        {!imageUri ? (
          <View style={styles.cameraContainer}>
            <CameraView style={styles.cameraPreview} ref={cameraRef} facing='back' />
            <Button
              mode="contained"
              onPress={takePhoto}
              icon="camera"
              style={styles.captureButton}
              disabled={processingPhoto}
            >
              Take Photo
            </Button>
          </View>
        ) : (
          <View style={styles.contentContainer}>
            {processingPhoto && (
              <ActivityIndicator
                animating
                size="large"
                color={theme.colors.primary}
                style={{ marginVertical: 10 }}
              />
            )}

            {result && (
              <View style={styles.resultContainer}>
                <Image
                  source={
                    result.decision === 'Yes'
                      ? require('../../assets/parking.png')
                      : require('../../assets/no_parking.png')
                  }
                  style={styles.parkingImage}
                  resizeMode="contain"
                />
                <Text style={styles.resultText}>{`Decision: ${result.decision}`}</Text>
                <Text style={styles.resultText}>{`Park Till: ${result.parkTill ?? 'N/A'}`}</Text>
                <Text style={styles.resultExplanation}>{result.explanation}</Text>
            <Button
              mode="outlined"
              onPress={() => { setImageUri(null); setResult(null); }} // Clear photo & result to free memory
              style={styles.retakeButton}
              disabled={processingPhoto}
            >
              Retake Photo
            </Button>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: { 
    flex: 1,
    backgroundColor: "#F5F5F5", 
  },
  loadingContainer: { 
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  cameraContainer: { // Container for camera preview and its capture button
    flex: 1,
    // justifyContent: 'center', // This might not be needed if camera preview is flex: 1
    alignItems: 'center',
  },
  cameraPreview: {
    flex: 1, // Make camera preview take available space
    width: '100%', // Ensure it spans the width
    // aspectRatio: 3 / 4, // Or your desired aspect ratio, adjust as needed
  },
  contentContainer: { 
    flex: 1, 
    alignItems: "center", 
    padding: 16 
  },
  captureButton: { 
    marginVertical: 20, // Give some space around the capture button
    // position: 'absolute', // Optionally position it over the camera view
    // bottom: 20,
    // alignSelf: 'center'
  },
  retakeButton: {
    marginVertical: 16,
  },
  previewImage: {
    width: 240, // Adjust as needed
    height: 320, // Adjust as needed, consider aspect ratio
    marginVertical: 12,
    borderRadius: 8,
    // resizeMode: 'contain', // Or 'cover'
  },
  resultContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  parkingImage: {
    width: 64,
    height: 64,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 4,
  },
  resultExplanation: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  scrollContainer: {
    flexGrow: 1,
  },
});
