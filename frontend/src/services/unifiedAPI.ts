import { messageAPI, dmAPI } from './api';
import { MessageAPIHandlers } from '../types/unified';

// Server message API handlers
export const createServerMessageHandlers = (channelId: number): MessageAPIHandlers => ({
  deleteMessage: async (messageId: number) => {
    await messageAPI.deleteMessage(messageId);
  },
  
  editMessage: async (messageId: number, newContent: string) => {
    // TODO: Implement edit functionality in messageAPI
    console.log('Edit message not yet implemented for server messages');
  },
  
  sendMessage: async (content: string, contextId: number | string, replyTo?: number) => {
    await messageAPI.sendMessage(contextId as number, { 
      content, 
      replyTo 
    });
  }
});

// DM message API handlers
export const createDMMessageHandlers = (): MessageAPIHandlers => ({
  deleteMessage: async (messageId: number) => {
    await dmAPI.deleteDirectMessage(messageId);
  },
  
  editMessage: async (messageId: number, newContent: string) => {
    // TODO: Implement edit functionality in dmAPI
    console.log('Edit message not yet implemented for DM messages');
  },
  
  sendMessage: async (content: string, contextId: number | string, replyTo?: number) => {
    // For DMs, we need to determine the recipient ID from the conversation
    // This would need to be passed in or derived from context
    throw new Error('DM sendMessage requires recipient ID - use existing DM context methods');
  }
});

// Helper function to get appropriate handlers based on message type
export const getMessageHandlers = (
  messageType: 'server' | 'dm', 
  contextId: number | string
): MessageAPIHandlers => {
  if (messageType === 'server') {
    return createServerMessageHandlers(contextId as number);
  } else {
    return createDMMessageHandlers();
  }
};