// app/pothis/index.tsx

import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { Text, Card } from "react-native-paper";
import { useRouter, useNavigation } from "expo-router";
import { useEffect, useLayoutEffect, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useUser } from "../../context/UserContext";

export default function BrowseScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user, logout } = useUser();


  // Add header title + logout button
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Search",
      headerRight: () => (
        <TouchableOpacity onPress={logout} style={{ marginRight: 16 }}>
          <MaterialCommunityIcons name="logout" size={22} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, logout]);

  useEffect(() => {
    if (!user.token) {
      console.log("SearchScreen: No user token, redirecting to /auth");
      router.replace("/(auth)");
    }
  }, [user.token, router]); // Add router to dependency array

  return (
               <View> <Text style={styles.metricLabel}>Hello World</Text>
              </View>
  );
}

const styles = StyleSheet.create({
  metricLabel: {
    fontSize: 12,
    color: "#888",
  }
});