import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { Message } from '../../types';
import { UnifiedChat } from '../chat';
import { createServerMessageHandlers } from '../../services/unifiedAPI';

interface ServerChatProps {
  channelId: number;
  channelName: string;
  messages: Message[];
  loading?: boolean;
  onMessageSent?: () => void;
}

const ServerChat: React.FC<ServerChatProps> = ({
  channelId,
  channelName,
  messages,
  loading = false,
  onMessageSent
}) => {
  // Create API handlers for this specific channel
  const apiHandlers = createServerMessageHandlers(channelId);

  // Wrap the sendMessage to trigger refresh if needed
  const wrappedHandlers = {
    ...apiHandlers,
    sendMessage: async (content: string, contextId: number | string, replyTo?: number) => {
      await apiHandlers.sendMessage(content, contextId, replyTo);
      if (onMessageSent) {
        onMessageSent();
      }
    }
  };

  return (
    <UnifiedChat
      messages={messages}
      messageType="server"
      contextId={channelId}
      contextName={channelName}
      apiHandlers={wrappedHandlers}
      loading={loading}
      placeholder={`Message #${channelName}`}
      emptyStateText={`Welcome to #${channelName}! This is the beginning of the channel.`}
      className="h-full"
    />
  );
};

export default ServerChat;