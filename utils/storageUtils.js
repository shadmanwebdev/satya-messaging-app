import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveDateTimeToStorage = async (key, value) => {
    try {
        await AsyncStorage.setItem(key, value);
    } catch (error) {
        console.error('Error saving to storage:', error);
    }
};

export const getFromStorage = async (key) => {
    try {
        return await AsyncStorage.getItem(key);
    } catch (error) {
        console.error('Error retrieving from storage:', error);
        return null;
    }
};

export const removeFromStorage = async (key) => {
    try {
        await AsyncStorage.removeItem(key);
    } catch (error) {
        console.error('Error removing from storage:', error);
    }
};

export const checkStorage = async (key) => {
    try {
        const value = await AsyncStorage.getItem(key);
        return value !== null;
    } catch (error) {
        console.error('Error checking storage:', error);
        return false;
    }
};