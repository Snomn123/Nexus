import { Message, DirectMessage } from './index';

// Unified message interface that both Message and DirectMessage can conform to
export interface UnifiedMessage {
  id: number;
  content: string;
  // User info
  user_id: number;
  username: string;
  avatar_url?: string;
  // Reply info
  reply_to?: number;
  reply_to_username?: string;
  reply_to_content?: string;
  // Status
  edited: boolean;
  created_at: string;
  updated_at: string;
  // Encryption
  encrypted_content?: string;
  is_encrypted?: boolean;
  encryption_version?: string;
  // Message type context
  message_type: 'server' | 'dm';
  // Context-specific data
  context_id: number | string; // channel_id for server messages, conversation_id for DMs
}

// Message actions interface
export interface MessageActions {
  onReply?: (message: UnifiedMessage) => void;
  onEdit?: (message: UnifiedMessage) => void;
  onDelete?: (messageId: number) => void;
}

// API adapter functions to convert existing types to unified format
export const serverMessageToUnified = (message: Message): UnifiedMessage => ({
  id: message.id,
  content: message.content,
  user_id: message.user_id,
  username: message.username,
  avatar_url: message.avatar_url,
  reply_to: message.reply_to,
  reply_to_username: message.reply_to_username,
  reply_to_content: message.reply_to_content,
  edited: message.edited,
  created_at: message.created_at,
  updated_at: message.updated_at,
  encrypted_content: message.encrypted_content,
  is_encrypted: message.is_encrypted,
  encryption_version: message.encryption_version,
  message_type: 'server',
  context_id: message.channel_id
});

export const dmMessageToUnified = (message: DirectMessage): UnifiedMessage => ({
  id: message.id,
  content: message.content,
  user_id: message.sender_id,
  username: message.sender_username,
  avatar_url: message.sender_avatar_url,
  reply_to: message.reply_to,
  reply_to_username: message.reply_to_username,
  reply_to_content: message.reply_to_content,
  edited: message.edited,
  created_at: message.created_at,
  updated_at: message.updated_at,
  encrypted_content: message.encrypted_content,
  is_encrypted: message.is_encrypted,
  encryption_version: message.encryption_version,
  message_type: 'dm',
  context_id: message.conversation_id
});

// API handlers interface
export interface MessageAPIHandlers {
  deleteMessage: (messageId: number, contextId: number | string) => Promise<void>;
  editMessage?: (messageId: number, newContent: string, contextId: number | string) => Promise<void>;
  sendMessage: (content: string, contextId: number | string, replyTo?: number) => Promise<void>;
}