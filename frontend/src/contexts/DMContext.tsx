import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { DirectMessage, DMConversation, DMContextType, ApiResponse } from '../types';
import { useAuth } from './AuthContext';
import api from '../services/api';

const DMContext = createContext<DMContextType | undefined>(undefined);

interface DMProviderProps {
  children: ReactNode;
  onSwitchToDMs?: () => void;
}

export const DMProvider: React.FC<DMProviderProps> = ({ children, onSwitchToDMs }) => {
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [activeConversation, setActiveConversationState] = useState<DMConversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();

  const refreshConversations = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await api.get<ApiResponse<DMConversation[]>>('/dm/conversations');
      if (response.data.data) {
        console.log('Loaded conversations with unread counts:', response.data.data.map(conv => ({ id: conv.id, unread: conv.unread_count })));
        setConversations(response.data.data);
      } else {
        // Handle case where data is null/undefined but response is successful
        setConversations([]);
      }
    } catch (err: any) {
      // Only show error for actual failures, not empty results
      if (err.response?.status !== 200) {
        setError(err.response?.data?.message || 'Failed to load conversations');
      } else {
        setConversations([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshMessages = useCallback(async (conversationId: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await api.get<ApiResponse<DirectMessage[]>>(`/dm/conversations/${conversationId}/messages`);
      if (response.data.data) {
        setMessages(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load conversations when user logs in
  useEffect(() => {
    if (user) {
      refreshConversations();
    } else {
      // Clear data when user logs out
      setConversations([]);
      setActiveConversationState(null);
      setMessages([]);
    }
  }, [user, refreshConversations]);

  // Auto-clear unread badges when conversations are loaded (handles refresh case)
  useEffect(() => {
    if (conversations.length > 0 && activeConversation) {
      const currentConv = conversations.find(c => c.id === activeConversation.id);
      if (currentConv && currentConv.unread_count > 0) {
        console.log('Auto-clearing unread badge on refresh for active conversation:', currentConv.id);
        markMessagesAsRead(currentConv.id);
      }
    }
  }, [conversations, activeConversation]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      refreshMessages(activeConversation.id);
    } else {
      setMessages([]);
    }
  }, [activeConversation, refreshMessages]);

  const setActiveConversation = (conversation: DMConversation | null) => {
    setActiveConversationState(conversation);
    
    // Mark messages as read when opening a conversation
    if (conversation && conversation.unread_count > 0) {
      console.log('Marking conversation as read:', conversation.id, 'with unread count:', conversation.unread_count);
      markMessagesAsRead(conversation.id);
    }
  };

  const sendDirectMessage = async (receiverId: number, content: string, replyTo?: number) => {
    try {
      setError('');
      
      // If no active conversation with this user, start a new one
      let conversationId = activeConversation?.id;
      if (!conversationId || activeConversation?.participant_id !== receiverId) {
        const conversation = await startDirectConversation(receiverId);
        conversationId = conversation.id;
      }
      
      const response = await api.post<ApiResponse<DirectMessage>>('/dm/send', {
        receiver_id: receiverId,
        content,
        reply_to: replyTo,
        conversation_id: conversationId
      });
      
      if (response.data.data && conversationId) {
        // Add the new message to the current messages if it's for the active conversation
        if (activeConversation?.id === conversationId) {
          setMessages(prev => [...prev, response.data.data!]);
        }
        
        // Update the conversation in-place instead of refreshing entire list
        const newMessage = response.data.data;
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? {
                  ...conv,
                  last_message: newMessage,
                  updated_at: newMessage.created_at
                }
              : conv
          )
        );
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send message');
      throw err;
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      // Immediately update UI to remove unread badge
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );

      // Then make the API call
      await api.post(`/dm/conversations/${conversationId}/read`);
    } catch (err: any) {
      console.error('Failed to mark messages as read:', err);
      // If API call fails, we might want to revert the UI change
      // but for now, keep the optimistic update since the user has seen the messages
    }
  };

  const startDirectConversation = async (userId: number): Promise<DMConversation> => {
    try {
      setError('');
      
      // First, check if conversation already exists in our list
      const existingConversation = conversations.find(conv => conv.participant_id === userId);
      if (existingConversation) {
        // Set as active conversation and switch view
        setActiveConversationState(existingConversation);
        if (onSwitchToDMs) {
          onSwitchToDMs();
        }
        return existingConversation;
      }
      
      const response = await api.post<ApiResponse<DMConversation>>('/dm/conversations', {
        participant_id: userId
      });
      
      if (response.data.data) {
        const newConversation = response.data.data;
        
        // Add to conversations if not already there
        setConversations(prev => {
          const existing = prev.find(conv => conv.id === newConversation.id);
          if (existing) {
            // Update existing conversation with fresh data
            return prev.map(conv => 
              conv.id === newConversation.id ? newConversation : conv
            );
          }
          return [newConversation, ...prev];
        });
        
        // Set as active conversation
        setActiveConversationState(newConversation);
        
        // Switch to DMs view if callback is provided
        if (onSwitchToDMs) {
          onSwitchToDMs();
        }
        
        return newConversation;
      }
      
      throw new Error('No conversation data received');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start conversation');
      throw err;
    }
  };

  // Manual function to clear all unread badges (can be called from dev tools or as a failsafe)
  const clearAllUnreadBadges = () => {
    console.log('Manually clearing all unread badges');
    setConversations(prev => 
      prev.map(conv => ({ ...conv, unread_count: 0 }))
    );
  };

  // Force clear all unread badges (for debugging persistent badges)
  const forceClearAllUnread = async () => {
    console.log('Force clearing all unread badges - before:', conversations.map(c => ({ id: c.id, unread: c.unread_count })));
    
    // Clear locally first
    setConversations(prev => 
      prev.map(conv => ({ ...conv, unread_count: 0 }))
    );
    
    // Try to clear on backend for all conversations
    for (const conversation of conversations) {
      if (conversation.unread_count > 0) {
        try {
          await api.post(`/dm/conversations/${conversation.id}/read`);
          console.log('Successfully cleared unread for conversation:', conversation.id);
        } catch (error) {
          console.warn('Failed to clear unread on backend for conversation:', conversation.id, error);
        }
      }
    }
    
    console.log('Force clear completed');
  };

  // Make debug functions available on window for debugging
  if (typeof window !== 'undefined') {
    (window as any).clearAllUnreadBadges = clearAllUnreadBadges;
    (window as any).forceClearAllUnread = forceClearAllUnread;
    (window as any).dmForceRefresh = refreshConversations;
  }

  const hideConversation = (conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
  };

  const value: DMContextType = {
    conversations,
    activeConversation,
    messages,
    loading,
    error,
    setActiveConversation,
    sendDirectMessage,
    markMessagesAsRead,
    refreshConversations,
    refreshMessages,
    startDirectConversation,
    hideConversation,
  };

  return (
    <DMContext.Provider value={value}>
      {children}
    </DMContext.Provider>
  );
};

export const useDM = (): DMContextType => {
  const context = useContext(DMContext);
  if (context === undefined) {
    throw new Error('useDM must be used within a DMProvider');
  }
  return context;
};

export default DMContext;