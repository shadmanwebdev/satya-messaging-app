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
                      placeholder="Search username or email..."
                      value={searchTerm}
                      onChangeText={handleSearch} // Changed from onChange
                      placeholderTextColor="#999"
                    />
                    <FontAwesome 
                      name="search" 
                      size={20} 
                      color="#666" 
                      style={styles.searchIcon} 
                    />
                  </View>
                </View>

                {/* Using React Native ScrollView with proper styling */}
                <ScrollView 
                  style={styles.unreadInnerDiv}
                  showsVerticalScrollIndicator={true}
                  persistentScrollbar={true}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                >
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
                            {/* Note: dangerouslySetInnerHTML doesn't exist in React Native */}
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
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
  },
  avatarSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  messageDropdown: {
    backgroundColor: '#fff',
    padding: 12,
    borderColor: '#e1e1e1',
    borderWidth: 1,
    borderRadius: 8,
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  unreadMessages: {
    // Container for messages
  },
  searchUser: {
    marginBottom: 12,
  },
  searchUserInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderColor: '#e1e1e1',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  userSearch: {
    flex: 1,
    height: 40,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  searchIcon: {
    marginLeft: 8,
  },
  unreadInnerDiv: {
    maxHeight: 300, // Set max height for ScrollView
    backgroundColor: '#fff',
  },
  unreadMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  msgCol1: {
    marginRight: 12,
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
    color: '#333',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  unreadCountBadge: {
    backgroundColor: '#007bff',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messagingPopupWrapper: {
    // Container for conversation tabs
  },
});

export default MessageCenter;
