import { useAuth } from '../../contexts/AuthContext';
import { View, Text, Button } from 'react-native';

export default function Profile() {
  const { user, signOut } = useAuth();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Email: {user?.email}</Text>
      <Button title="Logout" onPress={signOut} />
    </View>
  );
}
