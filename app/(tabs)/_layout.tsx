// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  return (
    <View style={styles.tabContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        // Get icon name based on route
        const getIconName = (routeName: string, focused: boolean) => {
          switch (routeName) {
            case 'index':
            case 'home':
              return focused ? 'home' : 'home-outline';
            case 'search':
              return focused ? 'search' : 'search-outline';
            case 'create':
              return focused ? 'add-circle' : 'add-circle-outline';
            case 'profile':
              return focused ? 'person' : 'person-outline';
            case 'settings':
              return focused ? 'settings' : 'settings-outline';
            default:
              return 'home-outline';
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabButton}
          >
            <Ionicons
              name={getIconName(route.name, isFocused)}
              size={24}
              color={isFocused ? '#000' : '#666'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#f0f0f0',
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: '#000',
        },
        headerTitle: 'Satya',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    height: 56,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});