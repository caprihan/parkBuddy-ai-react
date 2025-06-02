import React from "react";
import { Tabs } from "expo-router";
import { IconButton } from "react-native-paper";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ color }) => <IconButton icon="camera" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="findBay"
        options={{
          title: "Find Bay",
          tabBarIcon: ({ color }) => <IconButton icon="map-marker" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <IconButton icon="history" color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
