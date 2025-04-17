import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ConversationHeader = ({ username, userPhoto, onClose, onMinimize }) => {
    return (
        <View style={styles.header}>
            <Image 
                source={{ uri: userPhoto.startsWith("https://") ? userPhoto : `http://yourserver.com/serve_image.php?photo=${userPhoto}` }}
                style={styles.avatar}
            />
            <Text style={styles.username}>{username}</Text>
            <TouchableOpacity onPress={onMinimize} style={styles.iconButton}>
                <Ionicons name="remove" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    username: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
    },
    iconButton: {
        padding: 5,
    },
});

export default ConversationHeader;
