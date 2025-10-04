import React, { useEffect, useRef, memo, useMemo } from 'react';
import { UnifiedMessage, MessageActions } from '../../types/unified';
import UnifiedMessageItem from './UnifiedMessageItem';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateHeader } from '../../utils/dateFormatting';
import { LoadingState, EmptyState } from '../shared';

interface UnifiedMessageListProps {
  messages: UnifiedMessage[];
  loading?: boolean;
  actions: MessageActions;
  emptyStateText?: string;
  className?: string;
}

const UnifiedMessageList: React.FC<UnifiedMessageListProps> = memo(({ 
  messages, 
  loading, 
  actions,
  emptyStateText = "No messages yet",
  className = ""
}) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { [key: string]: UnifiedMessage[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  }, [messages]);

  // Determine if avatar should be shown (first message from user in sequence)
  const shouldShowAvatar = (message: UnifiedMessage, index: number, messagesInGroup: UnifiedMessage[]) => {
    if (index === 0) return true;
    
    const prevMessage = messagesInGroup[index - 1];
    const timeDiff = new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime();
    const fiveMinutes = 5 * 60 * 1000;
    
    return prevMessage.user_id !== message.user_id || timeDiff > fiveMinutes;
  };

  // Date formatting function is now imported from utils/dateFormatting.ts

  if (loading) {
    return (
      <LoadingState 
        message="Loading messages..." 
        className={`flex-1 ${className}`}
      />
    );
  }

  if (messages.length === 0) {
    return (
      <EmptyState 
        icon="💬"
        title={emptyStateText}
        description="Send a message to get started!"
        className={`flex-1 ${className}`}
      />
    );
  }

  return (
    <div 
      ref={messagesContainerRef}
      className={`flex-1 overflow-y-auto custom-scrollbar ${className}`}
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      <div className="pb-4">
        {Object.entries(groupedMessages).map(([dateString, messagesInGroup]) => (
          <div key={dateString}>
            {/* Date header */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-gray-700 px-3 py-1 rounded-lg">
                <span className="text-xs text-gray-300 font-medium">
                  {formatDateHeader(dateString)}
                </span>
              </div>
            </div>

            {/* Messages for this date */}
            {messagesInGroup.map((message, index) => (
              <UnifiedMessageItem
                key={message.id}
                message={message}
                showAvatar={shouldShowAvatar(message, index, messagesInGroup)}
                actions={actions}
                currentUserId={user?.id}
              />
            ))}
          </div>
        ))}
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
});

UnifiedMessageList.displayName = 'UnifiedMessageList';

export default UnifiedMessageList;