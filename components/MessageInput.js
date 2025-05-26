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

function MessageInput({ conversationId }) {
  const [text, setText] = useState('');
  const [typingTimer, setTypingTimer] = useState(null);
  const { socket, currentUserId, getOtherParticipantId, emit } = useWebSocket();
  const [isTyping, setIsTyping] = useState(false); // Local typing state

  // Formatting (Not directly supported by TextInput)
  // Consider using a more advanced text editor component if rich text is crucial
  // For this basic conversion, we'll focus on plain text input.
  // const [isBold, setIsBold] = useState(false);
  // const [isItalic, setIsItalic] = useState(false);
  // const [isUnderline, setIsUnderline] = useState(false);
  // const [isStrikethrough, setIsStrikethrough] = useState(false);
  // const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  // const [linkText, setLinkText] = useState('');
  // const [linkUrl, setLinkUrl] = useState('');

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

  // Formatting is significantly different in React Native
  // We'll omit the rich text formatting for this basic conversion using TextInput.
  // If rich text editing is required, you would typically use a third-party library
  // like react-native-webview to embed a web-based editor or explore native rich text editors.

  // const handleFormat = (format) => {
  //   // ... (rich text formatting logic - not directly applicable to TextInput)
  // };

  // const handleInsertLink = () => {
  //   // ... (link insertion logic - not directly applicable to TextInput)
  // };

  // const handleCloseLinkModal = () => {
  //   // ... (link modal closing logic)
  // };

  const handleKeyDown = (e) => {
    if (e.nativeEvent.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <View style={styles.messageInputArea}>
      {isTyping && <Text style={styles.typingIndicator}>Typing...</Text>}
      {/* Formatting toolbar - basic buttons without rich text functionality */}
      <View style={styles.formattingToolbar}>
        <TouchableOpacity style={styles.formatBtn} onPress={() => { /* Handle bold (if implementing) */ }}>
          <FontAwesome name="bold" size={20} color="black" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.formatBtn} onPress={() => { /* Handle italic (if implementing) */ }}>
          <FontAwesome name="italic" size={20} color="black" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.formatBtn} onPress={() => { /* Handle underline (if implementing) */ }}>
          <FontAwesome name="underline" size={20} color="black" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.formatBtn} onPress={() => { /* Handle strikethrough (if implementing) */ }}>
          <FontAwesome name="strikethrough" size={20} color="black" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.formatBtn} onPress={() => { /* Handle link (if implementing modal) */ }}>
          <FontAwesome name="link" size={20} color="black" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <FontAwesome name="paper-plane" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.messageInput}
        placeholder="Write a message..."
        value={text}
        onChangeText={handleInputChange}
        onKeyPress={handleKeyDown}
        multiline={true}
        blurOnSubmit={false} // Keep keyboard open on Enter (if you don't want to send immediately)
        returnKeyType="send" // Change Enter button text to "Send"
        onSubmitEditing={sendMessage} // Send message on "Send" button press
      />

      {/* Link Modal (if you were to implement a custom one) */}
      {/* <Modal visible={isLinkModalOpen} animationType="slide" transparent={true}>
        <View style={styles.linkModal}>
          <Text>Enter Link URL:</Text>
          <TextInput
            style={styles.linkInput}
            placeholder="https://example.com"
            value={linkUrl}
            onChangeText={setLinkUrl}
          />
          <View style={styles.linkModalButtons}>
            <Button title="Insert" onPress={handleInsertLink} />
            <Button title="Cancel" onPress={handleCloseLinkModal} />
          </View>
        </View>
      </Modal> */}
    </View>
  );
}

const styles = StyleSheet.create({
  messageInputArea: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.messaging,
  },
  typingIndicator: {
    fontSize: 12,
    color: theme.colors.text.gray,
    marginBottom: 4,
  },
  formattingToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 4,
  },
  formatBtn: {
    padding: 8,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    padding: 8,
    borderRadius: 20,
  },
  messageInput: {
    height: 40,
    padding: 8,
    borderColor: theme.colors.border.messaging,
    borderWidth: 1,
    borderRadius: 10,
  },
  linkModal: {
    backgroundColor: theme.colors.secondary,
    padding: 16,
    borderRadius: 10,
    margin: 20,
  },
  linkInput: {
    height: 40,
    padding: 8,
    borderColor: theme.colors.border.messaging,
    borderWidth: 1,
    borderRadius: 10,
  },
  linkModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default MessageInput;