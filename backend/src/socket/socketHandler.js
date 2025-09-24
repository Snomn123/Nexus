const jwt = require('jsonwebtoken');
const db = require('../config/database');

class SocketHandler {
    constructor(io) {
        this.io = io;
        this.connectedUsers = new Map(); // userId -> socketId
        this.userSockets = new Map(); // socketId -> userId
        
        this.setupMiddleware();
        this.setupEventHandlers();
    }

    setupMiddleware() {
        console.log('🔧 Socket.IO authentication enabled');
        
        // Log all connection attempts
        this.io.engine.on('connection', (socket) => {
            console.log('🔗 Engine connection received from:', socket.request.connection.remoteAddress);
            console.log('🔗 Engine connection transport:', socket.transport.name);
        });
        
        this.io.use(async (socket, next) => {
            try {
                console.log('🔌 Socket.IO middleware: connection attempt received');
                console.log('🔌 Socket ID:', socket.id);
                console.log('🔌 Socket handshake:', {
                    address: socket.handshake.address,
                    headers: socket.handshake.headers['user-agent'],
                    query: socket.handshake.query,
                    cookies: socket.handshake.headers.cookie
                });
                
                // Extract token from cookies
                const cookies = socket.handshake.headers.cookie;
                let token = null;
                
                if (cookies) {
                    const tokenMatch = cookies.match(/token=([^;]+)/);
                    if (tokenMatch) {
                        token = tokenMatch[1];
                    }
                }
                
                console.log('🔍 Extracted token:', token ? 'Token found' : 'No token found');
                
                if (!token) {
                    console.log('❌ No authentication token found in cookies');
                    return next(new Error('Authentication required'));
                }
                
                // Verify JWT token
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                console.log('🔓 JWT decoded:', { userId: decoded.userId || decoded.id, username: decoded.username });
                
                // Get user from database - handle both userId and id field names
                const userId = decoded.userId || decoded.id;
                if (!userId) {
                    console.log('❌ No user ID found in JWT token');
                    return next(new Error('Invalid token - no user ID'));
                }
                
                const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
                
                if (userResult.rows.length === 0) {
                    console.log('❌ User not found in database:', decoded.id);
                    return next(new Error('User not found'));
                }
                
                socket.user = userResult.rows[0];
                console.log('✅ Socket.IO user authenticated:', socket.user.username);
                next();
                
            } catch (error) {
                console.error('❌ Socket.IO authentication error:', error);
                // Only allow debug fallback if explicitly enabled
                if (process.env.NODE_ENV !== 'production' && process.env.SOCKET_DEBUG_AUTH === 'true') {
                    console.warn('⚠️ WARNING: Using debug authentication - this should only be used for development testing');
                    console.warn('⚠️ To disable this, remove SOCKET_DEBUG_AUTH=true from your environment');
                    socket.user = {
                        id: 999,
                        username: 'debug-user',
                        email: 'debug@example.com',
                        avatar_url: null,
                        status: 'online'
                    };
                    next();
                } else {
                    next(new Error('Authentication failed'));
                }
            }
        });
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }

    async handleConnection(socket) {
        const userId = socket.user.id;
        const username = socket.user.username;

        console.log(`🎉 User ${username} SUCCESSFULLY connected with socket ${socket.id}`);
        console.log(`🎉 Total connected users: ${this.connectedUsers.size + 1}`);

        // Store user connection
        this.connectedUsers.set(userId, socket.id);
        this.userSockets.set(socket.id, userId);

        // Update user status to online
        await db.query('UPDATE users SET status = $1 WHERE id = $2', ['online', userId]);

        // Join user to their server rooms
        await this.joinUserServers(socket, userId);

        // Broadcast user online status to their servers
        await this.broadcastUserStatus(userId, 'online');

        // Set up event listeners
        this.setupSocketEvents(socket);

        // Handle disconnect
        socket.on('disconnect', () => {
            this.handleDisconnect(socket);
        });
    }

    async handleDisconnect(socket) {
        const userId = this.userSockets.get(socket.id);
        if (!userId) return;

        console.log(`User ${socket.user.username} disconnected`);

        // Remove from maps
        this.connectedUsers.delete(userId);
        this.userSockets.delete(socket.id);

        // Update user status to offline
        await db.query('UPDATE users SET status = $1 WHERE id = $2', ['offline', userId]);

        // Broadcast user offline status
        await this.broadcastUserStatus(userId, 'offline');
    }

