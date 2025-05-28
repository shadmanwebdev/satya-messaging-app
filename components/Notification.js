import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

function Notification({ message, type, duration = 3000 }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [duration]);

  if (!show) return null;

  const notificationStyle = [styles.notificationMessage, styles[type], styles.show];

  return (
    <View style={notificationStyle}>
      <Text>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notificationMessage: {
    padding: 16,
    borderRadius: 8,
    margin: 16,
    // ✅ Use boxShadow for React Native Web compatibility
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
    elevation: 5, // Keep for Android
  },
  success: {
    backgroundColor: '#34C759',
  },
  error: {
    backgroundColor: '#FF3B30',
  },
  info: {
    backgroundColor: '#007AFF',
  },
  show: {
    // In React Native, we don't need to explicitly show or hide an element.
    // Instead, we can conditionally render it.
    // So, this style is not necessary.
  },
});

export default Notification;