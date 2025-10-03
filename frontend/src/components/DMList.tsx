import React from 'react';
import { useDM } from '../contexts/DMContext';
import { DMConversation } from '../types';
import { getAvatarColor } from '../utils/avatarColors';
import './DMList.css';

interface DMListProps {
  onSwitchToDMs?: () => void;
}

const DMList: React.FC<DMListProps> = ({ onSwitchToDMs }) => {
  const {
    conversations,
    activeConversation,
    loading,
    error,
    setActiveConversation,
    hideConversation
  } = useDM();

  const handleConversationSelect = (conversation: DMConversation) => {
    setActiveConversation(conversation);
    
    // Switch to DMs view if we're not already there (only when called from sidebar)
    if (onSwitchToDMs) {
      onSwitchToDMs();
    }
  };

  const handleCloseConversation = (conversationId: string) => {
    // If closing the active conversation, clear it
    if (activeConversation?.id === conversationId) {
      setActiveConversation(null);
    }
    // Remove conversation from local state (this is a local UI action)
    // In a real app, you might want to add this to a "hidden" list
    hideConversation(conversationId);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Less than a minute
    if (diff < 60000) {
      return 'now';
    }
    
    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m`;
    }
    
    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h`;
    }
    
    // Less than a week
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}d`;
    }
    
    // Show date
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#3ba55c';
      case 'away': return '#faa61a';
      case 'busy': return '#f04747';
      default: return '#747f8d';
    }
  };

  const truncateMessage = (message: string, maxLength: number = 50) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength).trim() + '...';
  };


  const renderConversation = (conversation: DMConversation) => {
    const isActive = activeConversation?.id === conversation.id;
    
    return (
      <div
        key={conversation.id}
        className={`dm-item ${isActive ? 'active' : ''}`}
        onClick={() => handleConversationSelect(conversation)}
      >
        <div className="dm-avatar">
          {conversation.participant_avatar_url ? (
            <img 
              src={conversation.participant_avatar_url} 
              alt={conversation.participant_username} 
            />
          ) : (
            <div 
              className="avatar-placeholder"
              style={{ backgroundColor: getAvatarColor(conversation.participant_username) }}
            >
              {conversation.participant_username.charAt(0).toUpperCase()}
            </div>
          )}
          <div 
            className="status-indicator" 
            style={{ backgroundColor: getStatusColor(conversation.participant_status) }}
          />
        </div>
        
        <div className="dm-content">
          <div className="dm-header">
            <span className="dm-username">
              {conversation.participant_username}
            </span>
            <span className="dm-timestamp">
              {conversation.last_message 
                ? formatTime(conversation.last_message.created_at)
                : 'New'
              }
            </span>
          </div>
          
          <div className="dm-preview">
            {conversation.last_message ? (
              <span className="last-message">
                {conversation.last_message.sender_username === conversation.participant_username 
                  ? '' 
                  : 'You: '
                }
                {truncateMessage(conversation.last_message.content)}
              </span>
            ) : (
              <span className="no-messages">No messages yet</span>
            )}
          </div>
        </div>
        
        {conversation.unread_count > 0 && (
          <div className="unread-badge">
            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
          </div>
        )}
        
        {/* Close button that appears on hover */}
        <button
          className={`dm-close-btn ${conversation.unread_count > 0 ? 'with-badge' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleCloseConversation(conversation.id);
          }}
          title="Close conversation"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dm-list loading">
        <div className="loading-text">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="dm-list">
      <div className="dm-list-body">
        {error && (
          <div className="mx-4 mb-4">
            <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-3">
              <div className="flex items-center text-red-400">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          </div>
        )}
        
        {conversations.length === 0 ? (
          <div className="dm-empty-state">
            <div className="empty-icon">
              <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="empty-title">No conversations yet</div>
            <div className="empty-subtitle">
              Start a conversation by clicking the message button on a friend's profile
            </div>
          </div>
        ) : (
          <div className="dm-conversations">
            {conversations.map(renderConversation)}
          </div>
        )}
      </div>
    </div>
  );
};

export default DMList;