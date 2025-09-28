import React, { useState } from 'react';
import { Server, User } from '../types';
import { serverAPI } from '../services/api';

interface ServerSettingsModalProps {
  server: Server;
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onServerDeleted?: () => void;
  onServerLeft?: () => void;
}

const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({
  server,
  user,
  isOpen,
  onClose,
  onServerDeleted,
  onServerLeft
}) => {
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [error, setError] = useState('');

  const isOwner = server.owner_id === user.id;

  const handleDeleteServer = async () => {
    if (!isOwner) return;
    
    try {
      setLoading(true);
      setError('');
      await serverAPI.deleteServer(server.id);
      onServerDeleted?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete server');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveServer = async () => {
    if (isOwner) return; // Owners can't leave, they must delete
    
    try {
      setLoading(true);
      setError('');
      await serverAPI.leaveServer(server.id);
      onServerLeft?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to leave server');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="nexus-glass max-w-md w-full mx-4 rounded-2xl nexus-shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-nexus-border-primary">
          <div className="flex items-center">
            <div className="w-8 h-8 nexus-gradient rounded-xl mr-3 flex items-center justify-center text-xs font-bold text-white nexus-shadow-md">
              {server.name[0].toUpperCase()}
            </div>
            <h3 className="text-lg font-semibold text-nexus-text-primary">
              {server.name} Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-nexus-surface-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="text-sm text-nexus-text-secondary">
              <p><strong>Server ID:</strong> {server.id}</p>
              <p><strong>Created:</strong> {new Date(server.created_at).toLocaleDateString()}</p>
              <p><strong>Your Role:</strong> {isOwner ? 'Owner' : 'Member'}</p>
              {server.description && (
                <p><strong>Description:</strong> {server.description}</p>
              )}
            </div>

            <div className="border-t border-nexus-border-primary pt-4">
              {isOwner ? (
                <div className="space-y-4">
                  <div className="text-sm text-nexus-text-secondary">
                    <p className="font-medium text-nexus-text-primary mb-2">Server Management</p>
                    <p>As the server owner, you can delete this server. This action cannot be undone and will remove all channels, messages, and members.</p>
                  </div>
                  
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={loading}
                      className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete Server
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                        <p className="text-red-200 text-sm font-medium mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          Confirm Server Deletion
                        </p>
                        <p className="text-red-300 text-xs">
                          This will permanently delete "{server.name}" and all its content. This cannot be undone.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteServer}
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Deleting...' : 'Delete Server'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-nexus-text-secondary">
                    <p className="font-medium text-nexus-text-primary mb-2">Leave Server</p>
                    <p>You can leave this server at any time. You'll need a new invite to rejoin.</p>
                  </div>
                  
                  {!showLeaveConfirm ? (
                    <button
                      onClick={() => setShowLeaveConfirm(true)}
                      disabled={loading}
                      className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Leave Server
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                        <p className="text-yellow-200 text-sm font-medium mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          Confirm Leave Server
                        </p>
                        <p className="text-yellow-300 text-xs">
                          Are you sure you want to leave "{server.name}"? You'll need an invite to rejoin.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowLeaveConfirm(false)}
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleLeaveServer}
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Leaving...' : 'Leave Server'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerSettingsModal;