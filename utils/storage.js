import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Polyfill for web
const webStorage = {
  async getItem(key) {
    return localStorage.getItem(key);
  },
  async setItem(key, value) {
    return localStorage.setItem(key, value);
  },
  async removeItem(key) {
    return localStorage.removeItem(key);
  },
};

const storage = Platform.OS === 'web' ? webStorage : {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

export default storage;
