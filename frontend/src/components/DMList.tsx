import React from 'react';
import { useDM } from '../contexts/DMContext';
import { DMConversation } from '../types';
import { getAvatarColor } from '../utils/avatarColors';
import './DMList.css';


const DMList: React.FC = () => {
  const {
    conversations,
    activeConversation,
    loading,
    error,
    setActiveConversation
  } = useDM();

  const handleConversationSelect = (conversation: DMConversation) => {
    console.log('DMList: Selecting conversation', conversation.id, 'with unread count:', conversation.unread_count);
    setActiveConversation(conversation);
    
    // Additional logging for debugging
    if (conversation.unread_count > 0) {
      console.log('DMList: This conversation has unread messages that should be cleared');
    }
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
            {conversation.last_message && (
              <span className="dm-timestamp">
                {formatTime(conversation.last_message.created_at)}
              </span>
            )}
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
                <span className="mr-2">😔</span>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          </div>
        )}
        
        {conversations.length === 0 ? (
          <div className="dm-empty-state">
            <div className="empty-icon">💬</div>
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