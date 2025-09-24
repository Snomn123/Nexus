import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { serverAPI } from '../services/api';
import { Server } from '../types';

interface HomeProps {
  onWorkspaceSelect: (workspace: Server) => void;
}

export const Home: React.FC<HomeProps> = ({ onWorkspaceSelect }) => {
  const [workspaces, setWorkspaces] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [userStatus, setUserStatus] = useState<'online' | 'busy' | 'away'>('online');
  
  const { user, logout } = useAuth();
  const { connected } = useSocket();

  useEffect(() => {
    loadUserWorkspaces();
  }, []);

  const loadUserWorkspaces = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await serverAPI.getServers() as any;
      const workspaces = response?.servers || response?.data?.servers;
      if (workspaces) {
        setWorkspaces(workspaces);
      } else {
        setWorkspaces([]);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
      setError('Failed to load workspaces');
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceClick = (workspace: Server) => {
    if (!connected) {
      alert('Please wait for the connection to establish before joining a workspace.');
      return;
    }
    onWorkspaceSelect(workspace);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="h-screen bg-nexus-darkest text-white flex">
      {/* Left Sidebar */}
      <div className="w-80 bg-nexus-dark flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-gray-600 flex items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 nexus-gradient rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <div className="text-2xl font-bold text-nexus-primary">Nexus</div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white transition-colors text-sm bg-nexus-darker px-3 py-1 rounded-lg"
            title="Logout"
          >
            Sign Out
          </button>
        </div>

        {/* Connection Status */}
        <div className="px-6 py-4 bg-nexus-darker nexus-glass border-b border-gray-700">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 transition-all duration-300 ${connected ? 'bg-nexus-accent shadow-lg shadow-emerald-500/30' : 'bg-nexus-warning animate-pulse'}`}></div>
            <div className="flex-1">
              <div className="text-sm font-medium">
                {connected ? 'Connected' : 'Connecting...'}
              </div>
              <div className="text-xs text-gray-400">
                {connected ? 'Real-time collaboration active' : 'Establishing secure connection...'}
              </div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 nexus-gradient rounded-xl flex items-center justify-center mr-4 nexus-shadow">
                <span className="text-lg font-bold">
                  {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <div>
                <div className="font-semibold text-nexus-text-primary">{user?.username || user?.email}</div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    userStatus === 'online' ? 'bg-nexus-accent' :
                    userStatus === 'busy' ? 'bg-nexus-error' : 'bg-nexus-warning'
                  }`}></div>
                  <select 
                    value={userStatus} 
                    onChange={(e) => setUserStatus(e.target.value as 'online' | 'busy' | 'away')}
                    className="text-xs bg-transparent text-gray-400 border-none outline-none cursor-pointer"
                  >
                    <option value="online">Online</option>
                    <option value="busy">Busy</option>
                    <option value="away">Away</option>
                  </select>
                </div>
              </div>
            </div>
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`px-2 py-1 rounded-lg text-xs transition-all ${
                focusMode ? 'bg-nexus-primary text-white' : 'text-gray-400 hover:bg-nexus-darker'
              }`}
              title="Toggle Focus Mode"
            >
              {focusMode ? '🔕' : '🔔'}
            </button>
          </div>
        </div>

        {/* Workspaces List */}
        <div className="flex-1 p-6">
          <h2 className="text-lg font-semibold mb-4 text-nexus-primary">Your Workspaces</h2>
          
          {loading ? (
            <div className="text-center text-gray-400">
              <div className="animate-spin w-8 h-8 border-2 border-nexus-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              Loading workspaces...
            </div>
          ) : error ? (
            <div className="text-center text-nexus-error">
              <div className="mb-2">⚠️ {error}</div>
              <button
                onClick={loadUserWorkspaces}
                className="text-sm text-nexus-primary hover:text-nexus-primary-light transition-colors"
              >
                Try again
              </button>
            </div>
          ) : workspaces.length === 0 ? (
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-4 animate-float">🏢</div>
              <div className="text-lg font-medium mb-2">No workspaces yet</div>
              <div className="text-sm">Join a workspace to start collaborating with your team!</div>
            </div>
          ) : (
            <div className="space-y-3">
              {workspaces.map((workspace, index) => {
                const hasNewActivity = index === 0; // Mock activity for demo
                const memberCount = Math.floor(Math.random() * 50) + 5; // Mock member count
                
                return (
                  <div
                    key={workspace.id}
                    onClick={() => handleWorkspaceClick(workspace)}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 nexus-shadow relative ${
                      connected 
                        ? 'bg-nexus-darker hover:bg-nexus-medium border-transparent hover:border-nexus-primary hover:scale-[1.02]' 
                        : 'bg-gray-800 border-gray-600 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {hasNewActivity && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-nexus-accent rounded-full animate-pulse"></div>
                    )}
                    <div className="flex items-center">
                      <div className="w-12 h-12 nexus-gradient rounded-xl flex items-center justify-center mr-4 relative">
                        <span className="text-lg font-bold">
                          {workspace.name[0].toUpperCase()}
                        </span>
                        {hasNewActivity && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-nexus-accent rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-white">!</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-semibold text-white">{workspace.name}</div>
                          {hasNewActivity && (
                            <span className="text-xs bg-nexus-accent px-2 py-1 rounded-full text-white font-medium">
                              New
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 flex items-center justify-between">
                          <span>{workspace.description || 'Team workspace'}</span>
                          <span className="text-xs flex items-center">
                            <span className="w-2 h-2 bg-nexus-accent rounded-full mr-1"></span>
                            {memberCount} members
                          </span>
                        </div>
                      </div>
                      <div className="text-nexus-primary ml-2">
                        →
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Welcome */}
      <div className="flex-1 flex items-center justify-center bg-nexus-darkest">
        <div className="text-center max-w-lg">
          <div className="text-6xl mb-6 animate-float">🚀</div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-nexus-primary to-nexus-primary-light bg-clip-text text-transparent">
            Welcome to Nexus
          </h1>
          <p className="text-gray-400 mb-8 text-lg leading-relaxed">
            Choose a workspace from the sidebar to start collaborating with your team in real-time.
          </p>
          
          {!connected && (
            <div className="nexus-glass border border-nexus-warning/30 rounded-xl p-6 text-amber-200 nexus-shadow">
              <div className="flex items-center justify-center mb-3">
                <div className="w-4 h-4 bg-nexus-warning rounded-full animate-pulse mr-2"></div>
                <span className="font-medium">Establishing Connection</span>
              </div>
              <div className="text-sm opacity-80">
                Please wait while we securely connect you to Nexus.
              </div>
            </div>
          )}

          {connected && (
            <div className="nexus-glass border border-nexus-accent/30 rounded-xl p-6 text-emerald-200 nexus-shadow">
              <div className="flex items-center justify-center mb-3">
                <div className="w-4 h-4 bg-nexus-accent rounded-full mr-2 shadow-lg shadow-emerald-500/30"></div>
                <span className="font-medium">Connected ✨</span>
              </div>
              <div className="text-sm opacity-80">
                You're connected and ready to collaborate!
              </div>
            </div>
          )}
          
          <div className="mt-8 text-sm text-gray-500">
            Secure • Real-time • Collaborative
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;