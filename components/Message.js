import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDate, formatTime } from '../utils/dateUtils';
import theme from '../theme/theme';
  
function Message({ message, isCurrentUser }) {
  const messageStyle = isCurrentUser ? styles.sent : styles.received;
  const messageTextStyle = isCurrentUser ? styles.sentText : styles.receivedText;

  return (
    <View style={[styles.message, messageStyle]}>
      <View style={styles.topRow}>
        <View style={styles.messageMeta}>
          {message.showDate && (
            <View style={styles.messageDatetime}>
              <View style={styles.line} />
              <Text style={styles.messageDate}>{formatDate(message.dateObj?.date)}</Text>
              <View style={styles.line} />
            </View>
          )}
        </View>
      </View>
      <View style={styles.bottomRow}>
        <View style={styles.messageColLeft}>
          <View style={styles.messageTime}>
            <Text style={styles.timeText}>{formatTime(message.dateObj?.time)}</Text>
          </View>
          {/* Removed dangerouslySetInnerHTML as it's not supported in React Native */}
          <Text style={[styles.messageContent, messageTextStyle]}>
            {message.cleanContent || message.content}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  message: {
    marginVertical: theme.spacing.xs,
    padding: theme.spacing.sm,
    maxWidth: '80%',
  },
  sent: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.external2,
    elevation: theme.elevation.sm, // Added elevation for sent messages
  },
  received: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.external2,
    borderWidth: 1,
    borderColor: theme.colors.border.messaging,
    elevation: theme.elevation.xs, // Added elevation for received messages
  },
  topRow: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageMeta: {
    // Container for message metadata
  },
  messageDatetime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  line: {
    height: 1,
    backgroundColor: theme.colors.border.messaging,
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  messageDate: {
    fontSize: 12,
    color: theme.colors.text.gray,
    fontWeight: '500',
    paddingHorizontal: theme.spacing.sm,
  },
  bottomRow: {
    // Container for message content
  },
  messageColLeft: {
    // Container for time and content
  },
  messageTime: {
    marginBottom: theme.spacing.xs,
  },
  timeText: {
    fontSize: 10,
    color: theme.colors.text.gray,
    fontStyle: 'italic',
  },
  messageContent: {
    fontSize: 14,
    lineHeight: 18,
    paddingVertical: theme.spacing.xs,
  },
  sentText: {
    color: theme.colors.secondary,
  },
  receivedText: {
    color: theme.colors.text.dark,
  },
});

export default Message;
