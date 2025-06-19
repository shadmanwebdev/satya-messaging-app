// If you have a separate layout file for the search tab, or update your main layout
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebSocketProvider } from '../../contexts/WebSocketContext';
import SearchScreen from './search';

function SearchTab() {
  return (
    <WebSocketProvider>
      <View style={styles.container}>
        <SearchScreen />
      </View>
    </WebSocketProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SearchTab;