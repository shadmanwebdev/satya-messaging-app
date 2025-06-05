import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { WebSocketProvider } from '../contexts/WebSocketContext';
import Login from './login';
import { Slot } from 'expo-router';

function AuthGate() {
  const { user } = useAuth();
  if (!user) return <Login />;
  return (
    <WebSocketProvider>
      <Slot />
    </WebSocketProvider>
  );
}

export default function AppLayout() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
