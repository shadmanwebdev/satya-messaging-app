import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatTime, formatDate } from '../utils/dateTimeUtils';

const MessageItem = ({ message, isOwn, showDate }) => {
    const messageClass = isOwn ? 'sent' : 'received';
    const messageTime = formatTime(message.time);
    
    return (
        <View>
            {showDate && (
                <View style={styles.dateContainer}>
                <View style={styles.dateLeft} />
                <Text style={styles.messageDate}>{formatDate(message.date)}</Text>
                <View style={styles.dateRight} />
                </View>
            )}
            
            <View style={[styles.message, isOwn ? styles.sent : styles.received]}>
                <View style={styles.messageContent}>
                <Text style={styles.messageText}>{message.content}</Text>
                </View>
                <Text style={styles.messageTime}>{messageTime}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    dateLeft: {
        flex: 1,
        height: 1,
        backgroundColor: '#ddd',
    },
    messageDate: {
        marginHorizontal: 10,
        fontSize: 12,
        color: '#666',
    },
    dateRight: {
        flex: 1,
        height: 1,
        backgroundColor: '#ddd',
    },
    message: {
        flexDirection: 'row',
        marginVertical: 5,
        padding: 10,
        borderRadius: 15,
        maxWidth: '80%',
    },
    sent: {
        backgroundColor: '#DCF8C6',
        alignSelf: 'flex-end',
        marginRight: 10,
    },
    received: {
        backgroundColor: '#FFFFFF',
        alignSelf: 'flex-start',
        marginLeft: 10,
    },
    messageContent: {
        flex: 1,
    },
    messageText: {
        fontSize: 16,
    },
    messageTime: {
        fontSize: 10,
        color: '#999',
        alignSelf: 'flex-end',
        marginLeft: 5,
    },
});

export default MessageItem;