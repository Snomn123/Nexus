import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, handleApiError } from '../services/api';
import encryptionService from '../services/encryptionService';
import { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Check if user is already authenticated on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getCurrentUser() as any;
      if (response && (response.user || response.data?.user)) {
        const userData = response.user || response.data?.user;
        setUser(userData);
        
        // Store current user ID for DM encryption
        localStorage.setItem('currentUserId', String(userData.id));
        
        // Note: Encryption session will need to be restored when user provides password
        // This happens during login. For existing sessions, we can't restore encryption
        // without the user's password due to security requirements.
        console.log('User authenticated - encryption will be available after next login');
      }
    } catch (error: any) {
      // User is not authenticated, clear any existing state
      setUser(null);
      encryptionService.clearEncryption();
      localStorage.removeItem('currentUserId');
      console.log('No authenticated user found');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setError('');
      setLoading(true);
      
      const response = await authAPI.login({ email, password }) as any;
      
      if (response && (response.user || response.data?.user)) {
        const userData = response.user || response.data?.user;
        setUser(userData);
        
        // Initialize encryption service with user credentials
        try {
          await encryptionService.initializeEncryption(userData.id, password);
          console.log('Encryption initialized successfully');
          
          // Store current user ID for DM encryption
          localStorage.setItem('currentUserId', String(userData.id));
        } catch (encryptionError) {
          console.error('Failed to initialize encryption:', encryptionError);
          // Don't fail login if encryption initialization fails
        }
      }
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string): Promise<void> => {
    try {
      setError('');
      setLoading(true);
      
      const response = await authAPI.register({ username, email, password }) as any;
      
      if (response && (response.user || response.data?.user)) {
        setUser(response.user || response.data?.user);
      }
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setError('');
      await authAPI.logout();
      setUser(null);
      
      // Clear encryption state
      encryptionService.clearEncryption();
      localStorage.removeItem('currentUserId');
    } catch (error: any) {
      // Even if logout fails, clear user locally
      setUser(null);
      encryptionService.clearEncryption();
      localStorage.removeItem('currentUserId');
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;