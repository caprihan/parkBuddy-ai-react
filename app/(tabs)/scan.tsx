// app/pothis/index.tsx

import React, { useState, useLayoutEffect, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Button, ActivityIndicator, Card } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera'; // Changed import
import { useRouter, useNavigation } from 'expo-router';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useUser } from "../../context/UserContext";


export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions(); // New permission hook
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const cameraRef = useRef<CameraView>(null); // Changed type to CameraView
  const navigation = useNavigation();

  const router = useRouter();
  const { user, logout } = useUser();

  // Add header title + logout button.
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Scan",
      headerRight: () => (
        <TouchableOpacity onPress={logout} style={{ marginRight: 16 }}>
          <MaterialCommunityIcons name="logout" size={22} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, logout]);

  useEffect(() => {
    if (user && !user.token) { // Added null check for user
      console.log("SearchScreen: No user token, redirecting to /auth");
      router.replace("/(auth)");
    }
  }, [user, router]); // Add router to dependency array and user

  // Permission requesting logic is now handled by the hook and conditional rendering below
  // Removed old useEffect for Camera.requestCameraPermissionsAsync()

  const takePicture = async () => {
    if (!cameraRef.current) return;
    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      // TODO: send photo.base64 to your LLM API and parse result
      const now = new Date();
      setTimeout(() => {
        setScanResult({
          currentDateTime: now.toLocaleString(),
          decision: 'Yes',
          parkTill: '2 hours',
          explanation: 'No restrictions apply at this time.',
        });
        setLoading(false);
      }, 2000);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  if (!permission) {
    // Camera permissions are still loading.
    return <View style={styles.center}><Text>Requesting camera permission...</Text></View>;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.center}>
        <Text>No access to camera. We need your permission to show the camera.</Text>
        <Button onPress={requestPermission} mode="contained" style={{ marginTop: 10 }}>
          Grant Permission
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!scanResult ? (
        <>
          <CameraView style={styles.camera} ref={cameraRef} facing="back" /> 
          {loading ? (
            <ActivityIndicator style={styles.loading} size="large" />
          ) : (
            <Button mode="contained" onPress={takePicture} style={styles.button}>
              <Text>Capture</Text>
            </Button>
          )}
        </>
      ) : (
        <Card style={styles.card}>
          <Card.Title title="Scan Result" />
          <Card.Content>
            <Text>Current Day/Time: {scanResult.currentDateTime}</Text>
            <Text>Decision: {scanResult.decision}</Text>
            <Text>Park Till: {scanResult.parkTill}</Text>
            <Text>Explanation: {scanResult.explanation}</Text>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => setScanResult(null)}>Scan Again</Button>
            {/* Use the existing router instance from the component scope */}
            <Button onPress={() => router.push('/(tabs)/history')}>View History</Button>
          </Card.Actions>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  camera: { flex: 1 },
  button: { margin: 16 },
  loading: { marginTop: 16 },
  card: { margin: 16 },
});