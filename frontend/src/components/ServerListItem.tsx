import React, { memo } from 'react';
import { Server } from '../types';

interface ServerListItemProps {
  server: Server;
  isActive: boolean;
  onSelect: (server: Server) => void;
}

const ServerListItem: React.FC<ServerListItemProps> = memo(({ 
  server, 
  isActive, 
  onSelect 
}) => {
  return (
    <div className="relative group mb-3">
      <button
        onClick={() => onSelect(server)}
        className={`w-12 h-12 flex items-center justify-center transition-all duration-150 relative overflow-hidden ${
          isActive
            ? 'nexus-gradient text-white rounded-2xl'
            : 'nexus-card text-gray-300 rounded-3xl hover:nexus-gradient hover:text-white hover:rounded-2xl'
        }`}
        title={server.name}
      >
        <span className="font-bold text-sm z-10 relative">{server.name[0].toUpperCase()}</span>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
      </button>
      
      {/* Active indicator pill */}
      <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 nexus-gradient rounded-full transition-all duration-150 ${
        isActive ? 'w-1.5 h-8' : 'w-0 h-0'
      }`}></div>
      
      {/* Tooltip */}
      <div className="absolute left-16 top-1/2 transform -translate-y-1/2 nexus-glass-elevated text-white px-4 py-2 rounded-xl text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[9999] whitespace-nowrap">
        {server.name}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 nexus-glass rotate-45 border-l border-t border-nexus-border-primary"></div>
      </div>
    </div>
  );
});

ServerListItem.displayName = 'ServerListItem';

export default ServerListItem;