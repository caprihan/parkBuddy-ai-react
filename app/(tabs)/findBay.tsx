// app/(tabs)/findBay.tsx
import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Linking } from 'react-native';
import { TextInput, Button, List, Text, ActivityIndicator } from 'react-native-paper';

export default function FindBayScreen() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [bays, setBays] = useState<any[]>([]);
  const [error, setError] = useState('');

  const findBays = async () => {
    setLoading(true);
    setError('');
    try {
      // TODO: integrate with Melbourne parking API
      const mock = [
        { id: 21752, status: 'occupied', lat: -37.8481, lon: 144.9837 },
        { id: 21753, status: 'free', lon: 144.9836, lat: -37.8482 },
      ];
      setTimeout(() => {
        setBays(mock.filter(b => b.status === 'free'));
        setLoading(false);
      }, 1500);
    } catch (e) {
      setError('Error fetching parking bays');
      setLoading(false);
    }
  };

  const openMaps = (lat: number, lon: number) => {
    const url = `geo:${lat},${lon}?q=${lat},${lon}(Parking Bay)`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Enter destination"
        value={query}
        onChangeText={setQuery}
        style={styles.input}
      />
      <Button mode="contained" onPress={findBays} disabled={!query} style={styles.button}>
        Search
      </Button>
      {loading && <ActivityIndicator style={styles.loading} size="large" />}
      {!loading && !bays.length && query && <Text>No empty parking bays found.</Text>}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={bays}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <List.Item
            title={`Bay ${item.id}`}
            description={`Location: ${item.lat.toFixed(4)}, ${item.lon.toFixed(4)}`}
            left={props => <List.Icon {...props} icon={item.status === 'free' ? 'check-circle-outline' : 'close-circle-outline'} />}
            right={props => <List.Icon {...props} icon="arrow-right" />}
            onPress={() => openMaps(item.lat, item.lon)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  input: { marginBottom: 16 },
  button: { marginBottom: 16 },
  loading: { marginVertical: 16 },
  error: { color: 'red', marginVertical: 8 },
});