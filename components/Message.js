import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDate, formatTime } from '../utils/dateUtils';
import theme from '../theme/theme';
  
function Message({ message, isCurrentUser }) {
  const messageStyle = isCurrentUser ? styles.sent : styles.received;
  const messageTextStyle = isCurrentUser ? styles.sentText : styles.receivedText;
  const dateTimeContainerStyle = isCurrentUser ? styles.sentDateTimeContainer : styles.receivedDateTimeContainer;

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
          <Text style={[styles.messageContent, messageTextStyle]} dangerouslySetInnerHTML={{ __html: message.cleanContent }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  message: {
    marginVertical: 4,
    padding: 8,
    maxWidth: '80%',
  },
  sent: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
  },
  received: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.secondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border.messaging,
  },
  topRow: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageMeta: {
    // Add styles here if needed
  },
  messageDatetime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  line: {
    height: 1,
    backgroundColor: theme.colors.border.messaging,
    flex: 1,
    marginHorizontal: 8,
  },
  messageDate: {
    fontSize: 12,
    color: theme.colors.text.gray,
  },
  bottomRow: {
    // Add styles here if needed
  },
  messageColLeft: {
    // Add styles here if needed
  },
  messageTime: {
    // Add styles here if needed
  },
  timeText: {
    fontSize: 10,
    color: theme.colors.text.gray,
  },
  messageContent: {
    fontSize: 14,
  },
  sentText: {
    color: theme.colors.secondary,
  },
  receivedText: {
    color: theme.colors.text.dark,
  },
});


export default Message;