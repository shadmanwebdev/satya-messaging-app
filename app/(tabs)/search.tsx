// app/(tabs)/search.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={styles.screenContainer}>
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666"
          />
        </View>
      </View>
      <ScrollView style={styles.searchContent}>
        <Text style={styles.sectionTitle}>Trending</Text>
        <View style={styles.trendingGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={styles.trendingItem}>
              <Text style={styles.trendingText}>#{`trending${i}`}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  searchHeader: {
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  searchContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  trendingItem: {
    width: '50%',
    padding: 8,
  },
  trendingText: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
  },
});