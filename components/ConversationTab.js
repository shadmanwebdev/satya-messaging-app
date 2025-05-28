import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useWebSocket } from '../contexts/WebSocketContext';
import { FontAwesome } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme/theme';

function ConversationTab({
  conversationId,
  username,
  userPhoto,
  currentUserId,
  onClose,
  onMinimize,
}) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const { socket, emit } = useWebSocket();

  useEffect(() => {
    if (socket) {
      // Request messages for this conversation
      emit('get_messages', {
        conversation_id: conversationId,
      });

      // Listen for messages
      const messageHandler = (data) => {
        if (data.conversation_id === conversationId) {
          setMessages((prev) => [...prev, data]);
        }
      };

      // Listen for typing indicators
      const typingHandler = (data) => {
        if (
          data.conversation_id === conversationId &&
          data.user_id !== currentUserId
        ) {
          setIsTyping(data.is_typing);
        }
      };

      // Listen for loaded messages
      const messagesLoadedHandler = (data) => {
        if (data.conversation_id === conversationId) {
          setMessages(data.messages);
        }
      };

      socket.on('new_message', messageHandler);
      socket.on('typing', typingHandler);
      socket.on('messages_loaded', messagesLoadedHandler);

      return () => {
        socket.off('new_message', messageHandler);
        socket.off('typing', typingHandler);
        socket.off('messages_loaded', messagesLoadedHandler);
      };
    }
  }, [socket, conversationId, currentUserId]);

  const handleMinimize = () => {
    setMinimized(!minimized);
    if (onMinimize) {
      onMinimize(conversationId);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose(conversationId);
    }
  };

  if (minimized) {
    return (
      <TouchableOpacity style={styles.minimizedTab} onPress={handleMinimize}>
        <Image
          style={styles.minimizedAvatar}
          source={{
            uri: userPhoto.startsWith('https://')
              ? userPhoto
              : `https://satya.pl/serve_image.php?photo=${userPhoto}`,
          }}
        />
        <Text style={styles.minimizedUsername}>{username}</Text>
        <TouchableOpacity onPress={handleClose} style={styles.minimizedCloseButton}>
          <Ionicons name="close-outline" size={18} color="black" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container} id={`messaging-tab-${conversationId}`}>
      <View style={styles.header}>
        <Image
          style={styles.avatar}
          source={{
            uri: userPhoto.startsWith('https://')
              ? userPhoto
              : `https://satya.pl/serve_image.php?photo=${userPhoto}`,
          }}
        />
        <Text style={styles.username}>{username}</Text>
        <TouchableOpacity onPress={handleMinimize} style={styles.minimizeButton}>
          <FontAwesome name="window-minimize" size={20} color="black" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <View style={styles.body}>
        <View style={styles.notificationContainer}>
          <View style={styles.notificationMessage}></View>
        </View>
        <View style={styles.messageListOuter}>
          <MessageList
            messages={messages}
            conversationId={conversationId}
            currentUserId={currentUserId}
          />
        </View>
        <View style={styles.typingIndicator}>
          {isTyping && <Text>{username} is typing...</Text>}
        </View>
        <MessageInput
          conversationId={conversationId}
          senderId={currentUserId}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    height: '100%',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.external,
    padding: theme.spacing.sm,
    elevation: theme.elevation.modal, // Added elevation for conversation tab shadow
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.messaging,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.dark,
    marginLeft: theme.spacing.sm,
  },
  minimizeButton: {
    marginLeft: 'auto',
    marginRight: theme.spacing.sm,
    padding: theme.spacing.xs, // Added padding for better touch area
    elevation: theme.elevation.xs, // Light elevation for button
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.external2,
  },
  closeButton: {
    marginRight: theme.spacing.sm,
    padding: theme.spacing.xs, // Added padding for better touch area
    elevation: theme.elevation.xs, // Light elevation for button
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.external2,
  },
  body: {
    flex: 1,
  },
  notificationContainer: {
    // Add styles here if needed
  },
  notificationMessage: {
    // Add styles here if needed
  },
  messageListOuter: {
    flex: 1,
  },
  typingIndicator: {
    padding: theme.spacing.sm,
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.messaging,
    elevation: theme.elevation.xs, // Added light elevation for typing indicator
  },
  minimizedTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.external,
    elevation: theme.elevation.card, // Added elevation for minimized tab
  },
  minimizedAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  minimizedUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.dark,
    marginLeft: theme.spacing.sm,
  },
  minimizedCloseButton: {
    marginLeft: 'auto',
    padding: theme.spacing.xs, // Added padding for better touch area
    elevation: theme.elevation.xs, // Light elevation for button
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.external2,
  },
});

export default ConversationTab;
