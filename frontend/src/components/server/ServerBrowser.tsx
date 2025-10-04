import React, { useState, useEffect } from 'react';
import { Server } from '../../types';
import { serverAPI } from '../../services/api';
import { getAvatarColor } from '../../utils/avatarColors';
import './ServerBrowser.css';

interface ServerBrowserProps {
  onClose: () => void;
}

type TabType = 'create' | 'join';

const ServerBrowser: React.FC<ServerBrowserProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('create');
  
  // Create Server state
  const [serverName, setServerName] = useState('');
  const [serverDescription, setServerDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Join Server state
  const [inviteCode, setInviteCode] = useState('');
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(false);
  const [joiningServer, setJoiningServer] = useState<number | null>(null);
  const [joiningByCode, setJoiningByCode] = useState(false);
  
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Clear error when switching tabs
    setError('');
    
    if (activeTab === 'join') {
      loadPublicServers();
    }
  }, [activeTab]);

  const loadPublicServers = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Loading public servers...');
      const response = await serverAPI.getPublicServers();
      console.log('Public servers response:', response);
      
      if (response.data) {
        setServers(response.data);
        console.log('Set servers:', response.data);
      } else {
        console.log('No data in response:', response);
        setServers([]);
      }
    } catch (err: any) {
      console.error('Error loading public servers:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load servers');
      setServers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverName.trim()) {
      setError('Server name is required');
      return;
    }
    
    try {
      setCreating(true);
      setError('');
      
      await serverAPI.createServer({
        name: serverName.trim(),
        description: serverDescription.trim(),
        isPublic: isPublic
      });
      
      // Reload the page to show the new server
      window.location.reload();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create server');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) {
      setError('Invite code is required');
      return;
    }
    
    try {
      setJoiningByCode(true);
      setError('');
      
      await serverAPI.joinServer({ inviteCode: inviteCode.trim() });
      
      // Reload the page to show the joined server
      window.location.reload();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to join server');
    } finally {
      setJoiningByCode(false);
    }
  };

  const handleJoinServer = async (server: Server) => {
    try {
      setJoiningServer(server.id);
      setError('');

      console.log('Attempting to join server:', server);
      console.log('Using invite code:', server.invite_code);
      
      const result = await serverAPI.joinServer({ inviteCode: server.invite_code });
      console.log('Join server result:', result);
      
      // Reload the page to show the joined server
      window.location.reload();
    } catch (err: any) {
      console.error('Join server error:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to join server';
      console.log('Error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setJoiningServer(null);
    }
  };

  const filteredServers = servers.filter(server =>
    server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    server.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="nexus-glass border border-nexus-border-primary rounded-2xl w-full max-w-[420px] max-h-[85vh] flex flex-col nexus-shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-nexus-border-primary bg-nexus-bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl nexus-gradient flex items-center justify-center nexus-shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-nexus-text-primary">Server Setup</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-nexus-text-muted hover:text-white hover:bg-nexus-surface-primary transition-colors duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex nexus-card mx-6 mt-4 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
              activeTab === 'create'
                ? 'nexus-gradient text-white nexus-shadow-glow'
                : 'text-nexus-text-secondary hover:text-white hover:bg-nexus-surface-primary'
            }`}
          >
            Create Server
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
              activeTab === 'join'
                ? 'nexus-gradient text-white nexus-shadow-glow'
                : 'text-nexus-text-secondary hover:text-white hover:bg-nexus-surface-primary'
            }`}
          >
            Join Server
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {activeTab === 'create' ? (
            <div className="space-y-6 pt-2">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 nexus-gradient rounded-xl flex items-center justify-center nexus-shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-nexus-text-primary mb-2">Create Your Server</h3>
                <p className="text-sm text-nexus-text-secondary max-w-sm mx-auto">
                  Your server is where you and your friends hang out. Make yours and start talking.
                </p>
              </div>
              
              <form onSubmit={handleCreateServer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-nexus-text-secondary mb-2">
                    Server Name
                  </label>
                  <input
                    type="text"
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    placeholder="My Awesome Server"
                    maxLength={100}
                    className="w-full nexus-card border border-nexus-border-secondary text-nexus-text-primary px-4 py-3 rounded-xl focus:border-nexus-primary focus:outline-none focus:ring-2 focus:ring-nexus-primary/20 transition-all duration-150 placeholder:text-nexus-text-muted"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-nexus-text-secondary mb-2">
                    Description <span className="text-nexus-text-muted">(Optional)</span>
                  </label>
                  <textarea
                    value={serverDescription}
                    onChange={(e) => setServerDescription(e.target.value)}
                    placeholder="Tell people what this server is about..."
                    maxLength={500}
                    rows={3}
                    className="w-full nexus-card border border-nexus-border-secondary text-nexus-text-primary px-4 py-3 rounded-xl focus:border-nexus-primary focus:outline-none focus:ring-2 focus:ring-nexus-primary/20 transition-all duration-150 placeholder:text-nexus-text-muted resize-none"
                  />
                </div>
                
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="w-4 h-4 text-nexus-accent bg-nexus-bg-card border-nexus-border-secondary rounded focus:ring-nexus-accent focus:ring-2"
                    />
                    <span className="text-sm font-medium text-nexus-text-secondary">
                      Make this server public <span className="text-nexus-text-muted">(Others can find and join it)</span>
                    </span>
                  </label>
                </div>
                
                <button
                  type="submit"
                  disabled={creating || !serverName.trim()}
                  className="w-full nexus-gradient hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl text-white font-medium transition-all duration-150 nexus-shadow-md hover:nexus-shadow-glow"
                >
                  {creating ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    'Create Server'
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6 pt-2">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 nexus-gradient-accent rounded-xl flex items-center justify-center nexus-shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-nexus-text-primary mb-2">Join a Server</h3>
                <p className="text-sm text-nexus-text-secondary max-w-sm mx-auto">
                  Enter an invite code to join an existing server or browse available servers.
                </p>
              </div>
              
              {/* Join by Invite Code */}
              <div>
                <label className="block text-sm font-medium text-nexus-text-secondary mb-2">
                  Invite Code
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter invite code..."
                    className="flex-1 nexus-card border border-nexus-border-secondary text-nexus-text-primary px-4 py-3 rounded-xl focus:border-nexus-accent focus:outline-none focus:ring-2 focus:ring-nexus-accent/20 transition-all duration-150 placeholder:text-nexus-text-muted"
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
                  />
                  <button
                    type="button"
                    onClick={handleJoinByCode}
                    disabled={joiningByCode || !inviteCode.trim()}
                    className="nexus-gradient-accent hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl text-white font-medium transition-all duration-150 nexus-shadow-md"
                  >
                    {joiningByCode ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Join'
                    )}
                  </button>
                </div>
              </div>
              
              {/* Divider */}
              <div className="flex items-center">
                <div className="flex-1 h-px bg-nexus-border-primary opacity-60"></div>
                <span className="px-4 text-sm text-nexus-text-muted font-medium">OR</span>
                <div className="flex-1 h-px bg-nexus-border-primary opacity-60"></div>
              </div>
              
              {/* Browse Public Servers */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-nexus-text-primary">Browse Public Servers</h4>
                
                {/* Search */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-nexus-text-muted">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search servers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full nexus-card border border-nexus-border-secondary text-nexus-text-primary pl-10 pr-4 py-2.5 rounded-xl focus:border-nexus-accent focus:outline-none focus:ring-2 focus:ring-nexus-accent/20 transition-all duration-150 placeholder:text-nexus-text-muted text-sm"
                  />
                </div>
                
                {/* Server List */}
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="w-6 h-6 border-2 border-nexus-accent border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <div className="text-nexus-text-muted text-sm">Loading servers...</div>
                      </div>
                    </div>
                  ) : filteredServers.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-10 h-10 mx-auto mb-3 nexus-card rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-nexus-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div className="text-nexus-text-muted text-sm">
                        {searchTerm ? 'No servers found' : 'No public servers available'}
                      </div>
                    </div>
                  ) : (
                    filteredServers.map((server) => (
                      <div key={server.id} className="nexus-card border border-nexus-border-secondary p-3 rounded-xl flex items-center space-x-3 hover:bg-nexus-surface-primary hover:border-nexus-border-accent transition-all duration-150 group">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-medium text-sm flex-shrink-0 nexus-shadow-sm" style={{ backgroundColor: server.icon_url ? 'transparent' : getAvatarColor(server.name) }}>
                          {server.icon_url ? (
                            <img src={server.icon_url} alt={server.name} className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            server.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="text-nexus-text-primary font-medium text-sm truncate group-hover:text-white transition-colors">{server.name}</h4>
                          {server.description && (
                            <p className="text-nexus-text-muted text-xs mt-1 truncate">{server.description}</p>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleJoinServer(server)}
                          disabled={joiningServer === server.id}
                          className="nexus-gradient-accent hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded-lg text-white text-xs font-medium transition-all duration-150 flex-shrink-0 nexus-shadow-sm"
                        >
                          {joiningServer === server.id ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            'Join'
                          )}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServerBrowser;