const db = require('../config/database');

const friendsController = {
  // Get user's friends list
  getFriends: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const query = `
        SELECT 
          u.id,
          u.username,
          u.email,
          u.avatar_url,
          u.status,
          f.id as friendship_id,
          f.created_at,
          u.updated_at as last_seen
        FROM friendships f
        JOIN users u ON (
          CASE 
            WHEN f.user1_id = $1 THEN u.id = f.user2_id
            ELSE u.id = f.user1_id
          END
        )
        WHERE f.user1_id = $1 OR f.user2_id = $1
        ORDER BY u.status DESC, u.username ASC
      `;
      
      const result = await db.query(query, [userId]);
      
      res.json({
        message: 'Friends retrieved successfully',
        data: result.rows
      });
    } catch (error) {
      console.error('Error getting friends:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Get friend requests (both sent and received)
  getFriendRequests: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const query = `
        SELECT 
          fr.id,
          fr.sender_id,
          fr.receiver_id,
          sender.username as sender_username,
          sender.avatar_url as sender_avatar_url,
          receiver.username as receiver_username,
          receiver.avatar_url as receiver_avatar_url,
          fr.status,
          fr.created_at,
          fr.updated_at
        FROM friend_requests fr
        JOIN users sender ON fr.sender_id = sender.id
        JOIN users receiver ON fr.receiver_id = receiver.id
        WHERE (fr.sender_id = $1 OR fr.receiver_id = $1) AND fr.status = 'pending'
        ORDER BY fr.created_at DESC
      `;
      
      const result = await db.query(query, [userId]);
      
      res.json({
        message: 'Friend requests retrieved successfully',
        data: result.rows
      });
    } catch (error) {
      console.error('Error getting friend requests:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Send friend request
  sendFriendRequest: async (req, res) => {
    try {
      const userId = req.user.id;
      const { username } = req.body;

      if (!username) {
        return res.status(400).json({ message: 'Username is required' });
      }

      // Find the target user
      const userQuery = 'SELECT id FROM users WHERE username = $1';
      const userResult = await db.query(userQuery, [username]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const targetUserId = userResult.rows[0].id;

      // Can't send request to yourself
      if (targetUserId === userId) {
        return res.status(400).json({ message: 'Cannot send friend request to yourself' });
      }

      // Check if already friends
      const friendshipQuery = `
        SELECT id FROM friendships 
        WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
      `;
      const friendshipResult = await db.query(friendshipQuery, [userId, targetUserId]);
      
      if (friendshipResult.rows.length > 0) {
        return res.status(400).json({ message: 'You are already friends with this user' });
      }

      // Check if request already exists
      const requestQuery = `
        SELECT id FROM friend_requests 
        WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
        AND status = 'pending'
      `;
      const requestResult = await db.query(requestQuery, [userId, targetUserId]);
      
      if (requestResult.rows.length > 0) {
        return res.status(400).json({ message: 'Friend request already exists' });
      }

      // Create friend request
      const insertQuery = `
        INSERT INTO friend_requests (sender_id, receiver_id, status)
        VALUES ($1, $2, 'pending')
        RETURNING id
      `;
      const result = await db.query(insertQuery, [userId, targetUserId]);

      // Get sender info for notification
      const senderInfoQuery = 'SELECT username, avatar_url FROM users WHERE id = $1';
      const senderInfo = await db.query(senderInfoQuery, [userId]);

      // Send socket notification if available
      const socketHandler = req.app.get('socketHandler');
      if (socketHandler && senderInfo.rows.length > 0) {
        socketHandler.notifyFriendRequest(targetUserId, {
          requestId: result.rows[0].id,
          senderId: userId,
          senderUsername: senderInfo.rows[0].username,
          senderAvatarUrl: senderInfo.rows[0].avatar_url
        });
      }

      res.status(201).json({
        message: 'Friend request sent successfully',
        data: { requestId: result.rows[0].id }
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Accept friend request
  acceptFriendRequest: async (req, res) => {
    try {
      const userId = req.user.id;
      const requestId = parseInt(req.params.requestId);

      // Get the friend request
      const requestQuery = `
        SELECT sender_id, receiver_id FROM friend_requests 
        WHERE id = $1 AND receiver_id = $2 AND status = 'pending'
      `;
      const requestResult = await db.query(requestQuery, [requestId, userId]);
      
      if (requestResult.rows.length === 0) {
        return res.status(404).json({ message: 'Friend request not found' });
      }

      const { sender_id, receiver_id } = requestResult.rows[0];

      await db.query('BEGIN');

      try {
        // Update request status
        await db.query(
          'UPDATE friend_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['accepted', requestId]
        );

        // Create friendship (ensure user1_id < user2_id for consistency)
        const user1 = Math.min(sender_id, receiver_id);
        const user2 = Math.max(sender_id, receiver_id);
        
        await db.query(
          'INSERT INTO friendships (user1_id, user2_id) VALUES ($1, $2)',
          [user1, user2]
        );

        await db.query('COMMIT');

        // Get sender and receiver info
        const receiverInfoQuery = 'SELECT username, avatar_url FROM users WHERE id = $1';
        const receiverInfo = await db.query(receiverInfoQuery, [receiver_id]);
        
        const senderInfoQuery = 'SELECT username, avatar_url FROM users WHERE id = $1';
        const senderInfo = await db.query(senderInfoQuery, [sender_id]);

        // Send socket notification to sender that request was accepted
        const socketHandler = req.app.get('socketHandler');
        if (socketHandler && receiverInfo.rows.length > 0) {
          socketHandler.notifyFriendRequestAccepted(sender_id, {
            userId: receiver_id,
            username: receiverInfo.rows[0].username,
            avatarUrl: receiverInfo.rows[0].avatar_url
          });
        }

        // Return friend info for starting DM conversation
        const friendInfo = senderInfo.rows.length > 0 ? {
          id: sender_id,
          username: senderInfo.rows[0].username,
          avatar_url: senderInfo.rows[0].avatar_url
        } : null;

        res.json({ 
          message: 'Friend request accepted successfully',
          data: { friend: friendInfo }
        });
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Decline friend request
  declineFriendRequest: async (req, res) => {
    try {
      const userId = req.user.id;
      const requestId = parseInt(req.params.requestId);

      // Update request status
      const query = `
        UPDATE friend_requests 
        SET status = 'declined', updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1 AND receiver_id = $2 AND status = 'pending'
        RETURNING id
      `;
      const result = await db.query(query, [requestId, userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Friend request not found' });
      }

      res.json({ message: 'Friend request declined successfully' });
    } catch (error) {
      console.error('Error declining friend request:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Cancel friend request
  cancelFriendRequest: async (req, res) => {
    try {
      const userId = req.user.id;
      const requestId = parseInt(req.params.requestId);

      // Delete request only if user is the sender
      const query = `
        DELETE FROM friend_requests 
        WHERE id = $1 AND sender_id = $2 AND status = 'pending'
        RETURNING id
      `;
      const result = await db.query(query, [requestId, userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Friend request not found or you cannot cancel this request' });
      }

      res.json({ message: 'Friend request cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Remove friend
  removeFriend: async (req, res) => {
    try {
      const userId = req.user.id;
      const friendId = parseInt(req.params.friendId);

      const query = `
        DELETE FROM friendships 
        WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
        RETURNING id
      `;
      const result = await db.query(query, [userId, friendId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Friendship not found' });
      }

      res.json({ message: 'Friend removed successfully' });
    } catch (error) {
      console.error('Error removing friend:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

module.exports = friendsController;