import React, { useState, useRef, useEffect, forwardRef, useCallback } from 'react';
import { useSocket } from '../../contexts/SocketContext';

import { Message } from '../../types';

interface MessageInputProps {
  channelId: number;
  channelName: string;
  disabled?: boolean;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
}

export const MessageInput = forwardRef<HTMLInputElement, MessageInputProps>((
  { channelId, channelName, disabled = false, replyingTo, onCancelReply },
  ref
) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevChannelIdRef = useRef<number>(channelId);
  
  const { sendMessage, startTyping, stopTyping, connected } = useSocket();

  const handleSubmit = () => {
    if (!message.trim() || !connected || disabled) return;
    
    // Send the message with optional reply
    sendMessage(channelId, message.trim(), replyingTo?.id);
    
    // Clear input and reply
    setMessage('');
    onCancelReply?.();
    
    // Keep focus on the input after sending
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 10);
    
    // Stop typing indicator
    handleStopTyping();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Handle typing indicators
    if (value.trim() && !isTyping && connected) {
      setIsTyping(true);
      startTyping(channelId);
    }
    
    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 3 seconds of inactivity
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        handleStopTyping();
      }, 3000);
    } else {
      handleStopTyping();
    }
  };

  const handleStopTyping = useCallback(() => {
    if (isTyping) {
      setIsTyping(false);
      stopTyping(channelId);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [isTyping, stopTyping]); // Removed channelId dependency

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape' && replyingTo) {
      e.preventDefault();
      onCancelReply?.();
    }
  };

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        stopTyping(channelId);
      }
    };
  }, []); // Empty dependency array for cleanup only

  // Stop typing when channel changes
  useEffect(() => {
    if (prevChannelIdRef.current !== channelId) {
      handleStopTyping();
      setMessage('');
      onCancelReply?.(); // Clear any active reply
      prevChannelIdRef.current = channelId;
    }
  }, [channelId, onCancelReply]);

  // Focus input when component mounts or when starting a reply
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [channelId, replyingTo]);

  const isInputDisabled = disabled || !connected;

  return (
    <div
      style={{
        padding: '16px',
        borderTop: '1px solid #2f3136',
        backgroundColor: '#40444b'
      }}
    >
      {/* Reply Preview */}
      {replyingTo && (
        <div className="mb-2 px-4 py-2 bg-gray-700 bg-opacity-50 rounded-t-lg border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span className="text-gray-300">Replying to</span>
              <span className="text-indigo-400 font-medium">{replyingTo.username}</span>
            </div>
            <button
              onClick={onCancelReply}
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
      
      <div className="relative">
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
              ref={(el) => {
                // Use type assertion to work around React 18/19 TypeScript strictness
                (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                if (typeof ref === 'function') {
                  ref(el);
                } else if (ref) {
                  ref.current = el;
                }
              }}
              type="text"
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={replyingTo ? `Reply to ${replyingTo.username}...` : `Message #${channelName}`}
              disabled={isInputDisabled}
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
          </div>
        </div>
      </div>
    </div>
  );
});
