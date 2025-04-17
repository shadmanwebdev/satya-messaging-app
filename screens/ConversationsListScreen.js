import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { getSocket } from '../socket/socketService';

const ConversationsListScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = getSocket();
  
  useEffect(() => {
    // Get conversations list
    socket.emit('get_conversations');
    
    // Listen for conversations list
    socket.on('conversations_list', (data) => {
      setConversations(data.conversations);
      setLoading(false);
    });
    
    return () => {
      socket.off('conversations_list');
    };
  }, []);
  
  const openConversation = (conversation) => {
    navigation.navigate('Conversation', {
      userId: conversation.user_id,
      username: conversation.username,
      userPhoto: conversation.user_photo,
      conversationId: conversation.conversation_id
    });
  };
  
  const renderConversationItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.conversationItem}
      onPress={() => openConversation(item)}
    >
      <Image 
        source={{ uri: item.user_photo.startsWith("https://") ? item.user_photo : `http://yourserver.com/serve_image.php?photo=${item.user_photo}` }}
        style={styles.avatar}
      />
      <View style={styles.conversationInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.last_message || 'Start a conversation'}
        </Text>
      </View>
      {item.unread_count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.unread_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.conversation_id.toString()}
        renderItem={renderConversationItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    list: {
        paddingVertical: 10,
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    conversationInfo: {
        flex: 1,
    },
    username: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 5,
    },
    lastMessage: {
        color: '#666',
        fontSize: 14,
    },
    badge: {
        backgroundColor: '#0084ff',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default ConversationsListScreen;