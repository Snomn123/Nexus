import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider, useSocket } from './contexts/SocketContext';
import { FriendsProvider } from './contexts/FriendsContext';
import { DMProvider } from './contexts/DMContext';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import FriendsList from './components/FriendsList';
import DMList from './components/DMList';
import DMChat from './components/DMChat';
import ServerBrowser from './components/ServerBrowser';
import ServerSettingsModal from './components/ServerSettingsModal';
import { serverAPI, messageAPI } from './services/api';
import { Server, Channel, Message } from './types';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import ServerListItem from './components/ServerListItem';
import './App.css';

type AuthMode = 'login' | 'register';

const AuthScreen: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const { login, register, loading, error } = useAuth();

  if (authMode === 'register') {
    return (
      <RegisterForm
        onRegister={register}
        loading={loading}
        error={error}
        onSwitchToLogin={() => setAuthMode('login')}
      />
    );
  }

  return (
    <LoginForm
      onLogin={login}
      loading={loading}
      error={error}
      onSwitchToRegister={() => setAuthMode('register')}
    />
  );
};

interface NexusInterfaceProps {
  currentView: 'server' | 'dms' | 'friends';
  onViewChange: (view: 'server' | 'dms' | 'friends') => void;
}

const NexusInterface: React.FC<NexusInterfaceProps> = ({ currentView, onViewChange }) => {
  const [servers, setServers] = useState<Server[]>([]);
  const [activeServer, setActiveServer] = useState<Server | null>(null);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [channelMessages, setChannelMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);
  const [showServerBrowser, setShowServerBrowser] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const messageInputRef = useRef<HTMLInputElement>(null);
  
  const { user, logout } = useAuth();
  const { messages, connected, joinChannel, clearMessages } = useSocket();

  // Load servers on component mount
  useEffect(() => {
    if (user) {
      loadUserServers();
    }
  }, [user]);

  // Server selection handler
  const handleServerSelect = useCallback(async (server: Server) => {
    await loadServerDetails(server.id);
    onViewChange('server');
  }, [onViewChange]);

  // Back to DMs handler
  const handleBackToDMs = useCallback(() => {
    onViewChange('dms');
    setActiveServer(null);
    setActiveChannel(null);
    setChannelMessages([]);
    clearMessages();
  }, [onViewChange, clearMessages]);

  // DMs view handler
  const handleShowDMs = useCallback(() => {
    onViewChange('dms');
    setActiveServer(null);
    setActiveChannel(null);
    setChannelMessages([]);
    clearMessages();
  }, [onViewChange, clearMessages]);

  // Friends view handler
  const handleShowFriends = useCallback(() => {
    onViewChange('friends');
    setActiveServer(null);
    setActiveChannel(null);
    setChannelMessages([]);
    clearMessages();
  }, [onViewChange, clearMessages]);


  // Update messages when socket messages change or active channel changes
  useEffect(() => {
    if (activeChannel) {
      // Filter messages for current channel
      const currentChannelMessages = messages.filter(msg => msg.channel_id === activeChannel.id);
      setChannelMessages(prev => {
        // Merge with existing messages, avoiding duplicates
        const existingIds = prev.map(m => m.id);
        const newMessages = currentChannelMessages.filter(m => !existingIds.includes(m.id));
        return [...prev, ...newMessages].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
    }
  }, [messages, activeChannel]);

  // Join channel when active channel changes
  useEffect(() => {
    if (activeChannel) {
      joinChannel(activeChannel.id);
      loadChannelMessages(activeChannel.id);
    }
    
    return () => {
      clearMessages();
    };
  }, [activeChannel]);

  const loadUserServers = async () => {
    try {
      const response = await serverAPI.getServers() as any;
      const servers = response?.servers || response?.data?.servers;
      if (servers) {
        setServers(servers);
      }
    } catch (error) {
      console.error('Failed to load servers:', error);
    }
  };

  const loadServerDetails = async (serverId: number) => {
    try {
      const response = await serverAPI.getServerById(serverId) as any;
      const server = response?.server || response?.data?.server;
      if (server) {
        setActiveServer(server);
        // Auto-select first channel
        if (server.channels && server.channels.length > 0) {
          setActiveChannel(server.channels[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load server details:', error);
    }
  };

  const loadChannelMessages = async (channelId: number) => {
    try {
      setMessagesLoading(true);
      const response = await messageAPI.getChannelMessages(channelId) as any;
      const messages = response?.messages || response?.data?.messages;
      if (messages) {
        setChannelMessages(messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setChannelMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  // Server management handlers
  const handleServerDeleted = useCallback(() => {
    // Remove server from list and navigate to DMs
    if (activeServer) {
      setServers(prev => prev.filter(s => s.id !== activeServer.id));
      setActiveServer(null);
      setActiveChannel(null);
      setChannelMessages([]);
      clearMessages();
      onViewChange('friends');
    }
  }, [activeServer, onViewChange, clearMessages]);

  const handleServerLeft = useCallback(() => {
    // Same as delete from user perspective
    handleServerDeleted();
  }, [handleServerDeleted]);

  // Optimized channel selection
  const handleChannelSelect = useCallback((channel: Channel) => {
    setActiveChannel(channel);
  }, []);

  // Memoized computations for performance
  const sortedServers = useMemo(() => {
    return [...servers].sort((a, b) => a.name.localeCompare(b.name));
  }, [servers]);

  const activeChannels = useMemo(() => {
    return activeServer?.channels || [];
  }, [activeServer?.channels]);

  // Keyboard shortcut handlers
  const handleQuickSwitcher = () => {
    setShowQuickSwitcher(true);
  };

  const handleFocusMessageInput = () => {
    messageInputRef.current?.focus();
  };

  const handleChannelNavigation = (direction: 'up' | 'down') => {
    if (!activeServer?.channels || !activeChannel) return;
    
    const currentIndex = activeServer.channels.findIndex(ch => ch.id === activeChannel.id);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(activeServer.channels.length - 1, currentIndex + 1);
    
    if (newIndex !== currentIndex) {
      setActiveChannel(activeServer.channels[newIndex]);
    }
  };

  const handleEscape = () => {
    setShowQuickSwitcher(false);
  };

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    onQuickSwitcher: handleQuickSwitcher,
    onFocusMessageInput: handleFocusMessageInput,
    onGoToChannel: handleChannelNavigation,
    onEscape: handleEscape
  });

  return (
    <div className="h-screen bg-nexus-darkest text-white flex gap-3 p-3 no-select">
      {/* Background decoration */}
      <div className="fixed inset-0 bg-gradient-to-br from-nexus-primary/5 via-transparent to-nexus-accent/5 pointer-events-none"></div>
      {/* Server List Sidebar */}
      <div className="w-16 nexus-glass flex flex-col items-center py-4 relative z-50 nexus-shadow-md contain-layout gpu-accelerated">
        {/* Home/DM Button */}
        <div className="relative group mb-3">
          <button
            onClick={handleShowDMs}
            className={`w-12 h-12 flex items-center justify-center transition-all duration-150 ${
              (currentView === 'dms' || currentView === 'friends') 
                ? 'nexus-gradient text-white rounded-2xl' 
                : 'nexus-card text-gray-300 rounded-3xl hover:nexus-gradient hover:text-white hover:rounded-2xl'
            }`}
            title="Direct Messages"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              <path d="M18 12c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0 1.5c-2 0-6 1-6 3v1.5h6v-4.5z" opacity="0.6"/>
            </svg>
          </button>
          
          {/* Active indicator pill */}
          <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 nexus-gradient rounded-full transition-all duration-300 ${
            (currentView === 'dms' || currentView === 'friends') ? 'w-1.5 h-8 nexus-shadow-glow' : 'w-0 h-0'
          }`}></div>
          
          {/* Tooltip */}
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 nexus-glass-elevated text-white px-4 py-2 rounded-xl text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[9999] whitespace-nowrap scale-95 group-hover:scale-100">
            Direct Messages
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 nexus-glass rotate-45 border-l border-t border-nexus-border-primary"></div>
          </div>
        </div>
        
        {/* Server Separator */}
        <div className="mt-3 mb-3">
          <div className="h-0.5 w-8 bg-gray-600 rounded-full mx-auto opacity-60"></div>
        </div>
        
        {/* Server List */}
        {sortedServers.map((server) => (
          <ServerListItem
            key={server.id}
            server={server}
            isActive={activeServer?.id === server.id}
            onSelect={handleServerSelect}
          />
        ))}
        
        {/* Add Server Button */}
        <div className="relative group mb-3">
          <button
            onClick={() => setShowServerBrowser(true)}
            className="w-12 h-12 nexus-card text-nexus-accent rounded-3xl hover:nexus-gradient-accent hover:text-white hover:rounded-2xl flex items-center justify-center transition-all duration-150 border-2 border-dashed border-nexus-border-primary hover:border-transparent"
            title="Add Server"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6"/>
            </svg>
            <div className="absolute inset-0 bg-gradient-to-br from-nexus-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          
          {/* Tooltip */}
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 nexus-glass-elevated text-white px-4 py-2 rounded-xl text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[9999] whitespace-nowrap scale-95 group-hover:scale-100">
            Add Server
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 nexus-glass rotate-45 border-l border-t border-nexus-border-primary"></div>
          </div>
        </div>
      </div>
      
      {/* Channel/DM Sidebar */}
      <div className="w-64 nexus-glass flex flex-col no-select relative z-20 nexus-shadow-md contain-layout gpu-accelerated rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b border-gray-700 flex items-center justify-between px-6 no-select bg-nexus-bg-card">
          <div className="flex items-center no-select">
            {currentView === 'server' && activeServer ? (
              <div className="flex items-center">
                <div className="w-8 h-8 nexus-gradient rounded-xl mr-3 flex items-center justify-center text-xs font-bold text-white nexus-shadow-md nexus-interactive">
                  {activeServer.name[0].toUpperCase()}
                </div>
                <span className="font-semibold text-nexus-text-primary text-lg">{activeServer.name}</span>
              </div>
            ) : (
              <span className="font-semibold text-nexus-text-primary text-lg">Nexus</span>
            )}
          </div>
          {currentView === 'server' && activeServer && (
            <button 
              onClick={() => setShowServerSettings(true)}
              className="text-gray-400 hover:text-white p-1 rounded transition-colors" 
              title="Server Settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </button>
          )}
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {currentView === 'server' && activeServer && (
            <div className="p-4">
              <div className="text-nexus-text-subtle text-xs font-bold uppercase mb-4 px-2 tracking-wider">
                Text Channels
              </div>
              {activeChannels.map((channel) => (
                <div
                  key={channel.id}
                  onClick={() => handleChannelSelect(channel)}
                  className={`px-4 py-3 text-nexus-text-secondary hover:bg-nexus-surface-primary rounded-xl cursor-pointer transition-colors duration-150 mb-2 flex items-center group ${
                    activeChannel?.id === channel.id 
                      ? 'nexus-gradient text-white' 
                      : 'hover:text-nexus-text-primary'
                  }`}
                >
                  <span className="text-nexus-text-muted mr-2 group-hover:text-current">#</span>
                  <span className="font-medium">{channel.name}</span>
                  {activeChannel?.id === channel.id && (
                    <div className="ml-auto w-2 h-2 nexus-gradient-accent rounded-full nexus-shadow-glow animate-pulse"></div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {(currentView === 'dms' || currentView === 'friends') && (
            <div className="flex-1">
              {/* Friends Section */}
              <div className="px-2 pt-4 pb-2">
                <button 
                  onClick={handleShowFriends}
                  className={`w-full flex items-center px-3 py-2.5 transition-all duration-200 rounded-xl group relative overflow-hidden nexus-interactive ${
                    currentView === 'friends' 
                      ? 'nexus-gradient text-white nexus-shadow-glow' 
                      : 'text-nexus-text-secondary hover:bg-gradient-to-r hover:from-nexus-primary/20 hover:to-nexus-accent/20 hover:text-white hover:nexus-shadow-md'
                  }`}
                >
                  <div className="flex items-center space-x-2 relative z-10">
                    <span className="font-semibold">Friends</span>
                  </div>
                  
                  {/* Active indicator */}
                  {currentView === 'friends' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-2 h-2 nexus-gradient-accent rounded-full nexus-shadow-glow animate-pulse"></div>
                  )}
                  
                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-nexus-primary/10 to-nexus-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl"></div>
                </button>
              </div>
              
              {/* Direct Messages Section */}
              <div className="px-4 pt-2">
                <div className="flex items-center justify-between text-nexus-text-subtle text-xs font-bold uppercase mb-2 px-2 tracking-wider">
                  <span>Direct Messages</span>
                  <button className="w-4 h-4 text-nexus-text-subtle hover:text-nexus-text-primary transition-colors" title="Create DM">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 6v12m6-6H6"/>
                    </svg>
                  </button>
                </div>
                {/* Separator with matching color */}
                <div className="h-px bg-gray-600 opacity-40 mb-4"></div>
              </div>
              
              <DMList />
            </div>
          )}
        </div>
        
        {/* User Info Panel */}
        <div className="h-18 bg-nexus-bg-card flex items-center px-4 border-t border-gray-700">
          <div className="flex items-center flex-1 min-w-0">
            {/* User Avatar */}
            <div className="relative mr-3 my-1.5">
              <div className="w-10 h-10 nexus-gradient rounded-full flex items-center justify-center ring-2 ring-transparent hover:ring-nexus-primary transition-all duration-300 nexus-shadow-md nexus-interactive">
                <span className="text-sm font-bold text-white">
                  {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              {/* Status Orb - positioned for optimal visibility */}
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-800 ${
                connected ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
            </div>
            
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">
                {user?.username || user?.email?.split('@')[0] || 'Unknown User'}
              </div>
              <div className="text-xs text-gray-400">
                {connected ? 'Online' : 'Connecting...'}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowUserSettings(!showUserSettings)}
              className="w-9 h-9 flex items-center justify-center hover:nexus-surface-primary rounded-xl text-nexus-text-muted hover:text-nexus-primary transition-all duration-200 group nexus-interactive relative overflow-hidden"
              title="User Settings"
            >
              <svg className="w-5 h-5 z-10 relative" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <div className="absolute inset-0 bg-nexus-primary/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
            <button
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center hover:bg-red-500/20 rounded-xl text-nexus-text-muted hover:text-red-400 transition-all duration-200 group nexus-interactive relative overflow-hidden"
              title="Logout"
            >
              <svg className="w-5 h-5 z-10 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <div className="absolute inset-0 bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col nexus-glass nexus-shadow-md relative z-10 contain-layout gpu-accelerated rounded-2xl overflow-hidden">
        
        {currentView === 'dms' && (
          <DMChat />
        )}
        
        {currentView === 'friends' && (
          <FriendsList />
        )}
        
        {currentView === 'server' && activeChannel && (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-gray-700 flex items-center px-6 text-white bg-nexus-bg-card">
              <div className="flex items-center">
                <div className="w-8 h-8 nexus-gradient rounded-xl mr-3 flex items-center justify-center nexus-shadow-sm">
                  <span className="text-sm font-bold">#</span>
                </div>
                <div>
                  <span className="font-semibold text-nexus-text-primary text-lg">{activeChannel.name}</span>
                  {activeChannel.description && (
                    <div className="text-nexus-text-muted text-sm">{activeChannel.description}</div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Messages Area */}
            <MessageList
              channelId={activeChannel.id}
              messages={channelMessages}
              loading={messagesLoading}
            />
            
            {/* Message Input */}
            <MessageInput
              ref={messageInputRef}
              channelId={activeChannel.id}
              channelName={activeChannel.name}
            />
          </>
        )}
        
        {currentView === 'server' && !activeChannel && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="nexus-card p-8 rounded-2xl nexus-shadow-lg">
                <div className="text-6xl mb-6 nexus-float">📝</div>
                <div className="text-xl font-semibold mb-3 text-nexus-text-primary">Welcome to {activeServer?.name}</div>
                <div className="text-nexus-text-secondary text-sm mb-6">Select a channel from the sidebar to start chatting</div>
                <div className="w-16 h-1 nexus-gradient-accent rounded-full mx-auto opacity-50"></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* User Settings Modal */}
      {showUserSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-nexus-dark p-6 rounded-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">User Settings</h3>
              <button
                onClick={() => setShowUserSettings(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Username
                </label>
                <div className="text-white bg-nexus-darker p-2 rounded">
                  {user?.username || 'Not set'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <div className="text-white bg-nexus-darker p-2 rounded">
                  {user?.email || 'Not set'}
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => setShowUserSettings(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Server Browser Modal */}
      {showServerBrowser && (
        <ServerBrowser onClose={() => setShowServerBrowser(false)} />
      )}
      
      {/* Server Settings Modal */}
      {showServerSettings && activeServer && user && (
        <ServerSettingsModal
          server={activeServer}
          user={user}
          isOpen={showServerSettings}
          onClose={() => setShowServerSettings(false)}
          onServerDeleted={handleServerDeleted}
          onServerLeft={handleServerLeft}
        />
      )}
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'server' | 'dms' | 'friends'>('dms');

  const handleSwitchToDMs = () => {
    setCurrentView('dms');
  };

  if (loading) {
    return (
      <div className="h-screen bg-discord-darkest text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold mb-2">Nexus</div>
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <SocketProvider>
      <FriendsProvider>
        <DMProvider onSwitchToDMs={handleSwitchToDMs}>
          <NexusInterface currentView={currentView} onViewChange={setCurrentView} />
        </DMProvider>
      </FriendsProvider>
    </SocketProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
