import React, { useEffect, useRef, memo, useMemo, useState } from 'react';
import { Message } from '../../types';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarColor, getUsernameColor } from '../../utils/avatarColors';
import { messageAPI } from '../../services/api';

interface MessageListProps {
  channelId: number;
  messages: Message[];
  loading?: boolean;
  onReply?: (message: Message) => void;
  onMessageDeleted?: (messageId: number) => void;
}

const MessageItem: React.FC<{ 
  message: Message; 
  showAvatar: boolean;
  onReply?: (message: Message) => void;
  onDelete?: (messageId: number) => void;
  currentUserId?: number;
}> = memo(({ message, showAvatar, onReply, onDelete, currentUserId }) => {
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today at ' + formatTime(dateString);
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday at ' + formatTime(dateString);
    } else {
      return date.toLocaleDateString('en-US', { 
        month: '2-digit',
        day: '2-digit', 
        year: 'numeric'
      }) + ' at ' + formatTime(dateString);
    }
  };

  // Use shared color utilities for consistency
  const userColor = useMemo(() => getUsernameColor(message.username || ''), [message.username]);
  const avatarColor = useMemo(() => getAvatarColor(message.username || ''), [message.username]);

  return (
    <div 
      className="group relative px-4 hover:bg-gray-800 hover:bg-opacity-10"
      style={{ 
        paddingTop: showAvatar ? '2px' : '1px',
        paddingBottom: showAvatar ? '2px' : '1px',
        marginTop: showAvatar ? '17px' : '0',
        transition: 'none' // Remove transitions for instant response
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
                backgroundColor: avatarColor,
                fontSize: '16px'
              }}
            >
              {(message.username || 'U')[0].toUpperCase()}
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
        <div className="flex-1 min-w-0" style={{ maxWidth: 'calc(100% - 56px)' }}>
          {showAvatar && (
            <div className="flex items-baseline mb-0.5">
              <span 
                className="text-base font-medium hover:underline cursor-pointer mr-2"
                style={{ 
                  color: userColor,
                  fontSize: '16px',
                  lineHeight: '1.25rem',
                  fontWeight: 500
                }}
              >
                {message.username || 'Unknown User'}
              </span>
              <span 
                className="text-xs font-medium cursor-default select-text"
                style={{ 
                  fontSize: '12px',
                  lineHeight: '1.25rem',
                  color: '#a3a6aa'
                }}
                title={formatDate(message.created_at)}
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
              marginTop: '0',
              minHeight: '22px',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            {message.content || 'Message content not available'}
          </div>
        </div>
      </div>

      {/* Message Actions Toolbar */}
      {showActions && (
        <div className="absolute top-[-16px] right-4 flex items-center space-x-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg px-2 py-1">
          {/* Reply Button */}
              <button
                onClick={() => onReply?.(message)}
                className="p-1 rounded hover:bg-gray-700 transition-colors"
                title="Reply"
              >
                <svg className="w-4 h-4 text-gray-300 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>          {/* Edit Button (only for message owner) */}
          {currentUserId === message.user_id && (
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
          
          {/* Delete Button (only for message owner or admin) */}
          {currentUserId === message.user_id && (
            <button
              onClick={async () => {
                if (!isDeleting && window.confirm('Are you sure you want to delete this message?')) {
                  setIsDeleting(true);
                  try {
                    await messageAPI.deleteMessage(message.id);
                    onDelete?.(message.id);
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
              <svg className="w-4 h-4 text-gray-300 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

const shouldGroupMessage = (currentMsg: Message, prevMsg: Message | null) => {
  if (!prevMsg) return false;
  
  // Same user
  if (prevMsg.user_id !== currentMsg.user_id) return false;
  
  // Within 5 minutes (Discord's grouping time)
  const timeDiff = new Date(currentMsg.created_at).getTime() - new Date(prevMsg.created_at).getTime();
  if (timeDiff > 5 * 60 * 1000) return false;

  return true;
};

export const MessageList: React.FC<MessageListProps> = memo(({
  channelId,
  messages,
  loading = false,
  onReply,
  onMessageDeleted
}) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { typingUsers } = useSocket();
  
  const currentChannelTyping = useMemo(() => typingUsers[channelId] || [], [typingUsers, channelId]);

  // Auto-scroll to bottom when new messages arrive - instant for performance
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages, currentChannelTyping]);

  if (loading && messages.length === 0) {
    return (
      <div 
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: '#36393f' }}
      >
        <div className="flex items-center space-x-2 text-gray-300">
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
          <span>Loading messages...</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex-1 overflow-y-auto message-scroll"
      style={{ backgroundColor: '#36393f' }}
    >
      <div className="min-h-full flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400 max-w-md">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
              <p className="text-gray-500">Be the first to start the conversation!</p>
            </div>
          </div>
        ) : (
          <>
            <div style={{ paddingTop: '16px', paddingBottom: '8px' }}>
              {messages.map((message, index) => {
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const showAvatar = !shouldGroupMessage(message, prevMessage);
                return (
                  <MessageItem
                    key={message.id}
                    message={message}
                    showAvatar={showAvatar}
                    onReply={onReply}
                    onDelete={onMessageDeleted}
                    currentUserId={user?.id}
                  />
                );
              })}
              
              {/* Typing Indicator */}
              {currentChannelTyping.length > 0 && (
                <div className="flex items-center px-4 py-1 text-sm text-gray-400">
                  <div style={{ width: '40px', marginRight: '16px' }}></div>
                  <div className="flex items-center">
                    <div className="flex space-x-1 mr-2">
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    </div>
                    <span>
                      {currentChannelTyping.length === 1 
                        ? `${currentChannelTyping[0]} is typing...`
                        : currentChannelTyping.length === 2
                        ? `${currentChannelTyping[0]} and ${currentChannelTyping[1]} are typing...`
                        : `${currentChannelTyping.length} people are typing...`
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  );
});

MessageList.displayName = 'MessageList';
