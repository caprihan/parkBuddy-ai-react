// app/_layout.tsx
import { Stack } from "expo-router";
import { UserProvider } from "../context/UserContext";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { Provider as PaperProvider, DefaultTheme } from "react-native-paper";

const purpleTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#6D5BEE",
    accent: "#8F75FF",
    background: "#F5F5F5",
    surface: "#FFFFFF",
    text: "#212121",
    placeholder: "#9E9E9E",
    error: "#D32F2F",
  },
  roundness: 8,
};

export default function RootLayout() {
  return (
    <PaperProvider theme={purpleTheme}>
      <ActionSheetProvider>
        <UserProvider>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: purpleTheme.colors.primary },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            >
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
        </UserProvider>
      </ActionSheetProvider>
    </PaperProvider>
  );
}