const db = require('../config/database');
const crypto = require('crypto');
const { sanitizeHtml, validateContentLength } = require('../utils/security');

const dmController = {
  // Get user's DM conversations
  getConversations: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get all friends (including those without messages)
      const friendsQuery = `
        SELECT 
          CASE 
            WHEN user1_id = $1 THEN user2_id
            ELSE user1_id
          END as friend_id
        FROM friendships 
        WHERE user1_id = $1 OR user2_id = $1
      `;
      
      const friendsResult = await db.query(friendsQuery, [userId]);
      const conversations = [];
      
      // For each friend, create a conversation (with or without messages)
      for (const row of friendsResult.rows) {
        const friendId = row.friend_id;
        
        // Get friend info
        const friendQuery = `
          SELECT username, avatar_url, status 
          FROM users 
          WHERE id = $1
        `;
        const friendResult = await db.query(friendQuery, [friendId]);
        
        if (friendResult.rows.length === 0) continue;
        
        const friend = friendResult.rows[0];
        
        // Generate conversation ID (consistent for the same pair of users)
        const conversationId = `dm_${Math.min(userId, friendId)}_${Math.max(userId, friendId)}`;
        
        // Get last message if any exists
        const lastMessageQuery = `
          SELECT content, sender_id, created_at
          FROM direct_messages
          WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
          ORDER BY created_at DESC
          LIMIT 1
        `;
        const lastMessageResult = await db.query(lastMessageQuery, [userId, friendId]);
        
        // Get unread count
        const unreadQuery = `
          SELECT COUNT(*) as count
          FROM direct_messages
          WHERE sender_id = $1 AND receiver_id = $2 AND read = false
        `;
        const unreadResult = await db.query(unreadQuery, [friendId, userId]);
        
        const lastMessage = lastMessageResult.rows[0];
        const unreadCount = parseInt(unreadResult.rows[0].count);
        
        conversations.push({
          id: conversationId,
          participant_id: friendId,
          participant_username: friend.username,
          participant_avatar_url: friend.avatar_url,
          participant_status: friend.status || 'offline',
          last_message: lastMessage ? {
            id: null,
            content: lastMessage.content,
            sender_id: lastMessage.sender_id,
            sender_username: lastMessage.sender_id === userId ? 'You' : friend.username,
            created_at: lastMessage.created_at
          } : null,
          unread_count: unreadCount,
          updated_at: lastMessage ? lastMessage.created_at : new Date().toISOString()
        });
      }
      
      // Sort by last activity
      conversations.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      
      res.json({
        message: 'Conversations retrieved successfully',
        data: conversations
      });
    } catch (error) {
      console.error('Error getting conversations:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Get messages for a specific conversation
  getConversationMessages: async (req, res) => {
    try {
      const userId = req.user.id;
      const conversationId = req.params.conversationId;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      // Verify user has access to this conversation
      // First check if there are existing messages where user is involved
      const accessQuery = `
        SELECT COUNT(*) as count FROM direct_messages 
        WHERE conversation_id = $1 AND (sender_id = $2 OR receiver_id = $2)
      `;
      const accessResult = await db.query(accessQuery, [conversationId, userId]);
      
      // If no messages exist, check if this is a valid conversation between friends
      if (parseInt(accessResult.rows[0].count) === 0) {
        // Extract user IDs from conversation_id format: dm_userId1_userId2
        const conversationMatch = conversationId.match(/^dm_(\d+)_(\d+)$/);
        if (!conversationMatch) {
          return res.status(403).json({ message: 'Invalid conversation format' });
        }
        
        const [, user1Id, user2Id] = conversationMatch;
        const participant1 = parseInt(user1Id);
        const participant2 = parseInt(user2Id);
        
        // Verify the current user is one of the participants
        if (userId !== participant1 && userId !== participant2) {
          return res.status(403).json({ message: 'Access denied to this conversation' });
        }
        
        // Verify the users are friends
        const friendshipQuery = `
          SELECT COUNT(*) as count FROM friendships 
          WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
        `;
        const friendshipResult = await db.query(friendshipQuery, [participant1, participant2]);
        
        if (parseInt(friendshipResult.rows[0].count) === 0) {
          return res.status(403).json({ message: 'Access denied to this conversation' });
        }
      }

      const query = `
        SELECT 
          dm.id,
          dm.content,
          dm.sender_id,
          dm.receiver_id,
          sender.username as sender_username,
          sender.avatar_url as sender_avatar_url,
          dm.conversation_id,
          dm.reply_to,
          reply_msg.content as reply_to_content,
          dm.edited,
          dm.read,
          dm.created_at,
          dm.updated_at,
          dm.encrypted_content,
          dm.is_encrypted,
          dm.encryption_version
        FROM direct_messages dm
        JOIN users sender ON dm.sender_id = sender.id
        LEFT JOIN direct_messages reply_msg ON dm.reply_to = reply_msg.id
        WHERE dm.conversation_id = $1
        ORDER BY dm.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await db.query(query, [conversationId, limit, offset]);
      
      res.json({
        message: 'Messages retrieved successfully',
        data: result.rows.reverse() // Reverse to get chronological order
      });
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Send a direct message
  sendDirectMessage: async (req, res) => {
    try {
      const senderId = req.user.id;
      const { receiver_id, reply_to, conversation_id } = req.body;

      if (!receiver_id || !req.body.content) {
        return res.status(400).json({ message: 'Receiver ID and content are required' });
      }

      // Sanitize and validate content
      const content = sanitizeHtml(req.body.content);
      if (!validateContentLength(content, 2000)) {
        return res.status(400).json({ message: 'Message content is too long (max 2000 characters)' });
      }
      
      if (content.trim().length === 0) {
        return res.status(400).json({ message: 'Message content cannot be empty' });
      }

      // Check if users are friends
      const friendshipQuery = `
        SELECT id FROM friendships 
        WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
      `;
      const friendshipResult = await db.query(friendshipQuery, [senderId, receiver_id]);
      
      if (friendshipResult.rows.length === 0) {
        return res.status(403).json({ message: 'You can only send messages to friends' });
      }

      // Generate conversation ID if not provided
      let finalConversationId = conversation_id;
      if (!finalConversationId) {
        const user1 = Math.min(senderId, receiver_id);
        const user2 = Math.max(senderId, receiver_id);
        finalConversationId = `dm_${user1}_${user2}`;
      }

      // Handle encryption fields
      const { encrypted_content, is_encrypted, encryption_version } = req.body;
      
      let query, values;
      if (is_encrypted && encrypted_content) {
        query = `
          INSERT INTO direct_messages (sender_id, receiver_id, content, conversation_id, reply_to, encrypted_content, is_encrypted, encryption_version)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `;
        values = [senderId, receiver_id, content, finalConversationId, reply_to || null, encrypted_content, is_encrypted, encryption_version];
      } else {
        query = `
          INSERT INTO direct_messages (sender_id, receiver_id, content, conversation_id, reply_to)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        values = [senderId, receiver_id, content, finalConversationId, reply_to || null];
      }
      
      const result = await db.query(query, values);

      // Get sender info for the response
      const senderQuery = 'SELECT username, avatar_url FROM users WHERE id = $1';
      const senderResult = await db.query(senderQuery, [senderId]);
      
      const message = {
        ...result.rows[0],
        sender_username: senderResult.rows[0].username,
        sender_avatar_url: senderResult.rows[0].avatar_url
      };

      // Send socket notification to receiver
      const socketHandler = req.app.get('socketHandler');
      if (socketHandler) {
        socketHandler.notifyDirectMessage(receiver_id, message);
      }

      res.status(201).json({
        message: 'Message sent successfully',
        data: message
      });
    } catch (error) {
      console.error('Error sending direct message:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Mark messages as read
  markAsRead: async (req, res) => {
    try {
      const userId = req.user.id;
      const conversationId = req.params.conversationId;

      console.log(`Marking messages as read for user ${userId} in conversation ${conversationId}`);

      const query = `
        UPDATE direct_messages 
        SET read = true, updated_at = CURRENT_TIMESTAMP
        WHERE conversation_id = $1 AND receiver_id = $2 AND read = false
      `;
      
      const result = await db.query(query, [conversationId, userId]);
      
      console.log(`Successfully marked ${result.rowCount} messages as read`);

      res.json({ 
        message: 'Messages marked as read successfully',
        updated_count: result.rowCount
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Start or get conversation with a user
  startConversation: async (req, res) => {
    try {
      const userId = req.user.id;
      const { participant_id } = req.body;

      if (!participant_id) {
        return res.status(400).json({ message: 'Participant ID is required' });
      }

      if (participant_id === userId) {
        return res.status(400).json({ message: 'Cannot start conversation with yourself' });
      }

      // Check if users are friends
      const friendshipQuery = `
        SELECT id FROM friendships 
        WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
      `;
      const friendshipResult = await db.query(friendshipQuery, [userId, participant_id]);
      
      if (friendshipResult.rows.length === 0) {
        return res.status(403).json({ message: 'You can only start conversations with friends' });
      }

      // Generate conversation ID
      const user1 = Math.min(userId, participant_id);
      const user2 = Math.max(userId, participant_id);
      const conversationId = `dm_${user1}_${user2}`;

      // Get participant info
      const participantQuery = 'SELECT username, avatar_url, status FROM users WHERE id = $1';
      const participantResult = await db.query(participantQuery, [participant_id]);
      
      if (participantResult.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const participant = participantResult.rows[0];

      // Check for existing messages to get proper conversation state
      const lastMessageQuery = `
        SELECT content, sender_id, created_at
        FROM direct_messages
        WHERE conversation_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const lastMessageResult = await db.query(lastMessageQuery, [conversationId]);
      
      // Get unread count
      const unreadQuery = `
        SELECT COUNT(*) as count
        FROM direct_messages
        WHERE conversation_id = $1 AND receiver_id = $2 AND read = false
      `;
      const unreadResult = await db.query(unreadQuery, [conversationId, userId]);
      
      const lastMessage = lastMessageResult.rows[0];
      const unreadCount = parseInt(unreadResult.rows[0].count);

      const conversation = {
        id: conversationId,
        participant_id: participant_id,
        participant_username: participant.username,
        participant_avatar_url: participant.avatar_url,
        participant_status: participant.status,
        last_message: lastMessage ? {
          id: null,
          content: lastMessage.content,
          sender_id: lastMessage.sender_id,
          sender_username: lastMessage.sender_id === userId ? 'You' : participant.username,
          created_at: lastMessage.created_at
        } : null,
        unread_count: unreadCount,
        updated_at: lastMessage ? lastMessage.created_at : new Date().toISOString()
      };

      res.json({
        message: 'Conversation started successfully',
        data: conversation
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

module.exports = dmController;