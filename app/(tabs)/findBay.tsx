// app/(tabs)/findBay.tsx

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Linking,
  Platform,
} from "react-native";
import {
  Text,
  IconButton,
  Button,
  Card,
  ActivityIndicator,
  Divider,
  useTheme,
} from "react-native-paper";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";


// ---------------------------
// TYPES & ENUMS
// ---------------------------
type Bay = {
  id: number;
  lat: number;
  lon: number;
  isFree: boolean;
};

enum Stage {
  Prompt = "prompt",
  Listening = "listening",
  Processing = "processing",
  Results = "results",
  Empty = "empty",
  Error = "error",
}

// ---------------------------
// MAIN COMPONENT
// ---------------------------
export default function FindBayScreen({ navigation }: any) {
  const theme = useTheme();
  const mapRef = useRef<MapView>(null);
  const extra = Constants.expoConfig?.extra;


  // 1) Which panel are we on?
  const [stage, setStage] = useState<Stage>(Stage.Prompt);

  // 2) Text query (fallback if voice fails)
  const [query, setQuery] = useState<string>("");

  // 3) Transcribed text (from voice)
  const [transcript, setTranscript] = useState<string>("");

  // 4) Fetched bay data (returned from backend/LLM pipeline)
  const [bays, setBays] = useState<Bay[]>([]);

  // 5) Map region – centered on the query result coordinate
  const [region, setRegion] = useState({
    latitude: -37.815, // default to Melbourne CBD
    longitude: 144.96332,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  });

  // 6) Status / error message
  const [statusMsg, setStatusMsg] = useState<string>("");

  // ----------------------------------------------
  // EFFECT: If we already have bay results, fit map to show all markers
  // ----------------------------------------------
  useEffect(() => {
    if (stage === Stage.Results && bays.length > 0) {
      const coords = bays.map((b) => ({
        latitude: b.lat,
        longitude: b.lon,
      }));
      coords.push({
        latitude: region.latitude,
        longitude: region.longitude,
      });
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 80, right: 40, bottom: 200, left: 40 },
          animated: true,
        });
      }, 500);
    }
  }, [stage, bays]);

  // ----------------------------------------------
  // HANDLERS
  // ----------------------------------------------

  // 1) When user taps the mic – start “listening”
  const onMicPress = () => {
    Keyboard.dismiss();
    setTranscript("");
    setStage(Stage.Listening);

    // TODO: Replace this stub with real STT logic.
    // For demonstration, simulate a 3‐second “listening” period,
    // then set “transcript” to a dummy string and proceed to processing.
    setTimeout(() => {
      const dummyTranscript = "Find parking near Federation Square";
      setTranscript(dummyTranscript);
      setStage(Stage.Processing);
      executeSearch(dummyTranscript);
    }, 3000);
  };

  // 2) If user types text and taps “Search”
  const onTextSearch = () => {
    if (query.trim().length === 0) {
      return;
    }
    Keyboard.dismiss();
    setTranscript(query.trim());
    setStage(Stage.Processing);
    executeSearch(query.trim());
  };

  // 3) Call your backend / LLM pipeline to get bay data.
  //    For now, simulate with a timeout; replace with real fetch().
  const executeSearch = async (destination: string) => {
    try {
      setStatusMsg(`Searching for parking bays near "${destination}"…`);

      // STEP A: Geocode “destination” → lat/lng (e.g. via Google Maps Geocoding API)
      // For demo, skip real geocoding and pick a dummy coordinate.
      const lat = -37.816; // dummy Melbourne coords
      const lng = 144.9635;
      setRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      });

      // STEP B: Call your backend LLM to find bay statuses at (lat, lng)
      // Stub with a delay + hardcoded results.
      setStatusMsg("Found 2 parking bays. Checking availability…");
      setTimeout(() => {
        const dummyBays: Bay[] = [
          { id: 21752, lat: lat + 0.0003, lon: lng + 0.0004, isFree: false },
          { id: 21753, lat: lat - 0.0002, lon: lng - 0.0005, isFree: true },
        ];
        setBays(dummyBays);

        const anyFree = dummyBays.some((b) => b.isFree);
        setStage(anyFree ? Stage.Results : Stage.Empty);
      }, 2000);
    } catch (err) {
      console.warn("Error fetching bays:", err);
      setStage(Stage.Error);
      setStatusMsg("⚠️ Unable to fetch results. Please try again.");
    }
  };

  // 4) “New Search” → reset all state
  const resetAll = () => {
    setQuery("");
    setTranscript("");
    setBays([]);
    setStatusMsg("");
    setStage(Stage.Prompt);
  };

  // ----------------------------------------------
  // RENDERERS FOR EACH PANEL
  // ----------------------------------------------

  // ──────────────────────────────────────────────────────────────────
  // 1) PROMPT PANEL (REDESIGNED LIKE FLIGHT SCREEN)
  // ──────────────────────────────────────────────────────────────────
  const PromptPanel = () => {
    const screenHeight = Dimensions.get("window").height;
    const gradientHeight = screenHeight * 0.4; // ~40% of screen

    return (
      <View style={styles.rootContainer}>
        {/* A) Gradient Header + Microphone */}
        <LinearGradient
          colors={["#6D5BEE", "#8F75FF"]}
          start={[0, 0]}
          end={[1, 1]}
          style={[styles.gradientHeader, { height: gradientHeight }]}
        >
          {/* Back Arrow & Title */}
          <View style={styles.headerRow}>
            <IconButton
              icon="arrow-left"
              size={28}
              color="#FFFFFF"
              onPress={() => navigation.goBack()}
            />
            <Text variant="headlineLarge" style={styles.headerTitle}>
              FIND PARKING BAY
            </Text>
          </View>

          {/* Large Mic Button in White Circle */}
          <View style={styles.micCircleWrapper}>
            <TouchableOpacity
              style={styles.micCircle}
              onPress={onMicPress}
              activeOpacity={0.7}
              accessibilityLabel="Tap to speak your destination"
            >
              <IconButton
                icon="microphone"
                size={48}
                color="#6D5BEE"
                style={{ margin: 0 }}
              />
            </TouchableOpacity>
            <Text style={styles.micHintText}>
              Tap to speak your destination
            </Text>
          </View>
        </LinearGradient>

        {/* B) Card‐Style Input Area */}
        <Card style={styles.inputCard} elevation={4}>
          <Card.Content>
            <View style={styles.textSearchRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Type destination"
                placeholderTextColor="#9E9E9E"
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
                onSubmitEditing={onTextSearch}
                autoCapitalize="words"
              />
              <Button
                mode="contained"
                onPress={onTextSearch}
                disabled={query.trim().length === 0}
                style={styles.searchButton}
                labelStyle={{ color: "#FFFFFF", fontWeight: "600" }}
              >
                Search
              </Button>
            </View>
            <View style={styles.orRow}>
              <Divider style={{ flex: 1, height: 1 }} />
              <Text style={styles.orText}>OR</Text>
              <Divider style={{ flex: 1, height: 1 }} />
            </View>
            <Text style={styles.hintText}>
              You can also say “Find parking near Federation Square”
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  };

  // ──────────────────────────────────────────────────────────────────
  // 2) LISTENING OVERLAY
  // ──────────────────────────────────────────────────────────────────
  const ListeningOverlay = () => (
    <View style={styles.listeningOverlay}>
      <ActivityIndicator animating size={64} color="#FFFFFF" />
      <Text style={styles.listeningText}>Listening…</Text>
      {transcript.length > 0 && (
        <Text style={styles.transcriptText}>You said: “{transcript}”</Text>
      )}
      <Button
        onPress={resetAll}
        textColor="#FFFFFF"
        style={styles.cancelButton}
        labelStyle={{ textDecorationLine: "underline" }}
      >
        Cancel
      </Button>
    </View>
  );

  // ──────────────────────────────────────────────────────────────────
  // 3) PROCESSING PANEL
  // ──────────────────────────────────────────────────────────────────
  const ProcessingPanel = () => (
    <View style={styles.processingContainer}>
      <ActivityIndicator
        animating
        size="large"
        color={theme.colors.primary}
        style={{ marginBottom: 24 }}
      />
      <Text style={styles.processingText}>Processing your request…</Text>
      {transcript.length > 0 && (
        <Text style={styles.transcribingText}>You said: “{transcript}”</Text>
      )}
    </View>
  );

  // ──────────────────────────────────────────────────────────────────
  // 4A) RESULTS PANEL (Bays Found)
  // ──────────────────────────────────────────────────────────────────
  const ResultsPanel = () => {
    const screenHeight = Dimensions.get("window").height;
    const mapHeight = screenHeight * 0.42;

    const renderBayCard = ({ item }: { item: Bay }) => (
      <Card style={styles.bayCard} elevation={2}>
        <View style={styles.cardRow}>
          {item.isFree ? (
            <IconButton
              icon="check-circle-outline"
              color="#388E3C"
              size={28}
            />
          ) : (
            <IconButton
              icon="close-circle-outline"
              color="#D32F2F"
              size={28}
            />
          )}
          <View style={styles.cardTextColumn}>
            <Text
              variant="titleMedium"
              style={{
                color: item.isFree ? "#388E3C" : "#D32F2F",
                fontWeight: "600",
              }}
            >
              Bay {item.id} – {item.isFree ? "FREE" : "OCCUPIED"}
            </Text>
            <Text variant="bodySmall" style={{ color: "#757575" }}>
              Location: {item.lat.toFixed(4)}, {item.lon.toFixed(4)}
            </Text>
          </View>
          {item.isFree && (
            <IconButton
              icon="arrow-right"
              size={28}
              color={theme.colors.primary}
              onPress={() => {
                const uri = Platform.select({
                  ios: `comgooglemaps://?q=${item.lat},${item.lon}`,
                  android: `geo:${item.lat},${item.lon}?q=${item.lat},${item.lon}`,
                });
                Linking.openURL(uri!);
              }}
            />
          )}
        </View>
      </Card>
    );

    return (
      <View style={styles.resultsContainer}>
        {/* 1) Map + Header Overlay */}
        <View style={[styles.mapWrapper, { height: mapHeight }]}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFillObject}
            region={region}
            showsUserLocation={true}
          >
            {bays.map((b) => (
              <Marker
                key={b.id}
                coordinate={{ latitude: b.lat, longitude: b.lon }}
                pinColor={b.isFree ? "#388E3C" : "#D32F2F"}
                title={`Bay ${b.id}`}
                description={b.isFree ? "FREE" : "OCCUPIED"}
              />
            ))}
          </MapView>

          {/* Overlay: Back + Title */}
          <View style={styles.mapHeaderOverlay}>
            <IconButton
              icon="arrow-left"
              size={28}
              color="#FFFFFF"
              onPress={resetAll}
            />
            <Text variant="titleLarge" style={styles.mapHeaderTitle}>
              Find Bay
            </Text>
          </View>
        </View>

        {/* 2) Status Text + Divider */}
        <View style={styles.statusWrapper}>
          <Text variant="bodyMedium" style={styles.statusText}>
            {bays.length > 0
              ? `Found ${bays.length} bay${bays.length > 1 ? "s" : ""}. Scroll below to view.`
              : `❌ No empty parking bays found.`}
          </Text>
          <Divider style={{ backgroundColor: "#E0E0E0", marginVertical: 4 }} />
        </View>

        {/* 3) Scrollable List of Bay Cards */}
        <FlatList
          data={bays}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={renderBayCard}
        />

        {/* 4) New Search Button at Bottom */}
        <View style={styles.newSearchWrapper}>
          <Button
            mode="contained"
            onPress={resetAll}
            style={styles.newSearchButton}
            labelStyle={{
              color: "#FFFFFF",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            New Search
          </Button>
        </View>
      </View>
    );
  };

  // ──────────────────────────────────────────────────────────────────
  // 4B) EMPTY PANEL (No Free Bays)
  // ──────────────────────────────────────────────────────────────────
  const EmptyPanel = () => (
    <View style={styles.emptyContainer}>
      {/* Re‐use the “Map + Header” from ResultsPanel */}
      <View
        style={[
          styles.mapWrapper,
          { height: Dimensions.get("window").height * 0.42 },
        ]}
      >
        <MapView
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          region={region}
          showsUserLocation={true}
        >
          {bays.map((b) => (
            <Marker
              key={b.id}
              coordinate={{ latitude: b.lat, longitude: b.lon }}
              pinColor={b.isFree ? "#388E3C" : "#D32F2F"}
              title={`Bay ${b.id}`}
              description={b.isFree ? "FREE" : "OCCUPIED"}
            />
          ))}
        </MapView>
        <View style={styles.mapHeaderOverlay}>
          <IconButton
            icon="arrow-left"
            size={28}
            color="#FFFFFF"
            onPress={resetAll}
          />
          <Text variant="titleLarge" style={styles.mapHeaderTitle}>
            Find Bay
          </Text>
        </View>
      </View>

      <View style={styles.emptyMessageWrapper}>
        <IconButton icon="close-circle-outline" color="#D32F2F" size={48} />
        <Text variant="headlineSmall" style={styles.emptyMessageText}>
          No empty parking bays found.
        </Text>
        <Text variant="bodyMedium" style={styles.tipText}>
          Try another location or try again in a few minutes.
        </Text>
        <Button
          mode="contained"
          onPress={resetAll}
          style={[styles.newSearchButton, { marginTop: 16 }]}
          labelStyle={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}
        >
          New Search
        </Button>
      </View>
    </View>
  );

  // ──────────────────────────────────────────────────────────────────
  // 4C) ERROR PANEL (Network / Fetch Error)
  // ──────────────────────────────────────────────────────────────────
  const ErrorPanel = () => (
    <View style={styles.emptyContainer}>
      <IconButton icon="alert-circle-outline" color="#D32F2F" size={48} />
      <Text variant="headlineSmall" style={styles.emptyMessageText}>
        {statusMsg || "Something went wrong."}
      </Text>
      <Button
        mode="contained"
        onPress={resetAll}
        style={[styles.newSearchButton, { marginTop: 16 }]}
        labelStyle={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}
      >
        Try Again
      </Button>
    </View>
  );

  // ----------------------------------------------
  // MAIN RENDER SWITCH
  // ----------------------------------------------
  return (
    <View style={styles.rootContainer}>
      {stage === Stage.Prompt && <PromptPanel />}
      {stage === Stage.Listening && <ListeningOverlay />}
      {stage === Stage.Processing && <ProcessingPanel />}
      {stage === Stage.Results && <ResultsPanel />}
      {stage === Stage.Empty && <EmptyPanel />}
      {stage === Stage.Error && <ErrorPanel />}
    </View>
  );
}

// -------------------------
// STYLES
// -------------------------
const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5", // light grey behind cards
  },

  // ───────────────────────────────────
  // PROMPT PANEL (REDESIGNED)
  // ───────────────────────────────────
  gradientHeader: {
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 48 : 36, // status bar + safe area
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  micCircleWrapper: {
    alignItems: "center",
    marginTop: 12,
  },
  micCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  micHintText: {
    marginTop: 8,
    fontSize: 14,
    color: "#FFFFFF",
  },

  // The card containing the “OR” + TextInput + Search button
  inputCard: {
    marginTop: -48, // pull it up so it overlaps the gradient slightly
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 4,
    paddingVertical: 16,
  },
  textSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    color: "#212121",
  },
  searchButton: {
    marginLeft: 8,
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  orText: {
    marginHorizontal: 8,
    fontSize: 14,
    color: "#9E9E9E",
  },
  hintText: {
    fontSize: 12,
    color: "#757575",
    textAlign: "center",
    marginTop: 4,
  },

  // ───────────────────────────────────
  // LISTENING OVERLAY
  // ───────────────────────────────────
  listeningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  listeningText: {
    fontSize: 20,
    color: "#FFFFFF",
    marginTop: 16,
    textAlign: "center",
  },
  transcriptText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontStyle: "italic",
    marginTop: 8,
    textAlign: "center",
  },
  cancelButton: {
    marginTop: 16,
  },

  // ───────────────────────────────────
  // PROCESSING PANEL
  // ───────────────────────────────────
  processingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
  },
  processingText: {
    fontSize: 18,
    color: "#424242",
    marginBottom: 8,
    textAlign: "center",
  },
  transcribingText: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
  },

  // ───────────────────────────────────
  // RESULTS PANEL
  // ───────────────────────────────────
  resultsContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  mapWrapper: {
    width: "100%",
    backgroundColor: "#6D5BEE", // fallback while map loads
  },
  mapHeaderOverlay: {
    position: "absolute",
    top: Platform.OS === "ios" ? 48 : 36,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  mapHeaderTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 8,
  },
  statusWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  statusText: {
    fontSize: 14,
    color: "#424242",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    backgroundColor: "#F5F5F5",
  },
  bayCard: {
    marginTop: 12,
    borderRadius: 8,
    overflow: "hidden",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  cardTextColumn: {
    flex: 1,
    marginLeft: 8,
  },
  newSearchWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    backgroundColor: "#F5F5F5",
  },
  newSearchButton: {
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
  },

  // ───────────────────────────────────
  // EMPTY PANEL (No Free Bays)
  // ───────────────────────────────────
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#F5F5F5",
  },
  emptyMessageWrapper: {
    alignItems: "center",
    marginTop: 32,
  },
  emptyMessageText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#424242",
    textAlign: "center",
    marginTop: 8,
  },
  tipText: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
    marginTop: 4,
  },
});
