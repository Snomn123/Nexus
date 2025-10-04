import React from 'react';
import { DirectMessage } from '../../types';
import { useDM } from '../../contexts/DMContext';
import UnifiedChat from './UnifiedChat';
import { MessageAPIHandlers } from '../../types/unified';
import { dmAPI } from '../../services/api';

interface DMChatUnifiedProps {
  conversationId: string;
  participantUsername: string;
  participantId: number;
  messages: DirectMessage[];
  loading?: boolean;
}

const DMChatUnified: React.FC<DMChatUnifiedProps> = ({
  conversationId,
  participantUsername,
  participantId,
  messages,
  loading = false
}) => {
  const { sendDirectMessage, refreshMessages } = useDM();

  // Create API handlers for DM messages
  const apiHandlers: MessageAPIHandlers = {
    deleteMessage: async (messageId: number) => {
      await dmAPI.deleteDirectMessage(messageId);
      // Refresh messages after deletion
      refreshMessages(conversationId);
    },
    
    editMessage: async (messageId: number, newContent: string) => {
      // TODO: Implement edit functionality
      console.log('Edit message not yet implemented for DM messages');
    },
    
    sendMessage: async (content: string, contextId: number | string, replyTo?: number) => {
      await sendDirectMessage(participantId, content, replyTo);
    }
  };

  return (
    <UnifiedChat
      messages={messages}
      messageType="dm"
      contextId={conversationId}
      contextName={participantUsername}
      apiHandlers={apiHandlers}
      loading={loading}
      placeholder={`Message @${participantUsername}`}
      emptyStateText={`This is the beginning of your conversation with ${participantUsername}.`}
      className="h-full"
    />
  );
};

export default DMChatUnified;