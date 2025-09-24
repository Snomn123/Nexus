import React from 'react';

interface AvatarProps {
  src?: string;
  username: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'away' | 'busy' | 'offline';
  showStatus?: boolean;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  username,
  size = 'md',
  status = 'offline',
  showStatus = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl'
  };

  const statusSizes = {
    sm: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
    md: 'w-3 h-3 -bottom-0.5 -right-0.5',
    lg: 'w-3.5 h-3.5 -bottom-1 -right-1',
    xl: 'w-4 h-4 -bottom-1 -right-1'
  };

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-500'
  };

  const getAvatarColor = (name: string) => {
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 50%)`;
  };

  return (
    <div className={`relative ${className}`}>
      {src ? (
        <img
          src={src}
          alt={username}
          className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-transparent hover:ring-nexus-primary transition-all duration-200 nexus-shadow-sm`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white nexus-shadow-md ring-2 ring-transparent hover:ring-nexus-primary/50 transition-all duration-200 cursor-pointer group`}
          style={{ backgroundColor: getAvatarColor(username) }}
        >
          <span className="group-hover:scale-110 transition-transform duration-200">
            {username[0]?.toUpperCase() || 'U'}
          </span>
        </div>
      )}
      
      {showStatus && (
        <div
          className={`absolute rounded-full border-2 border-nexus-bg-card ${statusSizes[size]} ${statusColors[status]} nexus-shadow-sm`}
        />
      )}
    </div>
  );
};

export default Avatar;