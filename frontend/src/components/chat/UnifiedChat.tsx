import React, { useState, useEffect, useMemo } from 'react';
import { Message, DirectMessage } from '../../types';
import { 
  UnifiedMessage, 
  MessageActions, 
  MessageAPIHandlers,
  serverMessageToUnified,
  dmMessageToUnified 
} from '../../types/unified';
import UnifiedMessageList from './UnifiedMessageList';
import UnifiedMessageInput from './UnifiedMessageInput';
import { useSocket } from '../../contexts/SocketContext';

interface UnifiedChatProps {
  // Message data
  messages: Message[] | DirectMessage[];
  messageType: 'server' | 'dm';
  
  // Context info
  contextId: number | string; // channel_id or conversation_id
  contextName?: string; // channel name or participant username
  
  // API handlers
  apiHandlers: MessageAPIHandlers;
  
  // Loading states
  loading?: boolean;
  
  // UI customization
  className?: string;
  placeholder?: string;
  emptyStateText?: string;
}

const UnifiedChat: React.FC<UnifiedChatProps> = ({
  messages,
  messageType,
  contextId,
  contextName,
  apiHandlers,
  loading = false,
  className = "",
  placeholder,
  emptyStateText
}) => {
  const [replyingTo, setReplyingTo] = useState<UnifiedMessage | null>(null);
  const { socket } = useSocket();

  // Convert messages to unified format
  const unifiedMessages = useMemo(() => {
    if (messageType === 'server') {
      return (messages as Message[]).map(serverMessageToUnified);
    } else {
      return (messages as DirectMessage[]).map(dmMessageToUnified);
    }
  }, [messages, messageType]);

  // Clear reply when context changes
  useEffect(() => {
    setReplyingTo(null);
  }, [contextId]);

  // Socket event handlers for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleMessageDeleted = (data: { messageId: number; contextId: number | string; messageType: string }) => {
      if (data.contextId === contextId && data.messageType === messageType) {
        // Clear reply if replying to deleted message
        if (replyingTo && replyingTo.id === data.messageId) {
          setReplyingTo(null);
        }
      }
    };

    socket.on('message_deleted', handleMessageDeleted);
    
    return () => {
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [socket, contextId, messageType, replyingTo]);

  // Message action handlers
  const messageActions: MessageActions = {
    onReply: (message: UnifiedMessage) => {
      setReplyingTo(message);
    },
    
    onEdit: (message: UnifiedMessage) => {
      // TODO: Implement edit functionality
      console.log('Edit message:', message);
    },
    
    onDelete: async (messageId: number) => {
      try {
        await apiHandlers.deleteMessage(messageId, contextId);
        
        // Emit socket event for real-time updates
        if (socket) {
          socket.emit('message_deleted', {
            messageId,
            contextId,
            messageType
          });
        }
      } catch (error) {
        console.error('Failed to delete message:', error);
        throw error;
      }
    }
  };

  // Handle sending messages
  const handleSendMessage = async (content: string, replyToId?: number) => {
    try {
      await apiHandlers.sendMessage(content, contextId, replyToId);
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  // Handle canceling reply
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // Generate appropriate placeholder text
  const inputPlaceholder = placeholder || (
    messageType === 'server' 
      ? `Message #${contextName || 'channel'}` 
      : `Message @${contextName || 'user'}`
  );

  // Generate appropriate empty state text
  const emptyMessage = emptyStateText || (
    messageType === 'server'
      ? `Welcome to #${contextName || 'this channel'}!`
      : `This is the beginning of your conversation with ${contextName || 'this user'}.`
  );

  return (
    <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
      {/* Chat header (optional, could be customized) */}
      {contextName && (
        <div className="border-b border-gray-700 px-4 py-3 bg-gray-800">
          <h2 className="text-lg font-semibold text-white">
            {messageType === 'server' ? `#${contextName}` : contextName}
          </h2>
        </div>
      )}

      {/* Message list */}
      <UnifiedMessageList
        messages={unifiedMessages}
        loading={loading}
        actions={messageActions}
        emptyStateText={emptyMessage}
        className="flex-1"
      />

      {/* Message input */}
      <UnifiedMessageInput
        onSendMessage={handleSendMessage}
        replyingTo={replyingTo}
        onCancelReply={handleCancelReply}
        placeholder={inputPlaceholder}
        disabled={loading}
      />
    </div>
  );
};

export default UnifiedChat;