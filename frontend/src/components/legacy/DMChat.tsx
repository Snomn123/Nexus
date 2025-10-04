import React, { useState, useRef, useEffect } from 'react';
import { useDM } from '../../contexts/DMContext';
import { useAuth } from '../../contexts/AuthContext';
import { DirectMessage } from '../../types';
import { getAvatarColor, getUsernameColor } from '../../utils/avatarColors';
import { dmAPI } from '../../services/api';
import './DMChat.css';


const DMChat: React.FC = () => {
  const { 
    activeConversation, 
    messages, 
    loading, 
    error, 
    sendDirectMessage,
    refreshMessages 
  } = useDM();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<DirectMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);


  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when conversation changes and clear reply
  useEffect(() => {
    if (activeConversation && inputRef.current) {
      inputRef.current.focus();
    }
    // Clear reply when switching conversations
    setReplyingTo(null);
  }, [activeConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const messageText = newMessage.trim();
    console.log('🟢 handleSendMessage called:', { messageText, activeConversation: activeConversation?.participant_username, sending });
    
    if (!messageText || !activeConversation || sending) {
      console.log('🔴 Message send blocked:', { hasMessage: !!messageText, hasConversation: !!activeConversation, sending });
      return;
    }
    
    try {
      setSending(true);
      console.log('📤 Sending message:', messageText);
      await sendDirectMessage(activeConversation.participant_id, messageText, replyingTo?.id);
      setNewMessage('');
      setReplyingTo(null); // Clear reply after sending
      
      // Keep focus on input after sending
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 10);
      
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  // Handle reply functionality
  const handleReply = (message: DirectMessage) => {
    setReplyingTo(message);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleMessageDeleted = (messageId: number) => {
    if (activeConversation) {
      refreshMessages(activeConversation.id);
    }
    // Clear reply if replying to deleted message
    if (replyingTo && replyingTo.id === messageId) {
      setReplyingTo(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === 'Escape' && replyingTo) {
      e.preventDefault();
      handleCancelReply();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const shouldShowDateSeparator = (currentMsg: DirectMessage, prevMsg: DirectMessage | null) => {
    if (!prevMsg) return true;
    
    const currentDate = new Date(currentMsg.created_at).toDateString();
    const prevDate = new Date(prevMsg.created_at).toDateString();
    
    return currentDate !== prevDate;
  };

  const shouldGroupMessage = (currentMsg: DirectMessage, prevMsg: DirectMessage | null) => {
    if (!prevMsg) return false;
    
    const timeDiff = new Date(currentMsg.created_at).getTime() - new Date(prevMsg.created_at).getTime();
    const fiveMinutes = 5 * 60 * 1000;
    
    // Don't group if different dates
    const currentDate = new Date(currentMsg.created_at).toDateString();
    const prevDate = new Date(prevMsg.created_at).toDateString();
    if (currentDate !== prevDate) return false;
    
    return prevMsg.sender_id === currentMsg.sender_id && timeDiff < fiveMinutes;
  };


  // Message component
  const DMMessageItem: React.FC<{ 
    message: DirectMessage; 
    showAvatar: boolean;
    showDate: boolean;
  }> = ({ message, showAvatar, showDate }) => {
    const [showActions, setShowActions] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    return (
      <div>
        {showDate && (
          <div className="dm-date-separator">
            <div className="date-line"></div>
            <div className="date-text">{formatDate(message.created_at)}</div>
            <div className="date-line"></div>
          </div>
        )}
        
        <div 
          className="group relative px-4 hover:bg-gray-800 hover:bg-opacity-10"
          style={{ 
            paddingTop: showAvatar ? '2px' : '1px',
            paddingBottom: showAvatar ? '2px' : '1px',
            marginTop: showAvatar ? '17px' : '0',
            transition: 'none'
          }}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          <div className="flex items-start" style={{ minHeight: '22px' }}>
            {/* Avatar Column */}
            <div className="flex-shrink-0 mr-4" style={{ width: '40px', minWidth: '40px' }}>
              {showAvatar ? (
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium cursor-pointer"
                  style={{ 
                    backgroundColor: getAvatarColor(message.sender_username || ''),
                    fontSize: '16px'
                  }}
                >
                  {(message.sender_username || 'U')[0].toUpperCase()}
                </div>
              ) : (
                <div className="w-full h-5 flex items-center justify-end pr-2">
                  <span 
                    className="text-xs text-gray-400 opacity-0 group-hover:opacity-100"
                    style={{ 
                      fontSize: '11px', 
                      lineHeight: '20px',
                      transition: 'none',
                      whiteSpace: 'nowrap',
                      textAlign: 'right'
                    }}
                  >
                    {formatTime(message.created_at)}
                  </span>
                </div>
              )}
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0">
              {showAvatar && (
                <div className="flex items-baseline mb-0.5">
                  <span 
                    className="text-base font-medium hover:underline cursor-pointer mr-2"
                    style={{ 
                      color: getUsernameColor(message.sender_username || ''),
                      fontSize: '16px',
                      lineHeight: '1.25rem',
                      fontWeight: 500
                    }}
                  >
                    {message.sender_username || 'Unknown User'}
                  </span>
                  <span 
                    className="text-xs font-medium cursor-default select-text"
                    style={{ 
                      fontSize: '12px',
                      lineHeight: '1.25rem',
                      color: '#a3a6aa'
                    }}
                    title={`${formatDate(message.created_at)}`}
                  >
                    {formatTime(message.created_at)}
                  </span>
                  {message.edited && (
                    <span 
                      className="ml-1 text-xs text-gray-500"
                      style={{ fontSize: '10px' }}
                    >
                      (edited)
                    </span>
                  )}
                </div>
              )}

              {/* Reply indicator */}
              {message.reply_to && (
                <div className="flex items-center mb-1 text-xs text-gray-400 hover:text-gray-300 cursor-pointer">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <span className="font-medium">{message.reply_to_username || 'Unknown User'}</span>
                  <span className="ml-1 opacity-75 truncate" style={{ maxWidth: '200px' }}>
                    {message.reply_to_content || 'Original message'}
                  </span>
                </div>
              )}
              
              <div 
                className="text-white break-words whitespace-pre-wrap select-text cursor-text"
                style={{ 
                  fontSize: '16px',
                  lineHeight: '1.375rem',
                  color: '#dcddde',
                  wordWrap: 'break-word',
                  userSelect: 'text',
                  marginTop: '0'
                }}
              >
                {message.content}
              </div>
            </div>
          </div>

          {/* Message Actions Toolbar */}
          {showActions && (
            <div className="absolute top-[-16px] right-4 flex items-center space-x-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg px-2 py-1">
              {/* Reply Button */}
              <button
                onClick={() => handleReply(message)}
                className="p-1 rounded hover:bg-gray-700 transition-colors"
                title="Reply"
              >
                <svg className="w-4 h-4 text-gray-300 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              
              {/* Edit Button (only for message sender) */}
              {user?.id === message.sender_id && (
                <button
                  className="p-1 rounded hover:bg-gray-700 transition-colors"
                  title="Edit Message"
                >
                  <svg className="w-4 h-4 text-gray-300 hover:text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              )}
              
              {/* More Options */}
              <button
                className="p-1 rounded hover:bg-gray-700 transition-colors"
                title="More"
              >
                <svg className="w-4 h-4 text-gray-300 hover:text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              
              {/* Delete Button (only for message sender) */}
              {user?.id === message.sender_id && (
                <button
                  onClick={async () => {
                    if (!isDeleting && window.confirm('Are you sure you want to delete this message?')) {
                      setIsDeleting(true);
                      try {
                        await dmAPI.deleteDirectMessage(message.id);
                        handleMessageDeleted(message.id);
                      } catch (error) {
                        console.error('Error deleting message:', error);
                        alert('Failed to delete message');
                      } finally {
                        setIsDeleting(false);
                      }
                    }
                  }}
                  disabled={isDeleting}
                  className="p-1 rounded hover:bg-red-600 transition-colors"
                  title="Delete Message"
                >
                  <svg className="w-4 h-4 text-gray-300 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMessage = (message: DirectMessage, index: number) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showDate = shouldShowDateSeparator(message, prevMessage);
    const isGrouped = shouldGroupMessage(message, prevMessage);
    const showAvatar = !isGrouped;

    return (
      <DMMessageItem
        key={message.id}
        message={message}
        showAvatar={showAvatar}
        showDate={showDate}
      />
    );
  };

  if (!activeConversation) {
    return (
      <div className="dm-chat-empty">
        <div className="empty-state">
          <div className="empty-icon">
            <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="empty-title">No conversation selected</div>
          <div className="empty-subtitle">
            Choose a conversation from the sidebar to start chatting
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dm-chat">
      {/* Chat Header */}
      <div className="dm-chat-header">
        <div className="participant-info">
          <div className="participant-avatar">
            {activeConversation.participant_avatar_url ? (
              <img 
                src={activeConversation.participant_avatar_url} 
                alt={activeConversation.participant_username} 
              />
            ) : (
              <div className="avatar-placeholder">
                {activeConversation.participant_username.charAt(0).toUpperCase()}
              </div>
            )}
            <div 
              className="status-indicator"
              style={{ 
                backgroundColor: activeConversation.participant_status === 'online' ? '#3ba55c' : '#747f8d' 
              }}
            />
          </div>
          <div className="participant-details">
            <div className="participant-name">
              {activeConversation.participant_username}
            </div>
            <div className="participant-status">
              {activeConversation.participant_status}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto message-scroll"
        style={{ backgroundColor: '#36393f' }}
      >
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-2 text-gray-300">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading messages...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400 max-w-md">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: getAvatarColor(activeConversation.participant_username) }}>
                <span className="text-white text-2xl font-medium">
                  {activeConversation.participant_username.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">This is the beginning of your direct message history with @{activeConversation.participant_username}</h3>
              <p className="text-gray-500">Send a message below to get the conversation started!</p>
            </div>
          </div>
        ) : (
          <div style={{ paddingTop: '16px', paddingBottom: '8px' }}>
            {messages.map((message, index) => renderMessage(message, index))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {error && (
          <div className="error-message">
            <svg className="w-4 h-4 error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {error}
          </div>
        )}
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-700 bg-opacity-50 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span className="text-gray-300">Replying to</span>
              <span className="text-indigo-400 font-medium">{replyingTo.sender_username}</span>
            </div>
            <button
              onClick={handleCancelReply}
              className="text-gray-400 hover:text-white transition-colors"
              type="button"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="text-xs text-gray-400 mt-1 truncate" style={{ maxWidth: '400px' }}>
            {replyingTo.content}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div
        style = {{
          padding: '16px',
          borderTop: '1px solid #2f3136',
          backgroundColor: '#40444b'
        }}
      >
        <div className="relative">
          <form onSubmit={handleSendMessage}>
            <div className="flex items-center rounded-lg" 
              style={{ 
                backgroundColor: '#32353b', 
                height: '44px' 
              }}
            >
              {/* Plus button */}
              <div className="flex-shrink-0 pl-4 pr-3">
                <button 
                  type="button"
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                  style={{ color: '#b9bbbe' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#dcddde'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#b9bbbe'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                  </svg>
                </button>
              </div>

              {/* Input */}
              <div className="flex-1">
                <input
                  ref={inputRef as any}
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={replyingTo ? `Reply to ${replyingTo.sender_username}...` : `Message ${activeConversation.participant_username}`}
                  disabled={sending}
                  maxLength={4000}
                  className="w-full bg-transparent border-0 outline-0 px-0 py-0"
                  style={{
                    color: '#dcddde',
                    fontSize: '16px',
                    lineHeight: '1.375rem',
                    height: '44px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Right side buttons */}
              <div className="flex-shrink-0 flex items-center pr-4 pl-2 space-x-2">
                {/* Gift button */}
                <button 
                  type="button"
                  className="w-6 h-6 flex items-center justify-center transition-colors"
                  style={{ color: '#b9bbbe' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#dcddde'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#b9bbbe'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 8.5h8.5a1.5 1.5 0 011.5 1.5v1a1.5 1.5 0 01-1.5 1.5h-17A1.5 1.5 0 012 11v-1a1.5 1.5 0 011.5-1.5H12zM12 8.5V7a2.5 2.5 0 10-5 0 2.5 2.5 0 005 0zm0 0V7a2.5 2.5 0 105 0 2.5 2.5 0 00-5 0zM3.5 12.5h17V21a1.5 1.5 0 01-1.5 1.5H5a1.5 1.5 0 01-1.5-1.5v-8.5z"/>
                  </svg>
                </button>
                
                {/* GIF button */}
                <button 
                  type="button"
                  className="w-6 h-6 flex items-center justify-center transition-colors"
                  style={{ color: '#b9bbbe' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#dcddde'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#b9bbbe'}
                >
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>GIF</span>
                </button>
                
                {/* Emoji button */}
                <button 
                  type="button"
                  className="w-6 h-6 flex items-center justify-center transition-colors"
                  style={{ color: '#b9bbbe' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#dcddde'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#b9bbbe'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0 15c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4zm-2-6c-.552 0-1-.448-1-1s.448-1 1-1 1 .448 1 1-.448 1-1 1zm4 0c-.552 0-1-.448-1-1s.448-1 1-1 1 .448 1 1-.448 1-1 1z"/>
                  </svg>
                </button>

                {/* Send button */}
                {newMessage.trim() && (
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-8 h-8 ml-2 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#5865f2' }}
                    onMouseEnter={(e) => !sending && (e.currentTarget.style.backgroundColor = '#4752c4')}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5865f2'}
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DMChat;