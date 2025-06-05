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
import theme from '../theme/theme';

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
    if (currentUserId && socket) {
      console.log('Calling loadUnreadConversations!', currentUserId); // <--- add this
      loadUnreadConversations();
    }
  }, [currentUserId, socket]);
  
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

  // Changed from onChange to onChangeText for React Native
  const handleSearch = (text) => {
    const query = text.trim();
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
    console.log('Socket ready:', socket && socket.connected);
    console.log('User:', userId, username);
    
    // Log the data before sending
    console.log('Sending data to create conversation:', {
        currentUserId,
        userId,
    });
    
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
            />
            <Text style={styles.conversationsBtnText}>
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
                      placeholder="Search username or email..."
                      value={searchTerm}
                      onChangeText={handleSearch}
                      placeholderTextColor={theme.colors.text.gray3}
                    />
                    <FontAwesome 
                      name="search" 
                      size={20} 
                      color={theme.colors.text.gray2}
                      style={styles.searchIcon} 
                    />
                  </View>
                </View>

                <ScrollView 
                  style={styles.unreadInnerDiv}
                  showsVerticalScrollIndicator={true}
                  persistentScrollbar={true}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Display conversations from search results or unread conversations */}
                  {displayedConversations.map((conversation) => {
                    console.log(conversation);
                    let lastMessage = conversation.last_message || 'No messages yet';
                    lastMessage = truncateHTML(lastMessage, 30);

                    // const lastParticipant = conversation.participants?.[0] || {};
                    // const photoUrl = lastParticipant.photo?.startsWith('https://')
                    //   ? lastParticipant.photo
                    //   : `https://satya.pl/serve_image.php?photo=${
                    //       lastParticipant.photo || 'default.jpg'
                    //     }`;

                    // const userId = lastParticipant.user_id;
                    // const username = lastParticipant.username;
                    // const userPhoto = lastParticipant.photo;

                                       
                    const photoUrl = conversation.last_sender_photo?.startsWith('https://')
                      ? conversation.last_sender_photo
                      : `https://satya.pl/serve_image.php?photo=${
                          conversation.last_sender_photo || 'default.jpg'
                        }`;

                    const userId = conversation.last_sender_id;
                    const username = conversation.last_sender_username;
                    const userPhoto = conversation.last_sender_photo;

                    return (
                      <TouchableOpacity
                        key={`conv-${userId}-${conversation.conversation_id || Date.now()}`}
                        style={styles.unreadMessage}
                        onPress={() => openMessagingPopup(userId, username, userPhoto)}
                      >
                        <View style={styles.msgCol1}>
                          <View style={styles.msgPhoto}>
                            <Image 
                              source={{ uri: photoUrl }} 
                              style={styles.avatarSmall} 
                            />
                          </View>
                        </View>
                        <View style={styles.msgColRight}>
                          <View style={styles.msgContent}>
                            <Text style={styles.conversationUsername}>{username}</Text>
                            <Text style={styles.lastMessage} numberOfLines={2}>
                              {lastMessage.replace(/<[^>]*>/g, '')} {/* Strip HTML tags */}
                            </Text>
                          </View>
                          {conversation.unread_count > 0 && (
                            <View style={styles.unreadCountBadge}>
                              <Text style={styles.unreadCountText}>
                                {conversation.unread_count}
                              </Text>
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
    width: '95%',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  messagesContainer: {
    flex: 1,
  },
  messageDropdownWrapper: {
    position: 'relative',
  },
  conversationsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.secondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
    elevation: theme.elevation.xs, // Added subtle elevation
  },
  conversationsBtnText: {
    fontSize: 16,
    color: theme.colors.text.dark,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: theme.spacing.md,
  },
  avatarSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  messageDropdown: {
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.md,
    borderColor: theme.colors.border.primary,
    borderWidth: 1,
    borderRadius: theme.borderRadius.external2,
    elevation: theme.elevation.lg, // Prominent dropdown shadow
    marginTop: theme.spacing.xs,
  },
  unreadMessages: {
  },
  searchUser: {
    marginBottom: theme.spacing.md,
  },
  searchUserInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderColor: theme.colors.border.primary,
    borderWidth: 1,
    borderRadius: theme.borderRadius.external2,
    backgroundColor: theme.colors.background.gray,
    elevation: theme.elevation.xs, // Subtle elevation for search input
  },
  userSearch: {
    flex: 1,
    height: 40,
    paddingHorizontal: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text.dark,
  },
  searchIcon: {
    marginLeft: theme.spacing.sm,
  },
  unreadInnerDiv: {
    maxHeight: 300,
    backgroundColor: theme.colors.secondary,
  },
  unreadMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
    backgroundColor: theme.colors.secondary,
    elevation: theme.elevation.xs, // Light elevation for each message item
    marginVertical: 1, // Small margin to show elevation
    borderRadius: theme.borderRadius.external2,
  },
  msgCol1: {
    marginRight: theme.spacing.md,
  },
  msgPhoto: {
    // Photo container
  },
  msgColRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  msgContent: {
    flex: 1,
  },
  conversationUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.dark,
    marginBottom: theme.spacing.xs,
  },
  lastMessage: {
    fontSize: 14,
    color: theme.colors.text.gray2,
  },
  unreadCountBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.button / 2,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: theme.elevation.sm, // Badge elevation
  },
  unreadCountText: {
    color: theme.colors.secondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  messagingPopupWrapper: {
    // Container for conversation tabs
  },
});

export default MessageCenter;