    setupSocketEvents(socket) {
        const userId = socket.user.id;

        // Join channel event
        socket.on('join_channel', async (data) => {
            try {
                const { channelId } = data;
                
                // Verify user has access to channel
                const accessCheck = await db.query(`
                    SELECT c.id, c.server_id
                    FROM channels c
                    JOIN server_members sm ON c.server_id = sm.server_id
                    WHERE c.id = $1 AND sm.user_id = $2
                `, [channelId, userId]);

                if (accessCheck.rows.length > 0) {
                    socket.join(`channel_${channelId}`);
                    socket.emit('joined_channel', { channelId });
                } else {
                    socket.emit('error', { message: 'Access denied to channel' });
                }
            } catch (error) {
                console.error('Join channel error:', error);
                socket.emit('error', { message: 'Failed to join channel' });
            }
        });

        // Leave channel event
        socket.on('leave_channel', (data) => {
            const { channelId } = data;
            socket.leave(`channel_${channelId}`);
            socket.emit('left_channel', { channelId });
        });

        // Send message event
        socket.on('send_message', async (data) => {
            try {
                const { channelId, content, replyTo } = data;

                // Verify user has access to channel
                const channelResult = await db.query(`
                    SELECT c.id, c.server_id
                    FROM channels c
                    JOIN server_members sm ON c.server_id = sm.server_id
                    WHERE c.id = $1 AND sm.user_id = $2
                `, [channelId, userId]);

                if (channelResult.rows.length === 0) {
                    socket.emit('error', { message: 'Access denied' });
                    return;
                }

                // Validate content
                if (!content || content.trim().length === 0 || content.length > 2000) {
                    socket.emit('error', { message: 'Invalid message content' });
                    return;
                }

                // Validate reply_to if provided
                if (replyTo) {
                    const replyMessage = await db.query(
                        'SELECT id FROM messages WHERE id = $1 AND channel_id = $2',
                        [replyTo, channelId]
                    );

                    if (replyMessage.rows.length === 0) {
                        socket.emit('error', { message: 'Reply message not found' });
                        return;
                    }
                }

                // Create message
                const newMessage = await db.query(
                    'INSERT INTO messages (content, user_id, channel_id, reply_to) VALUES ($1, $2, $3, $4) RETURNING *',
                    [content.trim(), userId, channelId, replyTo || null]
                );

                // Get message with user information
                const messageWithUser = await db.query(`
                    SELECT 
                        m.*,
                        u.username,
                        u.avatar_url,
                        reply_user.username as reply_to_username,
                        reply_msg.content as reply_to_content
                    FROM messages m
                    JOIN users u ON m.user_id = u.id
                    LEFT JOIN messages reply_msg ON m.reply_to = reply_msg.id
                    LEFT JOIN users reply_user ON reply_msg.user_id = reply_user.id
                    WHERE m.id = $1
                `, [newMessage.rows[0].id]);

                const message = messageWithUser.rows[0];

                // Broadcast message to all users in the channel
                this.io.to(`channel_${channelId}`).emit('new_message', message);

            } catch (error) {
                console.error('Send message error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Typing indicators
        socket.on('typing_start', (data) => {
            const { channelId } = data;
            socket.to(`channel_${channelId}`).emit('user_typing', {
                userId,
                username: socket.user.username,
                channelId
            });
        });

        socket.on('typing_stop', (data) => {
            const { channelId } = data;
            socket.to(`channel_${channelId}`).emit('user_stopped_typing', {
                userId,
                channelId
            });
        });

        // NOTE: Voice channel events removed - voice functionality not implemented

        // Message reactions
        socket.on('add_reaction', async (data) => {
            const { messageId, emoji } = data;
            // Implementation for message reactions
            socket.to(`channel_${data.channelId}`).emit('reaction_added', {
                messageId,
                emoji,
                userId,
                username: socket.user.username
            });
        });

        // Direct Message events
        socket.on('send_direct_message', async (data) => {
            try {
                const { receiverId, content, replyTo } = data;

                // Check if users are friends
                const friendshipQuery = `
                    SELECT id FROM friendships 
                    WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
                `;
                const friendshipResult = await db.query(friendshipQuery, [userId, receiverId]);
                
                if (friendshipResult.rows.length === 0) {
                    socket.emit('error', { message: 'You can only send messages to friends' });
                    return;
                }

                // Generate conversation ID
                const user1 = Math.min(userId, receiverId);
                const user2 = Math.max(userId, receiverId);
                const conversationId = `dm_${user1}_${user2}`;

                // Save message to database
                const messageResult = await db.query(`
                    INSERT INTO direct_messages (sender_id, receiver_id, content, conversation_id, reply_to)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *
                `, [userId, receiverId, content, conversationId, replyTo || null]);

                // Get sender info
                const senderResult = await db.query(
                    'SELECT username, avatar_url FROM users WHERE id = $1',
                    [userId]
                );

                const message = {
                    ...messageResult.rows[0],
                    sender_username: senderResult.rows[0].username,
                    sender_avatar_url: senderResult.rows[0].avatar_url
                };

                // Send to receiver if online
                this.sendToUser(receiverId, 'direct_message_received', message);
                
                // Confirm to sender
                socket.emit('direct_message_sent', message);

            } catch (error) {
                console.error('Send direct message error:', error);
                socket.emit('error', { message: 'Failed to send direct message' });
            }
        });

        // DM Typing indicators
        socket.on('dm_typing_start', (data) => {
            const { receiverId } = data;
            this.sendToUser(receiverId, 'dm_user_typing', {
                senderId: userId,
                senderUsername: socket.user.username
            });
        });

        socket.on('dm_typing_stop', (data) => {
            const { receiverId } = data;
            this.sendToUser(receiverId, 'dm_user_stopped_typing', {
                senderId: userId
            });
        });
    }

    async joinUserServers(socket, userId) {
        try {
            // Get user's servers
            const servers = await db.query(`
                SELECT s.id
                FROM servers s
                JOIN server_members sm ON s.id = sm.server_id
                WHERE sm.user_id = $1
            `, [userId]);

            // Join server rooms
            for (const server of servers.rows) {
                socket.join(`server_${server.id}`);
            }
        } catch (error) {
            console.error('Error joining user servers:', error);
        }
    }

    async broadcastUserStatus(userId, status) {
        try {
            // Get servers where user is a member
            const servers = await db.query(`
                SELECT s.id
                FROM servers s
                JOIN server_members sm ON s.id = sm.server_id
                WHERE sm.user_id = $1
            `, [userId]);

            // Get user info
            const userResult = await db.query(
                'SELECT id, username, avatar_url FROM users WHERE id = $1',
                [userId]
            );

            if (userResult.rows.length === 0) return;

            const user = userResult.rows[0];

            // Broadcast status update to all servers
            for (const server of servers.rows) {
                this.io.to(`server_${server.id}`).emit('user_status_change', {
                    userId: user.id,
                    username: user.username,
                    status
                });
            }
        } catch (error) {
            console.error('Error broadcasting user status:', error);
        }
    }

    // Method to send message to specific user
    sendToUser(userId, event, data) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.io.to(socketId).emit(event, data);
        }
    }

    // Method to broadcast to server members
    broadcastToServer(serverId, event, data) {
        this.io.to(`server_${serverId}`).emit(event, data);
    }

    // Method to broadcast to channel members
    broadcastToChannel(channelId, event, data) {
        this.io.to(`channel_${channelId}`).emit(event, data);
    }

    // Get online users count
    getOnlineUsersCount() {
        return this.connectedUsers.size;
    }

    // Get user connection status
    isUserOnline(userId) {
        return this.connectedUsers.has(userId);
    }

    // Send friend request notification
    notifyFriendRequest(receiverId, senderInfo) {
        this.sendToUser(receiverId, 'friend_request_received', {
            id: senderInfo.requestId,
            sender_id: senderInfo.senderId,
            sender_username: senderInfo.senderUsername,
            sender_avatar_url: senderInfo.senderAvatarUrl,
            created_at: new Date().toISOString()
        });
    }

    // Send friend request accepted notification
    notifyFriendRequestAccepted(senderId, receiverInfo) {
        this.sendToUser(senderId, 'friend_request_accepted', {
            userId: receiverInfo.userId,
            username: receiverInfo.username,
            avatar_url: receiverInfo.avatarUrl
        });
    }

    // Send direct message notification
    notifyDirectMessage(receiverId, message) {
        this.sendToUser(receiverId, 'direct_message_received', message);
    }

    // Send user status update to friends
    async notifyFriendsStatusChange(userId, status) {
        try {
            // Get user's friends
            const friendsQuery = `
                SELECT 
                    CASE 
                        WHEN f.user1_id = $1 THEN f.user2_id
                        ELSE f.user1_id
                    END as friend_id
                FROM friendships f
                WHERE f.user1_id = $1 OR f.user2_id = $1
            `;
            const friendsResult = await db.query(friendsQuery, [userId]);

            // Get user info
            const userResult = await db.query(
                'SELECT username, avatar_url FROM users WHERE id = $1',
                [userId]
            );

            if (userResult.rows.length === 0) return;

            const user = userResult.rows[0];

            // Notify each friend about status change
            for (const friend of friendsResult.rows) {
                this.sendToUser(friend.friend_id, 'friend_status_change', {
                    userId: userId,
                    username: user.username,
                    status: status
                });
            }
        } catch (error) {
            console.error('Error notifying friends of status change:', error);
        }
    }
}

module.exports = SocketHandler;