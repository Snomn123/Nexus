import React, { useState, useRef, useEffect } from 'react';
import { UnifiedMessage, MessageAPIHandlers } from '../../types/unified';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner } from '../shared';

interface UnifiedMessageInputProps {
  onSendMessage: (content: string, replyTo?: number) => Promise<void>;
  replyingTo?: UnifiedMessage | null;
  onCancelReply?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const UnifiedMessageInput: React.FC<UnifiedMessageInputProps> = ({
  onSendMessage,
  replyingTo,
  onCancelReply,
  placeholder = "Type a message...",
  disabled = false,
  className = ""
}) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input when component mounts or reply changes
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [replyingTo, disabled]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const messageText = message.trim();
    if (!messageText || sending || disabled) return;
    
    try {
      setSending(true);
      await onSendMessage(messageText, replyingTo?.id);
      setMessage('');
      
      // Keep focus on input after sending
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 10);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    
    if (e.key === 'Escape' && replyingTo && onCancelReply) {
      onCancelReply();
    }
  };

  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      const maxHeight = 120; // Max 5 lines approximately
      inputRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  return (
    <div className={`border-t border-gray-700 bg-gray-800 ${className}`}>
      {/* Reply preview */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-700 bg-opacity-50 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span className="text-gray-300">Replying to</span>
              <span className="text-indigo-400 font-medium">{replyingTo.username}</span>
            </div>
            {onCancelReply && (
              <button
                onClick={onCancelReply}
                className="text-gray-400 hover:text-white transition-colors"
                type="button"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1 truncate" style={{ maxWidth: '400px' }}>
            {replyingTo.content}
          </div>
        </div>
      )}

      {/* Message input */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? "Message sending disabled" : placeholder}
              disabled={disabled || sending}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 resize-none overflow-hidden min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ maxHeight: '120px' }}
              rows={1}
            />
            
            {/* Send button overlay */}
            <button
              type="submit"
              disabled={!message.trim() || sending || disabled}
              className="absolute right-2 bottom-2 p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <Spinner size="md" color="white" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Hint text */}
        <div className="mt-2 text-xs text-gray-500">
          Press <kbd className="px-1 py-0.5 bg-gray-600 rounded text-xs">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-gray-600 rounded text-xs">Shift+Enter</kbd> for new line
          {replyingTo && (
            <span>, <kbd className="px-1 py-0.5 bg-gray-600 rounded text-xs">Esc</kbd> to cancel reply</span>
          )}
        </div>
      </form>
    </div>
  );
};

export default UnifiedMessageInput;