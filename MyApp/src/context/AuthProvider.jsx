import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const authUserData = await AsyncStorage.getItem("authUserData");
      if (authUserData) {
        setAuthUser(JSON.parse(authUserData));
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAuthUser = async (userData) => {
    try {
      if (userData) {
        await AsyncStorage.setItem("authUserData", JSON.stringify(userData));
      } else {
        await AsyncStorage.removeItem("authUserData");
      }
      setAuthUser(userData);
    } catch (error) {
      console.error('Error updating auth data:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("authUserData");
      setAuthUser(undefined);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value = {
    authUser,
    setAuthUser: updateAuthUser,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;