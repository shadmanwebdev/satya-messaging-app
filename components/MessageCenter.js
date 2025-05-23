import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import ConversationTab from './ConversationTab';
import { useWebSocket } from '../contexts/WebSocketContext';
import Notification from './Notification';
import { truncateHTML } from '../utils/messageUtils';
import { FontAwesome } from '@expo/vector-icons';
import { OverlayScrollbars } from 'overlayscrollbars-react'; // This will need a different approach

function MessageCenter() {
  const [conversations, setConversations] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [searchResults, setSearchResults] = useState({ conversations: [], newUsers: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const searchTimeout = useRef(null);

  const {
    socket,
    currentUserId,
    unreadCount,
    unreadConversations,
    loadUnreadConversations,
  } = useWebSocket();

  useEffect(() => {
    if (socket) {
      // Listen for conversation creation
      const conversationCreatedHandler = (response) => {
        console.log('Conversation created response:', response);
        if (response.success) {
          // Create conversation tab with data from socket response
          setConversations((prev) => {
            // Check if this conversation already exists
            const exists = prev.some(
              (conv) => conv.conversation_id === response.conversation_id
            );
            if (!exists) {
              return [...prev, response];
            }
            return prev;
          });
        } else {
          showNotification('Failed to load conversation', 'error');
        }
      };

      // Listen for search results
      const searchResultsHandler = (response) => {
        console.log('Search results received:', response);
        if (response.success) {
          setSearchResults({
            conversations: response.conversations || [],
            newUsers: response.newUsers || [],
          });
        } else {
          showNotification('Failed to search users', 'error');
        }
      };

      socket.on('conversation_created', conversationCreatedHandler);
      socket.on('search_results', searchResultsHandler);

      return () => {
        socket.off('conversation_created', conversationCreatedHandler);
        socket.off('search_results', searchResultsHandler);
      };
    }
  }, [socket]);

  const handleSearch = (e) => {
    const query = e.nativeEvent.text.trim();
    setSearchTerm(query);

    // Clear any existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Only search if query is at least 3 characters
    if (query.length >= 3) {
      // Debounce the search request
      searchTimeout.current = setTimeout(() => {
        if (socket && currentUserId) {
          console.log('Sending search request: ', query, 'by: ', currentUserId);
          socket.emit('search_users', {
            user_id: currentUserId,
            search_term: query,
          });
        }
      }, 300);
    } else if (query.length === 0) {
      // If search field is cleared, reset to unread conversations
      loadUnreadConversations();
    }
  };

  const openMessagingPopup = (userId, username, userPhoto) => {
    if (socket && currentUserId) {
      socket.emit('get_conversation', {
        current_user_id: currentUserId,
        recipient_id: userId,
        recipient_username: username,
        recipient_photo: userPhoto,
      });
    }
  };

  const closeConversation = (conversationId) => {
    setConversations((prev) =>
      prev.filter((conv) => conv.conversation_id !== conversationId)
    );
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      loadUnreadConversations();
      setSearchTerm('');
      setSearchResults({ conversations: [], newUsers: [] });
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  };

  // React Native doesn't have direct equivalent for OverlayScrollbars
  // We'll use React Native's built-in ScrollView and potentially adjust styling
  // to mimic scrollbar behavior if needed.

  // Get displayed users (from search or unread conversations)
  const displayedConversations =
    searchTerm.length >= 3 ? searchResults.conversations : unreadConversations;

  const displayedNewUsers = searchTerm.length >= 3 ? searchResults.newUsers : [];

  return (
    <View style={styles.messageCenter}>
      <View style={styles.messagesContainer}>
        <View style={styles.messageDropdownWrapper}>
          <TouchableOpacity style={styles.conversationsBtn} onPress={toggleDropdown}>
            <Image
              style={styles.avatar}
              source={{
                uri: 'https://satya.pl/serve_image.php?photo=Lukrecja_bae1734781188.png',
              }}
              alt="User avatar"
            />
            <Text>
              {unreadCount > 0
                ? `${unreadCount} unread message(s)`
                : 'No unread messages'}
            </Text>
          </TouchableOpacity>
          {showDropdown && (
            <View style={styles.messageDropdown}>
              <View style={styles.unreadMessages}>
                <View style={styles.searchUser}>
                  <View style={styles.searchUserInner}>
                    <TextInput
                      style={styles.userSearch}
                      id="user-search"
                      placeholder="Search username or email..."
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                    <FontAwesome name="search" size={20} color="black" style={styles.searchIcon} />
                  </View>
                  <View id="search-results" style={styles.searchResults}></View>
                </View>

                <ScrollView style={styles.unreadInnerDiv} id="unread-conversations">
                  {/* Display conversations from search results or unread conversations */}
                  {displayedConversations.map((conversation) => {
                    let lastMessage = conversation.last_message || 'No messages yet';
                    lastMessage = truncateHTML(lastMessage, 30);

                    const lastParticipant = conversation.participants?.[0] || {};
                    const photoUrl = lastParticipant.photo?.startsWith('https://')
                      ? lastParticipant.photo
                      : `https://satya.pl/serve_image.php?photo=${
                          lastParticipant.photo || 'default.jpg'
                        }`;

                    const userId = lastParticipant.user_id;
                    const username = lastParticipant.username;
                    const userPhoto = lastParticipant.photo;

                    return (
                      <TouchableOpacity
                        key={`conv-${userId}-${conversation.conversation_id || Date.now()}`}
                        style={styles.unreadMessage}
                        data-user-id={userId}
                        data-user-photo={userPhoto}
                        onPress={() => openMessagingPopup(userId, username, userPhoto)}
                      >
                        <View style={styles.msgCol1}>
                          <View style={styles.msgPhoto}>
                            <Image source={{ uri: photoUrl }} alt={username} style={styles.avatarSmall} />
                          </View>
                        </View>
                        <View style={styles.msgColRight}>
                          <View style={styles.msgContent}>
                            <Text style={styles.conversationUsername}>{username}</Text>
                            <Text style={styles.lastMessage} dangerouslySetInnerHTML={{ __html: lastMessage }} />
                          </View>
                          {conversation.unread_count > 0 && (
                            <View style={styles.unreadCount}>
                              <Text>{conversation.unread_count}</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  {/* Display new users from search */}
                  {displayedNewUsers.map((user) => (
                    <TouchableOpacity
                      key={`new-${user.user_id}`}
                      style={styles.unreadMessage}
                      data-user-id={user.user_id}
                      data-user-photo={user.photo}
                      onPress={() => openMessagingPopup(user.user_id, user.username, user.photo)}
                    >
                      <View style={styles.msgCol1}>
                        <View style={styles.msgPhoto}>
                          <Image
                            source={{
                              uri: user.photo.startsWith('https://')
                                ? user.photo
                                : `https://satya.pl/serve_image.php?photo=${user.photo || 'default.jpg'}`,
                            }}
                            alt={user.username}
                            style={styles.avatarSmall}
                          />
                        </View>
                      </View>
                      <View style={styles.msgColRight}>
                        <View style={styles.msgContent}>
                          <Text style={styles.conversationUsername}>{user.username}</Text>
                          <Text style={styles.lastMessage}>No conversation yet</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}
        </View>
        {showDropdown && (
          <View style={styles.messagingPopupWrapper}>
            {conversations.map((conv) => (
              <ConversationTab
                key={conv.conversation_id}
                conversationId={conv.conversation_id}
                username={conv.recipient_username || conv.username}
                userPhoto={conv.recipient_photo || conv.user_photo}
                currentUserId={currentUserId}
                onClose={closeConversation}
              />
            ))}
          </View>
        )}
      </View>

      {notification.message && (
        <Notification message={notification.message} type={notification.type} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  messageCenter: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messageDropdownWrapper: {
    // Add styles here if needed
  },
  conversationsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.secondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.messaging,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: theme.spacing.sm,
  },
  avatarSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  messageDropdown: {
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.sm,
    borderColor: theme.colors.border.messaging,
    borderWidth: 1,
    borderRadius: theme.borderRadius.external,
    ...theme.shadows.secondary,
  },
  unreadMessages: {
    // Add styles here if needed
  },
  searchUser: {
    // Add styles here if needed
  },
  searchUserInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderColor: theme.colors.border.messaging,
    borderWidth: 1,
    borderRadius: theme.borderRadius.external,
  },
  userSearch: {
    flex: 1,
    height: 40,
    padding: theme.spacing.sm,
  },
  searchIcon: {
    marginLeft: theme.spacing.sm,
  },
  searchResults: {
    // Add styles here if needed
  },
  unreadInnerDiv: {
    height: 300, // Adjust height as needed
  },
  unreadMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.messaging,
  },
  msgCol1: {
    // Add styles here if needed
  },
  msgPhoto: {
    // Add styles here if needed
  },
  msgColRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  msgContent: {
    // Add styles here if needed
  },
  conversationUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.dark,
  },
  lastMessage: {
    fontSize: 14,
    color: theme.colors.text.gray,
  },
  unreadCount: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.secondary,
    padding: theme.spacing.xs,
    borderRadius: 10,
  },
  messagingPopupWrapper: {
    // Add styles here if needed
  },
});


export default MessageCenter;