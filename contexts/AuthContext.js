import React, { createContext, useContext, useEffect, useState } from 'react';
import storage from '../utils/storage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const userData = await storage.getItem('userData');
      if (userData) setUser(JSON.parse(userData)); 
    })();
  }, []);

  const signIn = async (userObj, token) => {
    await storage.setItem('userToken', token);
    await storage.setItem('userData', JSON.stringify(userObj));
    setUser(userObj);
  };

  const signOut = async () => {
    await storage.removeItem('userToken');
    await storage.removeItem('userData');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() { return useContext(AuthContext); }
