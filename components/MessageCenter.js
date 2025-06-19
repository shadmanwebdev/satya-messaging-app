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
import ConversationToggleCustom from './ConversationToggleCustom'; // ✅ FIXED: Import from correct file
import { useWebSocket } from '../contexts/WebSocketContext';
import Notification from './Notification';
import { truncateHTML } from '../utils/messageUtils';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme/theme';

function MessageCenter() {
  const [activeConversation, setActiveConversation] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [searchResults, setSearchResults] = useState({ conversations: [], newUsers: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllConversations, setShowAllConversations] = useState(false); // NEW: Toggle state
  const searchTimeout = useRef(null);

  const {
    socket,
    currentUserId,
    unreadCount,
    unreadConversations,
    allConversations, // NEW: Get all conversations
    loadUnreadConversations,
    loadAllConversations, // NEW: Load all conversations function
  } = useWebSocket();
  
  useEffect(() => {
    if (currentUserId && socket) {
      console.log('🚀 Loading conversations for user:', currentUserId);
      loadUnreadConversations();
      loadAllConversations(); // NEW: Load all conversations on mount
    }
  }, [currentUserId, socket]);
  
  // Add debugging for conversation data
  useEffect(() => {
    console.log('📊 Conversation data updated:');
    console.log('- Unread conversations:', unreadConversations.length, unreadConversations);
    console.log('- All conversations:', allConversations.length, allConversations);
    console.log('- Show all toggle:', showAllConversations);
  }, [unreadConversations, allConversations, showAllConversations]);
  
  useEffect(() => {
    if (socket) {
      // Listen for conversation creation
      const conversationCreatedHandler = (response) => {
        console.log('Conversation created response:', response);
        if (response.success) {
          console.log('Successfully created/loaded conversation:', response.conversation_id);
          setActiveConversation(response);
        } else {
          console.error('Failed to load conversation:', response.error);
          showNotification(`Failed to load conversation: ${response.error || 'Unknown error'}`, 'error');
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
          console.error('Search failed:', response.error);
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

  const handleSearch = (text) => {
    const query = text.trim();
    setSearchTerm(query);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (query.length >= 3) {
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
      setSearchResults({ conversations: [], newUsers: [] });
      // Refresh current view
      if (showAllConversations) {
        loadAllConversations();
      } else {
        loadUnreadConversations();
      }
    }
  };

  // NEW: Handle toggle change
  const handleToggleChange = (showAll) => {
    setShowAllConversations(showAll);
    setSearchTerm(''); // Clear search when toggling
    setSearchResults({ conversations: [], newUsers: [] });
    
    // Load appropriate conversations
    if (showAll) {
      loadAllConversations();
    } else {
      loadUnreadConversations();
    }
  };

  const openMessagingPopup = (userId, username, userPhoto) => {
    console.log('Socket ready:', socket && socket.connected);
    console.log('Opening conversation with user:', { userId, username, userPhoto });
    
    // Log the data before sending
    console.log('Sending data to create conversation:', {
        current_user_id: currentUserId,
        recipient_id: userId,
        recipient_username: username,
        recipient_photo: userPhoto,
    });
    
    if (socket && currentUserId) {
      socket.emit('get_conversation', {
        current_user_id: currentUserId,
        recipient_id: userId,
        recipient_username: username,
        recipient_photo: userPhoto,
      });
    } else {
      console.error('Socket not connected or currentUserId missing:', { socket: !!socket, currentUserId });
      showNotification('Connection error. Please try again.', 'error');
    }
  };

  const closeConversation = () => {
    setActiveConversation(null);
    setSearchTerm('');
    setSearchResults({ conversations: [], newUsers: [] });
    
    // Refresh current view
    if (showAllConversations) {
      loadAllConversations();
    } else {
      loadUnreadConversations();
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  };

  // NEW: Get displayed conversations based on toggle and search
  const getDisplayedConversations = () => {
    if (searchTerm.length >= 3) {
      return searchResults.conversations;
    }
    return showAllConversations ? allConversations : unreadConversations;
  };

  const displayedConversations = getDisplayedConversations();
  const displayedNewUsers = searchTerm.length >= 3 ? searchResults.newUsers : [];

  // Render conversation view
  if (activeConversation) {
    return (
      <View style={styles.messageCenter}>
        <View style={styles.conversationHeader}>
          <TouchableOpacity style={styles.backButton} onPress={closeConversation}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.dark} />
          </TouchableOpacity>
          <Image
            style={styles.conversationAvatar}
            source={{
              uri: (activeConversation.recipient_photo || activeConversation.user_photo)?.startsWith('https://')
                ? (activeConversation.recipient_photo || activeConversation.user_photo)
                : `https://satya.pl/serve_image.php?photo=${activeConversation.recipient_photo || activeConversation.user_photo || 'default.jpg'}`,
            }}
          />
          <Text style={styles.conversationHeaderText}>
            {activeConversation.recipient_username || activeConversation.username}
          </Text>
        </View>
        
        <View style={styles.conversationContainer}>
          <ConversationTab
            conversationId={activeConversation.conversation_id}
            username={activeConversation.recipient_username || activeConversation.username}
            userPhoto={activeConversation.recipient_photo || activeConversation.user_photo}
            currentUserId={currentUserId}
            onClose={closeConversation}
            onMinimize={() => {}} // Required prop but not used in this context
            hideHeader={true}
          />
        </View>

        {notification.message && (
          <Notification message={notification.message} type={notification.type} />
        )}
      </View>
    );
  }

  // Render conversation list view (default)
  return (
    <View style={styles.messageCenter}>
      <View style={styles.messagesContainer}>
        
        {/* NEW: Add toggle component */}
        <ConversationToggleCustom
          showUnreadOnly={!showAllConversations} 
          onToggle={(newShowUnreadOnly) => {  
            handleToggleChange(!newShowUnreadOnly);
          }}
          unreadCount={unreadConversations.length}
          allCount={allConversations.length}
        />
        
        {/* Search header */}
        <View style={styles.searchHeader}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search username or email..."
              value={searchTerm}
              onChangeText={handleSearch}
              placeholderTextColor="#666"
            />
          </View>
        </View>
        
        <View style={styles.messagesList}>
          <ScrollView 
            style={styles.conversationsScrollView}
            showsVerticalScrollIndicator={true}
            persistentScrollbar={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* Display conversations */}
            {displayedConversations.map((conversation) => {
              console.log('🔍 Rendering conversation:', conversation);
              let lastMessage = conversation.last_message || 'No messages yet';
              lastMessage = truncateHTML(lastMessage, 30);

              const isSearchResult = searchTerm.length >= 3;
              
              let userId, username, userPhoto;
              if (isSearchResult) {
                // For search results - use the user we found
                userId = conversation.user_id;
                username = conversation.username;
                userPhoto = conversation.photo;
              } else {
                // For both unread and all conversations - use the OTHER participant
                // Try new field names first, fallback to old ones
                userId = conversation.other_user_id || conversation.last_sender_id;
                username = conversation.other_username || conversation.last_sender_username;
                userPhoto = conversation.other_photo || conversation.last_sender_photo;
              }

              // Debug: Check if we have valid data
              if (!userId || !username) {
                console.error('❌ Invalid conversation data:', {
                  conversation,
                  userId,
                  username,
                  userPhoto,
                  isSearchResult
                });
                return null; // Skip this conversation if data is invalid
              }

              console.log('✅ Valid conversation:', { userId, username, userPhoto });

              const photoUrl = (userPhoto && userPhoto.startsWith('https://'))
                ? userPhoto
                : `https://satya.pl/serve_image.php?photo=${userPhoto || 'default.jpg'}`;

              return (
                <TouchableOpacity
                  key={`conv-${userId}-${conversation.conversation_id || Date.now()}`}
                  style={styles.conversationItem}
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
                        {lastMessage.replace(/<[^>]*>/g, '')}
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
            }).filter(Boolean)} {/* Filter out null results */}

            {/* Display new users from search */}
            {displayedNewUsers.map((user) => (
              <TouchableOpacity
                key={`new-${user.user_id}`}
                style={styles.conversationItem}
                onPress={() => openMessagingPopup(user.user_id, user.username, user.photo)}
              >
                <View style={styles.msgCol1}>
                  <View style={styles.msgPhoto}>
                    <Image
                      source={{
                        uri: user.photo?.startsWith('https://')
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

            {/* Show message when no results found */}
            {searchTerm.length >= 3 && displayedConversations.length === 0 && displayedNewUsers.length === 0 && (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No users found matching "{searchTerm}"</Text>
              </View>
            )}

            {/* Show message when no conversations available */}
            {searchTerm.length < 3 && displayedConversations.length === 0 && (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>
                  {showAllConversations ? 'No conversations yet' : 'No unread messages'}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {notification.message && (
        <Notification message={notification.message} type={notification.type} />
      )}
    </View>
  );
}

// Styles remain the same as before
const styles = StyleSheet.create({
  messageCenter: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
  },
  messagesContainer: {
    flex: 1,
  },
  conversationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.secondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
    elevation: theme.elevation.xs,
  },
  conversationsHeaderText: {
    fontSize: 18,
    fontWeight: '600',
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
  searchHeader: {
    padding: 16,
    backgroundColor: theme.colors.secondary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  messagesList: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.md,
  },
  conversationsScrollView: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
    backgroundColor: theme.colors.secondary,
    elevation: theme.elevation.xs,
    marginVertical: 1,
    borderRadius: theme.borderRadius.external2,
  },
  msgCol1: {
    marginRight: theme.spacing.md,
  },
  msgPhoto: {},
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
    elevation: theme.elevation.sm,
  },
  unreadCountText: {
    color: theme.colors.secondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.secondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
    elevation: theme.elevation.xs,
  },
  backButton: {
    marginRight: theme.spacing.md,
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.external2,
  },
  conversationAvatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: theme.spacing.md,
  },
  conversationHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.dark,
  },
  conversationContainer: {
    flex: 1,
  },
  noResultsContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: theme.colors.text.gray2,
    textAlign: 'center',
  },
});

export default MessageCenter;