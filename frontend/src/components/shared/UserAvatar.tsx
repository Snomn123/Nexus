import React from 'react';
import { getAvatarColor } from '../../utils/avatarColors';

interface UserAvatarProps {
  username: string;
  avatar_url?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base'
};

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  username, 
  avatar_url, 
  size = 'md',
  className = '' 
}) => {
  return (
    <div 
      className={`rounded-full flex items-center justify-center text-white font-medium flex-shrink-0 ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: getAvatarColor(username) }}
    >
      {avatar_url ? (
        <img 
          src={avatar_url} 
          alt={username}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        username.charAt(0).toUpperCase()
      )}
    </div>
  );
};

export default UserAvatar;