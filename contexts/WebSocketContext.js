import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext();

export function useWebSocket() { return useContext(WebSocketContext); }

export function WebSocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadConversations, setUnreadConversations] = useState([]);
  const [allConversations, setAllConversations] = useState([]); // NEW: For all conversations
  const [currentUserId, setCurrentUserId] = useState(null);

  console.log("[WebSocketProvider] user:", user);

  useEffect(() => {
    if (!user?.uid) return;
    const socketInstance = io('wss://satya.pl:3001', {
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      setCurrentUserId(user.uid);
      socketInstance.emit('register_user', user.uid);
    });
    
    socketInstance.on('disconnect', () => setConnected(false));
    
    socketInstance.on('unreadCount', (response) => setUnreadCount(response.unreadCount));
    
    socketInstance.on('unreadConversations', (response) =>
      setUnreadConversations(response.conversations));
    
    // NEW: Listen for all conversations
    socketInstance.on('allConversations', (response) => 
      setAllConversations(response.conversations));
    
    setSocket(socketInstance);
    return () => { socketInstance.disconnect(); };
  }, [user]);

  const updateNotifications = () => {
    console.log(currentUserId);
    if (socket && currentUserId) socket.emit('getUnreadCount', currentUserId);
  };
  
  const loadUnreadConversations = () => {
    if (socket && currentUserId) socket.emit('getUnreadConversations', currentUserId);
  };
  
  // NEW: Load all conversations
  const loadAllConversations = () => {
    if (socket && currentUserId) socket.emit('getAllConversations', currentUserId);
  };
  
  const getOtherParticipantId = (conversationId) => {
    return new Promise((resolve, reject) => {
      if (!socket || !currentUserId) return reject('Socket not connected or user ID not set');
      socket.emit('getConversationParticipants', { conversation_id: conversationId });
      socket.once('conversationParticipants', (response) => {
        if (response.success) {
          const otherId = response.participants.find((p) => p !== currentUserId);
          resolve(otherId);
        } else {
          reject('Failed to get participants');
        }
      });
    });
  };

  useEffect(() => {
    if (connected && currentUserId) {
      updateNotifications();
      const interval = setInterval(updateNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [connected, currentUserId]);

  const value = {
    socket, connected, currentUserId,
    unreadCount, unreadConversations, allConversations, // NEW: Added allConversations
    updateNotifications, loadUnreadConversations, loadAllConversations, // NEW: Added loadAllConversations
    getOtherParticipantId,
    emit: (event, data) => socket?.emit(event, data)
  };

  console.log('[WebSocketProvider] Provided values:', {
    currentUserId,
    socket: !!socket,
    unreadCount,
    unreadConversations: unreadConversations.length,
    allConversations: allConversations.length // NEW: Log all conversations count
  });
  
  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}