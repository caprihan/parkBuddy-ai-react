// app/_layout.tsx
import { Stack } from "expo-router";
import { UserProvider } from "../context/UserContext";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { Provider as PaperProvider, DefaultTheme } from "react-native-paper";

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee', // Material Purple500
    accent: '#03dac4',  // Teal
  },
};

export default function RootLayout() {
  return (
    <ActionSheetProvider>
      <UserProvider>
        <PaperProvider theme={theme}>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: theme.colors.primary },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </PaperProvider>
      </UserProvider>
    </ActionSheetProvider>
  );
}