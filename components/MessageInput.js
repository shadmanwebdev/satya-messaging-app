import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Modal,
  Button,
} from 'react-native';
import { useWebSocket } from '../contexts/WebSocketContext';
import { FontAwesome } from '@expo/vector-icons';
import theme from '../theme/theme';

function MessageInput({ conversationId }) {
  const [text, setText] = useState('');
  const [typingTimer, setTypingTimer] = useState(null);
  const { socket, currentUserId, getOtherParticipantId, emit } = useWebSocket();
  const [isTyping, setIsTyping] = useState(false); // Local typing state

  useEffect(() => {
    if (socket) {
      const messageSentHandler = (response) => {
        console.log(response);
        if (!response.success) {
          console.error('Failed to send message');
        }
        setText(''); // Clear input after successful send
      };

      socket.on('message_sent', messageSentHandler);

      return () => {
        socket.off('message_sent', messageSentHandler);
      };
    }
  }, [socket]);

  const handleInputChange = (newText) => {
    setText(newText);

    // Typing indicator logic
    if (socket && currentUserId) {
      if (typingTimer) {
        clearTimeout(typingTimer);
      }

      setIsTyping(true);
      emit('typing', {
        conversation_id: conversationId,
        user_id: currentUserId,
        is_typing: true,
      });

      const timer = setTimeout(async () => {
        setIsTyping(false);
        emit('typing', {
          conversation_id: conversationId,
          user_id: currentUserId,
          is_typing: false,
        });
      }, 1000); // Adjust typing timeout as needed
      setTypingTimer(timer);
    }
  };

  const sendMessage = () => {
    if (text.trim() === '' || !socket) return;

    socket.emit('send_message', {
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: text,
    });
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.nativeEvent.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <View style={styles.messageInputArea}>
      {isTyping && (
        <View style={styles.typingIndicatorContainer}>
          <Text style={styles.typingIndicator}>Typing...</Text>
        </View>
      )}
      
      {/* Input container with send button */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="Write a message..."
          placeholderTextColor={theme.colors.text.gray}
          value={text}
          onChangeText={handleInputChange}
          onKeyPress={handleKeyDown}
          multiline={true}
          maxLength={1000} // Reasonable character limit
          blurOnSubmit={false}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        
        <TouchableOpacity 
          style={[
            styles.sendButton, 
            !text.trim() && styles.sendButtonDisabled
          ]} 
          onPress={sendMessage}
          disabled={!text.trim()}
        >
          <FontAwesome 
            name="paper-plane" 
            size={18} 
            color={!text.trim() ? theme.colors.text.gray : theme.colors.secondary} 
          />
        </TouchableOpacity>
      </View>

      {/* Optional: Formatting toolbar - uncomment if needed */}
      {/* 
      <View style={styles.formattingToolbar}>
        <TouchableOpacity style={styles.formatBtn} onPress={() => {}}>
          <FontAwesome name="bold" size={16} color={theme.colors.text.dark} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.formatBtn} onPress={() => {}}>
          <FontAwesome name="italic" size={16} color={theme.colors.text.dark} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.formatBtn} onPress={() => {}}>
          <FontAwesome name="underline" size={16} color={theme.colors.text.dark} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.formatBtn} onPress={() => {}}>
          <FontAwesome name="strikethrough" size={16} color={theme.colors.text.dark} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.formatBtn} onPress={() => {}}>
          <FontAwesome name="link" size={16} color={theme.colors.text.dark} />
        </TouchableOpacity>
      </View>
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  messageInputArea: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.messaging,
    elevation: theme.elevation.md, // Elevated input area
  },
  typingIndicatorContainer: {
    marginBottom: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  typingIndicator: {
    fontSize: 12,
    color: theme.colors.text.gray,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.external,
    elevation: theme.elevation.xs, // Input container elevation
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  messageInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100, // Limit height for multiline
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderColor: theme.colors.border.messaging,
    borderWidth: 1,
    borderRadius: theme.borderRadius.internal,
    backgroundColor: theme.colors.secondary,
    color: theme.colors.text.dark,
    fontSize: 16,
    textAlignVertical: 'top', // Align text to top for multiline
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.button,
    marginLeft: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44, // Minimum touch target
    minHeight: 44,
    elevation: theme.elevation.sm, // Button elevation
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.border.messaging,
    elevation: 0, // No elevation when disabled
  },
  formattingToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.messaging,
    backgroundColor: theme.colors.background.light,
    elevation: theme.elevation.xs, // Toolbar elevation
  },
  formatBtn: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.button,
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: theme.elevation.xs, // Format button elevation
  },
  linkModal: {
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.external,
    margin: theme.spacing.lg,
    elevation: theme.elevation.modal, // Modal elevation
  },
  linkInput: {
    height: 44,
    padding: theme.spacing.sm,
    borderColor: theme.colors.border.messaging,
    borderWidth: 1,
    borderRadius: theme.borderRadius.internal,
    marginVertical: theme.spacing.sm,
    backgroundColor: theme.colors.secondary,
    color: theme.colors.text.dark,
  },
  linkModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
});

export default MessageInput;
