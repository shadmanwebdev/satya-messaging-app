// app/(tabs)/create.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CreateScreen() {
  return (
    <View style={styles.centerContainer}>
      <Ionicons name="add-circle-outline" size={64} color="#666" />
      <Text style={styles.createText}>Create New Post</Text>
      <Text style={styles.createSubtext}>Share your story with the world</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  createText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#000',
  },
  createSubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
});