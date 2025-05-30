// app/_layout.tsx

import { Stack } from "expo-router";
import { UserProvider } from "../context/UserContext";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";

export default function RootLayout() {
  return (
    <ActionSheetProvider>
      <UserProvider>
        <Stack
          // initialRouteName="(auth)"
          screenOptions={{
            headerStyle: {
              backgroundColor: "#3b5998",
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        >
          {/* Optional: customize individual screens */}
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false, headerTitle: "" }}
          />
        </Stack>
      </UserProvider>
    </ActionSheetProvider>
  );
}