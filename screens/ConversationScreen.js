import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocket } from '../socket/socketService';
import { compareDateTimes, formatDate, formatTime } from '../utils/dateTimeUtils';
import ConversationHeader from '../components/ConversationHeader';
import MessageItem from '../components/MessageItem';
import MessageInput from '../components/MessageInput';
import TypingIndicator from '../components/TypingIndicator';
import Notification from '../components/Notification';

const ConversationScreen = ({ route, navigation }) => {
  const { userId, username, userPhoto, conversationId } = route.params;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [notification, setNotification] = useState({ visible: false, message: '', type: 'success' });
  const flatListRef = useRef(null);
  const socket = getSocket();
  const currentUserId = userId; // Get from your auth system

  useEffect(() => {
    // Get messages for this conversation
    socket.emit('get_messages', { conversation_id: conversationId });

    // Listen for new messages
    socket.on('message_received', handleMessageReceived);
    
    // Listen for typing indicators
    socket.on('user_typing', handleUserTyping);
    
    // Listen for messages from server
    socket.on('messages_list', handleMessagesReceived);

    return () => {
      socket.off('message_received');
      socket.off('user_typing');
      socket.off('messages_list');
    };
  }, [conversationId]);

  const handleMessagesReceived = (data) => {
    if (data.conversation_id === conversationId) {
      setMessages(data.messages);
      setLoading(false);
      scrollToBottom();
    }
  };

  const handleMessageReceived = (message) => {
    if (message.conversation_id === conversationId) {
      setMessages(prevMessages => [...prevMessages, message]);
      scrollToBottom();
    }
  };

  const handleUserTyping = (data) => {
    if (data.conversation_id === conversationId && data.user_id !== currentUserId) {
      setIsTyping(data.is_typing);
      setTypingUser(data.username);
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const showNotification = (message, type) => {
    setNotification({ visible: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  const renderMessageItem = ({ item, index }) => {
    // Check if date should be shown
    const showDate = index === 0 || 
                     new Date(item.sent_at).toDateString() !== 
                     new Date(messages[index - 1].sent_at).toDateString();
    
    return (
      <MessageItem 
        message={item}
        isOwn={item.sender_id === currentUserId}
        showDate={showDate}
      />
    );
  };

  return (
    <View style={styles.container}>
      <ConversationHeader 
        username={username}
        userPhoto={userPhoto}
        onClose={() => navigation.goBack()}
        onMinimize={() => navigation.goBack()} // Adapt as needed for your navigation
      />
      
      <Notification 
        message={notification.message}
        type={notification.type}
        visible={notification.visible}
        onHide={() => setNotification(prev => ({ ...prev, visible: false }))}
      />
      
      {loading ? (
        <ActivityIndicator size="large" color="#0084ff" style={styles.loader} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={scrollToBottom}
        />
      )}
      
      <TypingIndicator isVisible={isTyping} username={typingUser} />
      
      <MessageInput 
        conversationId={conversationId}
        senderId={currentUserId}
        onSend={(message) => {
          // Additional logic if needed after sending a message
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messagesList: {
        paddingVertical: 10,
    },
});

export default ConversationScreen;