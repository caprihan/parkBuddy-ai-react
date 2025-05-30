// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

export default function TabLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: '#fff',
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#888',
        tabBarIcon: ({ color, size }) => {
          let iconName: string;
          if (route.name === 'scan') iconName = 'camera';
          else if (route.name === 'findBay') iconName = 'map-marker-path';
          else if (route.name === 'history') iconName = 'history';
          else iconName = 'circle';
          return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="scan" options={{ title: 'Scan' }} />
      <Tabs.Screen name="findBay" options={{ title: 'Find Bay' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
    </Tabs>
  );
}