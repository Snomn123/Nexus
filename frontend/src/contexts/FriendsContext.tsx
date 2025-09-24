import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Friend, FriendRequest, FriendsContextType, ApiResponse } from '../types';
import { useAuth } from './AuthContext';
import { friendsAPI } from '../services/api';

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

interface FriendsProviderProps {
  children: ReactNode;
}

export const FriendsProvider: React.FC<FriendsProviderProps> = ({ children }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();

  // Load friends and requests when user logs in
  useEffect(() => {
    if (user) {
      refreshFriends();
      refreshFriendRequests();
    } else {
      // Clear data when user logs out
      setFriends([]);
      setFriendRequests([]);
      setOnlineUsers([]);
    }
  }, [user]);

  const refreshFriends = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await friendsAPI.getFriends();
      if (response.data) {
        setFriends(response.data);
      }
    } catch (err: any) {
      console.error('Error loading friends:', err);
      setError(err.response?.data?.message || 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const refreshFriendRequests = async () => {
    if (!user) return;
    
    try {
      const response = await friendsAPI.getFriendRequests();
      if (response.data) {
        setFriendRequests(response.data);
      }
    } catch (err: any) {
      console.error('Error loading friend requests:', err);
      setError(err.response?.data?.message || 'Failed to load friend requests');
    }
  };

  const sendFriendRequest = async (username: string) => {
    try {
      setError('');
      const response = await friendsAPI.sendFriendRequest(username);
      
      if (response.message) {
        // Show success message or handle it in UI
        console.log('Friend request sent:', response.message);
      }
      
      // Refresh requests to show the new pending request
      await refreshFriendRequests();
    } catch (err: any) {
      console.error('Error sending friend request:', err);
      setError(err.response?.data?.message || 'Failed to send friend request');
      throw err;
    }
  };

  const acceptFriendRequest = async (requestId: number) => {
    try {
      setError('');
      await friendsAPI.acceptFriendRequest(requestId);
      
      // Refresh both friends and requests
      await refreshFriends();
      await refreshFriendRequests();
    } catch (err: any) {
      console.error('Error accepting friend request:', err);
      setError(err.response?.data?.message || 'Failed to accept friend request');
      throw err;
    }
  };

  const declineFriendRequest = async (requestId: number) => {
    try {
      setError('');
      await friendsAPI.declineFriendRequest(requestId);
      
      // Refresh requests
      await refreshFriendRequests();
    } catch (err: any) {
      console.error('Error declining friend request:', err);
      setError(err.response?.data?.message || 'Failed to decline friend request');
      throw err;
    }
  };

  const removeFriend = async (friendId: number) => {
    try {
      setError('');
      await friendsAPI.removeFriend(friendId);
      
      // Refresh friends list
      await refreshFriends();
    } catch (err: any) {
      console.error('Error removing friend:', err);
      setError(err.response?.data?.message || 'Failed to remove friend');
      throw err;
    }
  };

  const value: FriendsContextType = {
    friends,
    friendRequests,
    onlineUsers,
    loading,
    error,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    refreshFriends,
    refreshFriendRequests,
  };

  return (
    <FriendsContext.Provider value={value}>
      {children}
    </FriendsContext.Provider>
  );
};

export const useFriends = (): FriendsContextType => {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
};

export default FriendsContext;