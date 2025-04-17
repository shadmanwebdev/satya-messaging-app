import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSocket } from '../socket/socketService';

const MessageInput = ({ conversationId, senderId, onSend }) => {
    const [message, setMessage] = useState('');
    const typingTimerRef = useRef(null);
    const socket = getSocket();

    const handleTyping = () => {
        // Clear previous timer
        clearTimeout(typingTimerRef.current);
        
        // Emit typing started
        socket.emit('typing', {
        conversation_id: conversationId,
        user_id: senderId,
        is_typing: true
        });
        
        // Set timer to stop typing indicator after delay
        typingTimerRef.current = setTimeout(() => {
        socket.emit('typing', {
            conversation_id: conversationId,
            user_id: senderId,
            is_typing: false
        });
        }, 2000);
    };

    const handleSendMessage = () => {
        if (message.trim() === '') return;
        
        // Send message via WebSocket
        socket.emit('send_message', {
        conversation_id: conversationId,
        sender_id: senderId,
        content: message
        });
        
        // Clear input field immediately for better UX
        setMessage('');
        
        // Call onSend callback if provided
        if (onSend) onSend(message);
    };

    return (
        <View style={styles.container}>
        <View style={styles.inputContainer}>
            <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={message}
            onChangeText={(text) => {
                setMessage(text);
                handleTyping();
            }}
            multiline
            />
        </View>
        <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
            <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 10,
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    inputContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 20,
        marginRight: 10,
        paddingHorizontal: 15,
    },
    input: {
        padding: 10,
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: '#0084ff',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default MessageInput;