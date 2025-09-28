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
    cancelFriendRequest,
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
      const friendInfo = await acceptFriendRequest(requestId);
      
      // Automatically start a DM conversation with the new friend
      if (friendInfo?.id) {
        try {
          await startDirectConversation(friendInfo.id);
        } catch (dmErr) {
          console.error('Failed to start conversation with new friend:', dmErr);
          // Don't throw here - the friend request was still accepted successfully
        }
      }
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

  const handleCancelRequest = async (requestId: number) => {
    try {
      await cancelFriendRequest(requestId);
    } catch (err) {
      console.error('Failed to cancel friend request:', err);
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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
        <button
          className="action-btn remove-btn"
          onClick={() => handleRemoveFriend(friend.id, friend.username)}
          title="Remove Friend"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );

  const renderPendingRequest = (request: FriendRequest) => {
    const isOutgoing = user && request.sender_id === user.id;
    const displayUsername = isOutgoing ? request.receiver_username : request.sender_username;
    const displayAvatar = isOutgoing ? request.receiver_avatar_url : request.sender_avatar_url;
    
    return (
      <div key={request.id} className="friend-request-item">
        <div className="friend-avatar">
          {displayAvatar ? (
            <img src={displayAvatar} alt={displayUsername} />
          ) : (
            <div 
              className="avatar-placeholder"
              style={{ backgroundColor: getAvatarColor(displayUsername) }}
            >
              {displayUsername.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="friend-info">
          <div className="friend-username">{displayUsername}</div>
          <div className="request-text">
            {isOutgoing ? 'Outgoing Friend Request' : 'Incoming Friend Request'}
          </div>
        </div>
        <div className="friend-actions">
          {isOutgoing ? (
            <button
              className="action-btn decline-btn"
              onClick={() => handleCancelRequest(request.id)}
              title="Cancel Request"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <>
              <button
                className="action-btn accept-btn"
                onClick={() => handleAcceptRequest(request.id)}
                title="Accept"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                className="action-btn decline-btn"
                onClick={() => handleDeclineRequest(request.id)}
                title="Decline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

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
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Send Request
          </button>
        </div>
      </form>

      {/* Status Messages */}
      {(addFriendError || addFriendSuccess || error) && (
        <div className="mt-4">
          {addFriendError && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-3 mb-3">
              <div className="flex items-center text-red-400">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm">{addFriendError}</span>
              </div>
            </div>
          )}
          {addFriendSuccess && (
            <div className="bg-green-500 bg-opacity-10 border border-green-500 rounded-lg p-3 mb-3">
              <div className="flex items-center text-green-400">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">{addFriendSuccess}</span>
              </div>
            </div>
          )}
          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-3">
              <div className="flex items-center text-red-400">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
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