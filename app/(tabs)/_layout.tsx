// app/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useUser } from "../../context/UserContext";

export default function TabLayout() {
  const { user } = useUser();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#3b5998" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
        tabBarActiveTintColor: "#3b5998",
      }}
    >
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="google-maps" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="signs"
        options={{
          title: "Signs",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="parking"
              color={color}
              size={size}
            />
          ),
        }}
      />
      {/* 
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      /> */}
    </Tabs>
  );
}