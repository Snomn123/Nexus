import React, { useState, memo } from 'react';
import { UnifiedMessage, MessageActions } from '../../types/unified';
import { useAuth } from '../../contexts/AuthContext';
import { getUsernameColor } from '../../utils/avatarColors';
import { formatDate } from '../../utils/dateFormatting';
import { Spinner, UserAvatar } from '../shared';

interface UnifiedMessageItemProps {
  message: UnifiedMessage;
  showAvatar: boolean;
  actions: MessageActions;
  currentUserId?: number;
}

const UnifiedMessageItem: React.FC<UnifiedMessageItemProps> = memo(({ 
  message, 
  showAvatar, 
  actions,
  currentUserId 
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Date formatting functions are now imported from utils/dateFormatting.ts

  const handleDelete = async () => {
    if (isDeleting || !actions.onDelete) return;
    
    setIsDeleting(true);
    try {
      await actions.onDelete(message.id);
    } catch (error) {
      console.error('Failed to delete message:', error);
      setIsDeleting(false);
    }
  };

  const handleReply = () => {
    if (actions.onReply) {
      actions.onReply(message);
    }
  };

  const handleEdit = () => {
    if (actions.onEdit) {
      actions.onEdit(message);
    }
  };

  const canDelete = currentUserId === message.user_id;
  const canEdit = currentUserId === message.user_id;

  return (
    <div 
      className="group flex flex-col hover:bg-gray-800 hover:bg-opacity-30 transition-colors duration-150 px-4 py-1 relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Reply indicator */}
      {message.reply_to && (
        <div className="flex items-center text-xs text-gray-400 mb-1 ml-10">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          <span className="text-gray-300">Replying to</span>
          {message.reply_to_username && (
            <span className="text-indigo-400 font-medium ml-1">{message.reply_to_username}</span>
          )}
          {message.reply_to_content && (
            <span className="ml-2 text-gray-400 truncate max-w-xs">
              {message.reply_to_content}
            </span>
          )}
        </div>
      )}

      <div className="flex items-start space-x-3">
        {/* Avatar */}
        {showAvatar && (
          <UserAvatar 
            username={message.username}
            avatar_url={message.avatar_url}
            size="md"
          />
        )}
        
        {/* Spacer for non-avatar messages */}
        {!showAvatar && <div className="w-10 flex-shrink-0" />}
        
        {/* Message content */}
        <div className="flex-1 min-w-0">
          {showAvatar && (
            <div className="flex items-baseline space-x-2 mb-1">
              <span 
                className="font-medium text-sm"
                style={{ color: getUsernameColor(message.username) }}
              >
                {message.username}
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(message.created_at)}
              </span>
              {message.edited && (
                <span className="text-xs text-gray-500">(edited)</span>
              )}
            </div>
          )}
          
          <div className="text-gray-300 text-sm leading-relaxed break-words">
            {message.content}
          </div>
        </div>

        {/* Action buttons */}
        {showActions && !isDeleting && (
          <div className="absolute right-4 top-2 bg-gray-700 rounded-lg shadow-lg border border-gray-600 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {/* Reply button */}
            <button
              onClick={handleReply}
              className="p-2 hover:bg-gray-600 transition-colors duration-150 rounded-l-lg"
              title="Reply"
            >
              <svg className="w-4 h-4 text-gray-300 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>

            {/* Edit button */}
            {canEdit && (
              <button
                onClick={handleEdit}
                className="p-2 hover:bg-gray-600 transition-colors duration-150"
                title="Edit"
              >
                <svg className="w-4 h-4 text-gray-300 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}

            {/* Delete button */}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-red-600 transition-colors duration-150 rounded-r-lg"
                title="Delete"
              >
                <svg className="w-4 h-4 text-gray-300 hover:text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Deleting indicator */}
        {isDeleting && (
          <div className="absolute right-4 top-2 bg-gray-700 rounded-lg shadow-lg border border-gray-600 px-3 py-2">
            <div className="flex items-center space-x-2">
              <Spinner size="sm" color="red" />
              <span className="text-xs text-gray-300">Deleting...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

UnifiedMessageItem.displayName = 'UnifiedMessageItem';

export default UnifiedMessageItem;