import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeSocket } from './socket/socketService';
import ConversationsListScreen from './screens/ConversationsListScreen';
import ConversationScreen from './screens/ConversationScreen';

const Stack = createStackNavigator();

export default function App() {
    const [isReady, setIsReady] = useState(false);
    const [userId, setUserId] = useState(null);
    
    useEffect(() => {
        const setupApp = async () => {
            // Get user ID from storage
            const storedUserId = await AsyncStorage.getItem('userId');
            
            if (storedUserId) {
                setUserId(storedUserId);
                // Initialize socket connection
                initializeSocket('https://satya.pl:3001', storedUserId);
                setIsReady(true);
            } else {
                // Handle user not logged in scenario
                // Redirect to login screen, etc.
            }
        };
        
        setupApp();
    }, []);
    
    if (!isReady) {
        return null; // Or a loading screen
    }
    
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen 
                    name="ConversationsList" 
                    component={ConversationsListScreen} 
                    options={{ title: 'Messages' }}
                />
                <Stack.Screen 
                    name="Conversation" 
                    component={ConversationScreen} 
                    options={({ route }) => ({ title: route.params.username })}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}