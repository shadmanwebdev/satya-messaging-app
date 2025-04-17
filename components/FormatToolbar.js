import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FormatToolbar = ({ onFormatPress }) => {
    const formats = [
        { format: 'bold', icon: 'bold' },
        { format: 'italic', icon: 'italic' },
        { format: 'underline', icon: 'underline' },
        { format: 'strikethrough', icon: 'strikethrough' },
        { format: 'link', icon: 'link' }
    ];

    return (
        <View style={styles.toolbar}>
        {formats.map((item) => (
            <TouchableOpacity 
            key={item.format}
            style={styles.button}
            onPress={() => onFormatPress(item.format)}
            >
            <Ionicons name={item.icon} size={18} color="#333" />
            </TouchableOpacity>
        ))}
        </View>
    );
};

const styles = StyleSheet.create({
    toolbar: {
        flexDirection: 'row',
        padding: 5,
        backgroundColor: '#f0f0f0',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    button: {
        padding: 8,
        marginHorizontal: 2,
    },
});

export default FormatToolbar;
