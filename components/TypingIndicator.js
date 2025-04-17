import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const TypingIndicator = ({ isVisible, username }) => {
    if (!isVisible) return null;
    
    return (
        <View style={styles.container}>
            <Text style={styles.text}>{username} is typing...</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 5,
        paddingLeft: 15,
        backgroundColor: '#f0f0f0',
    },
    text: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
});

export default TypingIndicator;