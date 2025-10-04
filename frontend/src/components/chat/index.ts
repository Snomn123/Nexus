// Modern Chat System Components (Unified Architecture)

// Main chat container that works for both server channels and DMs
export { default as UnifiedChat } from './UnifiedChat';

// Core message components (work with any message type)  
export { default as UnifiedMessageList } from './UnifiedMessageList';
export { default as UnifiedMessageItem } from './UnifiedMessageItem';
export { default as UnifiedMessageInput } from './UnifiedMessageInput';

// Specialized chat implementations
export { default as DMChatUnified } from './DMChatUnified';

// Re-export shared components for convenience
export * from '../shared';