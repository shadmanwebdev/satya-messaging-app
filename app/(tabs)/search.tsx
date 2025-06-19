// app/(tabs)/search.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWebSocket } from '../../contexts/WebSocketContext';
import ConversationTab from '../../components/ConversationTab';
import Notification from '../../components/Notification';

// Define types for better TypeScript support
interface User {
  user_id: string;
  username: string;
  photo?: string;
}

interface Conversation {
  conversation_id: string;
  user_id: string;
  username: string;
  photo?: string;
  last_message?: string;
  unread_count?: number;
}

interface SearchResults {
  conversations: Conversation[];
  newUsers: User[];
}

interface ActiveConversation {
  conversation_id: string;
  recipient_username?: string;
  username?: string;
  recipient_photo?: string;
  user_photo?: string;
}

interface NotificationState {
  message: string;
  type: string;
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResults>({ conversations: [], newUsers: [] });
  const [activeConversation, setActiveConversation] = useState<ActiveConversation | null>(null);
  const [notification, setNotification] = useState<NotificationState>({ message: '', type: '' });
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const {
    socket,
    currentUserId,
  } = useWebSocket();

  useEffect(() => {
    if (socket) {
      // Listen for conversation creation
      const conversationCreatedHandler = (response: any) => {
        console.log('Conversation created response:', response);
        if (response.success) {
          // Open the conversation directly
          setActiveConversation(response);
        } else {
          showNotification('Failed to load conversation', 'error');
        }
      };

      // Listen for search results
      const searchResultsHandler = (response: any) => {
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

  const handleSearch = (text: string) => {
    const query = text.trim();
    setSearchQuery(query);

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
      // If search field is cleared, reset search results
      setSearchResults({ conversations: [], newUsers: [] });
    }
  };

  const openMessagingPopup = (userId: string, username: string, userPhoto?: string) => {
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

  const closeConversation = () => {
    setActiveConversation(null);
  };

  const handleConversationClose = (conversationId?: string) => {
    // This is for the ConversationTab component's onClose prop
    setActiveConversation(null);
  };

  const handleMinimize = (conversationId?: string) => {
    // For search page, we don't need minimize functionality
    // But we need to provide this prop to satisfy the component requirements
    console.log('Minimize not implemented in search page');
  };

  const showNotification = (message: string, type: string) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  };

  // Render conversation view
  if (activeConversation) {
    return (
      <View style={styles.screenContainer}>
        <View style={styles.conversationHeader}>
          <TouchableOpacity style={styles.backButton} onPress={closeConversation}>
            <Ionicons name="arrow-back" size={24} color="#000" />
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
            userPhoto={activeConversation.recipient_photo || activeConversation.user_photo || 'default.jpg'}
            currentUserId={currentUserId}
            onClose={handleConversationClose}
            onMinimize={handleMinimize}
            hideHeader={true}
          />
        </View>

        {notification.message && (
          <Notification message={notification.message} type={notification.type} />
        )}
      </View>
    );
  }

  // Render search view (default)
  return (
    <View style={styles.screenContainer}>
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#666"
          />
        </View>
      </View>

      <ScrollView style={styles.searchContent}>
        {/* Show search results when searching */}
        {searchQuery.length >= 3 && (
          <>
            {/* Display existing conversations from search */}
            {searchResults.conversations.map((conversation) => {
              const userId = conversation.user_id;
              const username = conversation.username;
              const userPhoto = conversation.photo;

              const photoUrl = (userPhoto && userPhoto.startsWith('https://'))
                ? userPhoto
                : `https://satya.pl/serve_image.php?photo=${userPhoto || 'default.jpg'}`;

              return (
                <TouchableOpacity
                  key={`conv-${userId}-${conversation.conversation_id || Date.now()}`}
                  style={styles.userItem}
                  onPress={() => openMessagingPopup(userId, username, userPhoto)}
                >
                  <View style={styles.userPhoto}>
                    <Image 
                      source={{ uri: photoUrl }} 
                      style={styles.avatar} 
                    />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.username}>{username}</Text>
                    <Text style={styles.userSubtext}>Existing conversation</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Display new users from search */}
            {searchResults.newUsers.map((user) => (
              <TouchableOpacity
                key={`new-${user.user_id}`}
                style={styles.userItem}
                onPress={() => openMessagingPopup(user.user_id, user.username, user.photo)}
              >
                <View style={styles.userPhoto}>
                  <Image
                    source={{
                      uri: user.photo?.startsWith('https://')
                        ? user.photo
                        : `https://satya.pl/serve_image.php?photo=${user.photo || 'default.jpg'}`,
                    }}
                    style={styles.avatar}
                  />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.username}>{user.username}</Text>
                  <Text style={styles.userSubtext}>Start new conversation</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Show message when no results found */}
            {searchResults.conversations.length === 0 && searchResults.newUsers.length === 0 && (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No users found matching "{searchQuery}"</Text>
              </View>
            )}
          </>
        )}

        {/* Show trending when not searching */}
        {searchQuery.length < 3 && (
          <>
            <Text style={styles.sectionTitle}>Trending</Text>
            <View style={styles.trendingGrid}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <View key={i} style={styles.trendingItem}>
                  <Text style={styles.trendingText}>#{`trending${i}`}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {notification.message && (
        <Notification message={notification.message} type={notification.type} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  searchHeader: {
    padding: 16,
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
  searchContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  trendingItem: {
    width: '50%',
    padding: 8,
  },
  trendingText: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
  },
  // User search result styles
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userPhoto: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  userSubtext: {
    fontSize: 14,
    color: '#666',
  },
  noResultsContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  // Conversation view styles
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  conversationAvatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 12,
  },
  conversationHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  conversationContainer: {
    flex: 1,
  },
});