import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebSocketProvider } from './contexts/WebSocketContext';
import MessageCenter from './components/MessageCenter';

function App() {
  return (
    <WebSocketProvider>
      <View style={styles.app}>
        <MessageCenter />
      </View>
    </WebSocketProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    // You might want to add more styling for your main app container
  },
});

export default App;