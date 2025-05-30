// app/(tabs)/history.tsx
import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { List, Text } from 'react-native-paper';

const mockHistory = [
  { id: '1', date: '2025-05-28 14:32', decision: 'Yes' },
  { id: '2', date: '2025-05-27 09:15', decision: 'No' },
];

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      {!mockHistory.length ? (
        <Text>No history available.</Text>
      ) : (
        <FlatList
          data={mockHistory}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <List.Item
              title={`Scan on ${item.date}`}
              description={`Decision: ${item.decision}`}
              left={props => <List.Icon {...props} icon="history" />}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
});