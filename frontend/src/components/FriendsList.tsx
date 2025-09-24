import React, { useState } from 'react';
import { useFriends } from '../contexts/FriendsContext';
import { useDM } from '../contexts/DMContext';
import { useAuth } from '../contexts/AuthContext';
import { Friend, FriendRequest } from '../types';
import { getAvatarColor } from '../utils/avatarColors';
import './FriendsList.css';

type FriendsTab = 'online' | 'all' | 'pending' | 'add';

const FriendsList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FriendsTab>('online');
  const [addFriendInput, setAddFriendInput] = useState('');
  const [addFriendError, setAddFriendError] = useState('');
  const [addFriendSuccess, setAddFriendSuccess] = useState('');

  const {
    friends,
    friendRequests,
    loading,
    error,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend
  } = useFriends();

  const { startDirectConversation } = useDM();
  const { user } = useAuth();

  const onlineFriends = friends.filter(friend => friend.status === 'online');
  const pendingRequests = friendRequests.filter(req => req.status === 'pending');

  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddFriendError('');
    setAddFriendSuccess('');

    const username = addFriendInput.trim();
    
    if (!username) {
      setAddFriendError('Please enter a username');
      return;
    }

    // Check if trying to add self
    if (user && (username.toLowerCase() === user.username?.toLowerCase() || username.toLowerCase() === user.email?.toLowerCase())) {
      setAddFriendError('You cannot add yourself as a friend');
      return;
    }

    // Check if already friends
    const isAlreadyFriend = friends.some(friend => 
      friend.username?.toLowerCase() === username.toLowerCase()
    );
    
    if (isAlreadyFriend) {
      setAddFriendError('You are already friends with this user');
      return;
    }

    // Check if request already pending
    const hasPendingRequest = friendRequests.some(request => 
      request.sender_username?.toLowerCase() === username.toLowerCase() ||
      request.receiver_username?.toLowerCase() === username.toLowerCase()
    );
    
    if (hasPendingRequest) {
      setAddFriendError('A friend request with this user is already pending');
      return;
    }

    try {
      await sendFriendRequest(username);
      setAddFriendSuccess(`Friend request sent to ${username}`);
      setAddFriendInput('');
    } catch (err) {
      // Error is already set in context
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await acceptFriendRequest(requestId);
    } catch (err) {
      console.error('Failed to accept friend request:', err);
    }
  };

  const handleDeclineRequest = async (requestId: number) => {
    try {
      await declineFriendRequest(requestId);
    } catch (err) {
      console.error('Failed to decline friend request:', err);
    }
  };

  const handleRemoveFriend = async (friendId: number, username: string) => {
    if (window.confirm(`Are you sure you want to remove ${username} from your friends?`)) {
      try {
        await removeFriend(friendId);
      } catch (err) {
        console.error('Failed to remove friend:', err);
      }
    }
  };

  const handleStartDM = async (friend: Friend) => {
    try {
      await startDirectConversation(friend.id);
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#3ba55c';
      case 'away': return '#faa61a';
      case 'busy': return '#f04747';
      default: return '#747f8d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'busy': return 'Do Not Disturb';
      default: return 'Offline';
    }
  };

  const renderFriend = (friend: Friend) => (
    <div key={friend.id} className="friend-item">
      <div className="friend-avatar">
        {friend.avatar_url ? (
          <img src={friend.avatar_url} alt={friend.username} />
        ) : (
          <div 
            className="avatar-placeholder"
            style={{ backgroundColor: getAvatarColor(friend.username) }}
          >
            {friend.username.charAt(0).toUpperCase()}
          </div>
        )}
        <div 
          className="status-indicator" 
          style={{ backgroundColor: getStatusColor(friend.status) }}
        />
      </div>
      <div className="friend-info">
        <div className="friend-username">{friend.username}</div>
        <div className="friend-status">{getStatusText(friend.status)}</div>
      </div>
      <div className="friend-actions">
        <button
          className="action-btn message-btn"
          onClick={() => handleStartDM(friend)}
          title="Send Message"
        >
          💬
        </button>
        <button
          className="action-btn remove-btn"
          onClick={() => handleRemoveFriend(friend.id, friend.username)}
          title="Remove Friend"
        >
          🗑️
        </button>
      </div>
    </div>
  );

  const renderPendingRequest = (request: FriendRequest) => (
    <div key={request.id} className="friend-request-item">
      <div className="friend-avatar">
        {request.sender_avatar_url ? (
          <img src={request.sender_avatar_url} alt={request.sender_username} />
        ) : (
          <div 
            className="avatar-placeholder"
            style={{ backgroundColor: getAvatarColor(request.sender_username) }}
          >
            {request.sender_username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="friend-info">
        <div className="friend-username">{request.sender_username}</div>
        <div className="request-text">Incoming Friend Request</div>
      </div>
      <div className="friend-actions">
        <button
          className="action-btn accept-btn"
          onClick={() => handleAcceptRequest(request.id)}
          title="Accept"
        >
          ✅
        </button>
        <button
          className="action-btn decline-btn"
          onClick={() => handleDeclineRequest(request.id)}
          title="Decline"
        >
          ❌
        </button>
      </div>
    </div>
  );

  const renderAddFriend = () => (
    <div className="add-friend-section">
      <h3>Add Friend</h3>
      <p>You can add friends with their Discord username.</p>
      
      <form onSubmit={handleSendFriendRequest} className="add-friend-form">
        <div className="input-group">
          <input
            type="text"
            value={addFriendInput}
            onChange={(e) => setAddFriendInput(e.target.value)}
            placeholder="Enter a Username"
            className="add-friend-input"
          />
          <button type="submit" className="send-request-btn" disabled={loading}>
            Send Friend Request
          </button>
        </div>
      </form>

      {/* Status Messages */}
      {(addFriendError || addFriendSuccess || error) && (
        <div className="mt-4">
          {addFriendError && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-3 mb-3">
              <div className="flex items-center text-red-400">
                <span className="mr-2">⚠️</span>
                <span className="text-sm">{addFriendError}</span>
              </div>
            </div>
          )}
          {addFriendSuccess && (
            <div className="bg-green-500 bg-opacity-10 border border-green-500 rounded-lg p-3 mb-3">
              <div className="flex items-center text-green-400">
                <span className="mr-2">✅</span>
                <span className="text-sm">{addFriendSuccess}</span>
              </div>
            </div>
          )}
          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-3">
              <div className="flex items-center text-red-400">
                <span className="mr-2">⚠️</span>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return <div className="loading">Loading...</div>;
    }

    switch (activeTab) {
      case 'online':
        return (
          <div className="friends-content">
            <h3>Online — {onlineFriends.length}</h3>
            {onlineFriends.length === 0 ? (
              <div className="empty-state">No friends online</div>
            ) : (
              onlineFriends.map(renderFriend)
            )}
          </div>
        );

      case 'all':
        return (
          <div className="friends-content">
            <h3>All Friends — {friends.length}</h3>
            {friends.length === 0 ? (
              <div className="empty-state">No friends yet</div>
            ) : (
              friends.map(renderFriend)
            )}
          </div>
        );

      case 'pending':
        return (
          <div className="friends-content">
            <h3>Pending — {pendingRequests.length}</h3>
            {pendingRequests.length === 0 ? (
              <div className="empty-state">No pending friend requests</div>
            ) : (
              pendingRequests.map(renderPendingRequest)
            )}
          </div>
        );

      case 'add':
        return renderAddFriend();

      default:
        return null;
    }
  };

  return (
    <div className="friends-list">
      <div className="friends-header">
        <div className="friends-title">
          <h2>Friends</h2>
        </div>
        <div className="friends-tabs">
          <button
            className={`tab ${activeTab === 'online' ? 'active' : ''}`}
            onClick={() => setActiveTab('online')}
          >
            Online
          </button>
          <button
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending
            {pendingRequests.length > 0 && (
              <span className="notification-badge">{pendingRequests.length}</span>
            )}
          </button>
          <button
            className={`tab ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            Add Friend
          </button>
        </div>
      </div>

      <div className="friends-body">
        {renderContent()}
      </div>
    </div>
  );
};

export default FriendsList;