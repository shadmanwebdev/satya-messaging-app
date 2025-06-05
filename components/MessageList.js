import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Message from './Message';
import { compareDateTimes, formatDate, formatTime } from '../utils/dateUtils';
import { useWebSocket } from '../contexts/WebSocketContext';
import theme from '../theme/theme';

function MessageList({ messages: initialMessages, conversationId }) {
  const scrollViewRef = useRef(null);
  const [messages, setMessages] = useState(initialMessages || []);
  const { socket, currentUserId } = useWebSocket();

  useEffect(() => {
    // Update messages when initialMessages change
    setMessages(initialMessages || []);
  }, [initialMessages]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (socket) {
      // Handle new messages
      const receiveMessageHandler = (messageData) => {
        console.log('New message received:', messageData);
        if (messageData.conversation_id === conversationId) {
          setMessages((prev) => [...prev, messageData]);
          scrollToBottom();
        }
      };

      // Add handler for successful sends
      const messageSentHandler = (response) => {
        console.log('Message sent response:', response);
        if (
          response.success &&
          response.message &&
          response.message.conversation_id === conversationId
        ) {
          setMessages((prev) => [...prev, response.message]);
          scrollToBottom();
        }
      };

      socket.on('receive_message', receiveMessageHandler);
      socket.on('message_sent', messageSentHandler);

      return () => {
        socket.off('receive_message', receiveMessageHandler);
        socket.off('message_sent', messageSentHandler);
      };
    }
  }, [socket, conversationId]);

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  const processedMessages = messages.map((message, index) => {
    const dateObj = compareDateTimes(
      message.sent_at,
      index > 0 ? messages[index - 1].sent_at : null
    );

    return {
      ...message,
      dateObj,
      showDate: !dateObj.matching_date,
      cleanContent: message.content, // Assuming your backend handles cleaning, or you'll need a RN-compatible cleaner
      isCurrentUser: message.sender_id == currentUserId,
    };
  });

  return (
    <View style={styles.containerWrapper}>
      <ScrollView
        style={styles.messageContainer}
        contentContainerStyle={styles.messageList}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollToBottom()} // Scroll on content size change
        showsVerticalScrollIndicator={false} // Hide scrollbar for cleaner look
        bounces={true} // Enable bounce effect
        alwaysBounceVertical={false} // Only bounce when content exceeds container
      >
        {processedMessages.map((message, index) => (
          <Message
            key={`${message.conversation_id}-${message.sender_id}-${index}`}
            message={message}
            isCurrentUser={message.sender_id == currentUserId}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  containerWrapper: {
    flex: 1,
    backgroundColor: theme.colors.background.chat, // Chat background color
  },
  messageContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  messageList: {
    flexGrow: 1,
    padding: theme.spacing.sm,
    paddingBottom: theme.spacing.md, // Extra bottom padding for last message
    justifyContent: 'flex-start', // Align messages to bottom when few messages
  },
});

export default MessageList;
