// app/(tabs)/profile.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  user_id: number;
  username: string;
  fname: string;
  lname: string;
  email: string;
  phone: string;
  photo: string | null;
  bio: string;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      // Get the current user ID from AsyncStorage
      let userId = await AsyncStorage.getItem('userId');
      
      // For testing, use user ID 7 since we know it exists
      if (!userId) {
        userId = '7';
      }

      const apiUrl = `https://new.satya.pl:3001/api/profile/${userId}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const userData = await response.json();
      setProfile(userData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', `Failed to load profile data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getProfileImageUrl = (photoFilename: string | null) => {
    if (!photoFilename) return null;
    return `https://satya.pl/serve_image.php?photo=${photoFilename}`;
  };

  const getInitials = (fname: string, lname: string) => {
    return `${fname?.charAt(0) || ''}${lname?.charAt(0) || ''}`.toUpperCase();
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchUserProfile();
  };

  if (loading) {
    return (
      <View style={[styles.screenContainer, styles.centered]}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.screenContainer, styles.centered]}>
        <Text style={styles.errorText}>Failed to load profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}>
          {profile.photo ? (
            <Image 
              source={{ uri: getProfileImageUrl(profile.photo) }}
              style={styles.profileImage}
              onError={() => console.log('Failed to load profile image')}
            />
          ) : (
            <Text style={styles.profileAvatarText}>
              {getInitials(profile.fname, profile.lname)}
            </Text>
          )}
        </View>
        <Text style={styles.profileName}>
          {profile.fname} {profile.lname}
        </Text>
        <Text style={styles.profileUsername}>@{profile.username}</Text>
        {profile.bio && (
          <Text style={styles.profileBio}>{profile.bio.replace(/&nbsp;/g, ' ')}</Text>
        )}
      </View>

      <View style={styles.profileDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Email</Text>
          <Text style={styles.detailValue}>{profile.email}</Text>
        </View>
        
        {profile.phone && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>{profile.phone}</Text>
          </View>
        )}

      </View>

      {/* <View style={styles.profileStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View> */}

      {/* <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <Text style={styles.refreshButtonText}>Refresh Profile</Text>
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  profileAvatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 5,
  },
  profileUsername: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  profileBio: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  profileDetails: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  refreshButton: {
    backgroundColor: '#f0f0f0',
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});