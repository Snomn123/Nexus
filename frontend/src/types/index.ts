// User types
export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  created_at: string;
  updated_at: string;
}

// Server types
export interface Server {
  id: number;
  name: string;
  description?: string;
  icon_url?: string;
  owner_id: number;
  invite_code: string;
  is_public?: boolean;
  created_at: string;
  updated_at: string;
  channels?: Channel[];
  members?: ServerMember[];
  user_role?: 'owner' | 'admin' | 'moderator' | 'member';
}

export interface ServerMember {
  id: number;
  username: string;
  avatar_url?: string;
  status: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joined_at: string;
}

// Channel types
export interface Channel {
  id: number;
  name: string;
  description?: string;
  type: 'text' | 'voice';
  server_id: number;
  position: number;
  created_at: string;
  updated_at: string;
}

// Message types
export interface Message {
  id: number;
  content: string;
  user_id: number;
  username: string;
  avatar_url?: string;
  channel_id: number;
  reply_to?: number;
  reply_to_username?: string;
  reply_to_content?: string;
  edited: boolean;
  created_at: string;
  updated_at: string;
  // Encryption fields
  encrypted_content?: string;
  is_encrypted?: boolean;
  encryption_version?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  errors?: Array<{ msg: string; param?: string }>;
}

export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface CreateServerRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface JoinServerRequest {
  inviteCode: string;
}

export interface SendMessageRequest {
  content: string;
  replyTo?: number;
  // Encryption fields (optional, populated when encryption is enabled)
  encrypted_content?: string;
  is_encrypted?: boolean;
  encryption_version?: string;
}

export interface EditMessageRequest {
  content: string;
  // Encryption fields (optional, populated when encryption is enabled)
  encrypted_content?: string;
  is_encrypted?: boolean;
  encryption_version?: string;
}

// Socket event types
export interface SocketMessage {
  id: number;
  content: string;
  user_id: number;
  username: string;
  avatar_url?: string;
  channel_id: number;
  reply_to?: number;
  reply_to_username?: string;
  reply_to_content?: string;
  edited: boolean;
  created_at: string;
  updated_at: string;
  // Encryption fields
  encrypted_content?: string;
  is_encrypted?: boolean;
  encryption_version?: string;
}

export interface TypingEvent {
  userId: number;
  username: string;
  channelId: number;
}

export interface UserStatusEvent {
  userId: number;
  username: string;
  status: 'online' | 'offline' | 'away' | 'busy';
}

// Friends and DM types
export interface Friend {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  friendship_id: number;
  created_at: string;
  last_seen?: string;
}

export interface FriendRequest {
  id: number;
  sender_id: number;
  receiver_id: number;
  sender_username: string;
  sender_avatar_url?: string;
  receiver_username: string;
  receiver_avatar_url?: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}

export interface DirectMessage {
  id: number;
  content: string;
  sender_id: number;
  receiver_id: number;
  sender_username: string;
  sender_avatar_url?: string;
  conversation_id: string;
  reply_to?: number;
  reply_to_content?: string;
  reply_to_username?: string;
  edited: boolean;
  read: boolean;
  created_at: string;
  updated_at: string;
  // Encryption fields
  encrypted_content?: string;
  is_encrypted?: boolean;
  encryption_version?: string;
}

export interface DMConversation {
  id: string;
  participant_id: number;
  participant_username: string;
  participant_avatar_url?: string;
  participant_status: 'online' | 'offline' | 'away' | 'busy';
  last_message?: DirectMessage;
  unread_count: number;
  updated_at: string;
}

// Context types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export interface SocketContextType {
  socket: any; // Socket.IO client instance
  connected: boolean;
  messages: Message[];
  typingUsers: {[key: string]: string[]};
  joinChannel: (channelId: number) => void;
  leaveChannel: (channelId: number) => void;
  sendMessage: (channelId: number, content: string, replyTo?: number) => void;
  startTyping: (channelId: number) => void;
  stopTyping: (channelId: number) => void;
  clearMessages: () => void;
}

export interface FriendsContextType {
  friends: Friend[];
  friendRequests: FriendRequest[];
  onlineUsers: number[];
  loading: boolean;
  error: string;
  sendFriendRequest: (username: string) => Promise<void>;
  acceptFriendRequest: (requestId: number) => Promise<{ id: number; username: string; avatar_url?: string } | undefined>;
  declineFriendRequest: (requestId: number) => Promise<void>;
  cancelFriendRequest: (requestId: number) => Promise<void>;
  removeFriend: (friendId: number) => Promise<void>;
  refreshFriends: () => Promise<void>;
  refreshFriendRequests: () => Promise<void>;
}

export interface DMContextType {
  conversations: DMConversation[];
  activeConversation: DMConversation | null;
  messages: DirectMessage[];
  loading: boolean;
  error: string;
  setActiveConversation: (conversation: DMConversation | null) => void;
  sendDirectMessage: (receiverId: number, content: string, replyTo?: number) => Promise<void>;
  markMessagesAsRead: (conversationId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
  refreshMessages: (conversationId: string) => Promise<void>;
  startDirectConversation: (userId: number) => Promise<DMConversation>;
  hideConversation: (conversationId: string) => void;
}

// Component prop types
export interface ServerListProps {
  servers: Server[];
  activeServerId?: number;
  onServerSelect: (serverId: number) => void;
}

export interface ChannelListProps {
  channels: Channel[];
  activeChannelId?: number;
  onChannelSelect: (channelId: number) => void;
}

export interface MessageListProps {
  messages: Message[];
  loading: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export interface MessageInputProps {
  onSendMessage: (content: string, replyTo?: number) => void;
  replyingTo?: Message;
  onCancelReply?: () => void;
  disabled?: boolean;
}

export interface UserListProps {
  members: ServerMember[];
  onlineUsers?: number[];
}

// Form types
export interface LoginFormData {
  emailOrUsername: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CreateServerFormData {
  name: string;
  description: string;
}

// Utility types
export type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface PaginationInfo {
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ErrorInfo {
  message: string;
  code?: string;
  field?: string;
}