import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function ConversationToggleCustom({ showUnreadOnly, onToggle, unreadCount, allCount }) {
  console.log('🔍 Toggle component rendered with showUnreadOnly:', showUnreadOnly);
  
  const handleToggle = () => {
    console.log('👆 Toggle pressed! Current state:', showUnreadOnly);
    console.log('📤 Calling onToggle with:', !showUnreadOnly);
    
    if (onToggle) {
      onToggle(!showUnreadOnly);
    } else {
      console.log('❌ onToggle is not provided!');
    }
  };

  return (
    <View style={styles.toggleContainer}>
      <View style={styles.toggleContent}>
        <View style={styles.leftSection}>
          <Ionicons 
            name={showUnreadOnly ? "mail-unread" : "chatbubbles"} 
            size={20} 
            color="#333" 
          />
          <Text style={styles.toggleLabel}>
            {showUnreadOnly ? `Unread (${unreadCount || 0})` : `All conversations (${allCount || 0})`}
          </Text>
        </View>
        
        <View style={styles.rightSection}>
          <Text style={styles.switchLabel}>Unread</Text>
          
          <TouchableOpacity 
            style={[styles.customSwitch, showUnreadOnly && styles.customSwitchActive]}
            onPress={handleToggle}
            activeOpacity={0.7}
          >
            <View style={[styles.switchThumb, showUnreadOnly && styles.switchThumbActive]} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toggleContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 12,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  customSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e3e3e3',
    padding: 2,
    justifyContent: 'center',
  },
  customSwitchActive: {
    backgroundColor: 'rgba(0,79,66,1.00)',
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    alignSelf: 'flex-start',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
});

export default ConversationToggleCustom;