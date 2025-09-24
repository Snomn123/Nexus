const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const getChannelMessages = async (req, res) => {
    try {
        const { channelId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const userId = req.user.id;
        const offset = (page - 1) * limit;

        // Check if user has access to channel
        const channelResult = await db.query(`
            SELECT c.id, c.server_id
            FROM channels c
            JOIN server_members sm ON c.server_id = sm.server_id
            WHERE c.id = $1 AND sm.user_id = $2
        `, [channelId, userId]);

        if (channelResult.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get messages with user information
        const messages = await db.query(`
            SELECT 
                m.*,
                u.username,
                u.avatar_url,
                reply_user.username as reply_to_username
            FROM messages m
            JOIN users u ON m.user_id = u.id
            LEFT JOIN messages reply_msg ON m.reply_to = reply_msg.id
            LEFT JOIN users reply_user ON reply_msg.user_id = reply_user.id
            WHERE m.channel_id = $1
            ORDER BY m.created_at DESC
            LIMIT $2 OFFSET $3
        `, [channelId, limit, offset]);

        // Reverse to show oldest first
        messages.rows.reverse();

        res.json({
            messages: messages.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                hasMore: messages.rows.length === parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get channel messages error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const sendMessage = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { channelId } = req.params;
        const { content, replyTo } = req.body;
        const userId = req.user.id;

        // Check if user has access to channel
        const channelResult = await db.query(`
            SELECT c.id, c.server_id
            FROM channels c
            JOIN server_members sm ON c.server_id = sm.server_id
            WHERE c.id = $1 AND sm.user_id = $2
        `, [channelId, userId]);

        if (channelResult.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Validate reply_to if provided
        if (replyTo) {
            const replyMessage = await db.query(
                'SELECT id FROM messages WHERE id = $1 AND channel_id = $2',
                [replyTo, channelId]
            );

            if (replyMessage.rows.length === 0) {
                return res.status(400).json({ error: 'Reply message not found' });
            }
        }

        // Create message
        const newMessage = await db.query(
            'INSERT INTO messages (content, user_id, channel_id, reply_to) VALUES ($1, $2, $3, $4) RETURNING *',
            [content, userId, channelId, replyTo || null]
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

        res.status(201).json({
            message: 'Message sent successfully',
            data: message
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const editMessage = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { messageId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        // Check if message exists and user owns it
        const messageResult = await db.query(
            'SELECT id, user_id, channel_id FROM messages WHERE id = $1',
            [messageId]
        );

        if (messageResult.rows.length === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }

        const message = messageResult.rows[0];

        if (message.user_id !== userId) {
            return res.status(403).json({ error: 'You can only edit your own messages' });
        }

        // Update message
        const updatedMessage = await db.query(
            'UPDATE messages SET content = $1, edited = true WHERE id = $2 RETURNING *',
            [content, messageId]
        );

        // Get updated message with user information
        const messageWithUser = await db.query(`
            SELECT 
                m.*,
                u.username,
                u.avatar_url
            FROM messages m
            JOIN users u ON m.user_id = u.id
            WHERE m.id = $1
        `, [messageId]);

        res.json({
            message: 'Message updated successfully',
            data: messageWithUser.rows[0]
        });
    } catch (error) {
        console.error('Edit message error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        // Check if message exists and user owns it or is admin
        const messageResult = await db.query(`
            SELECT 
                m.id, 
                m.user_id, 
                m.channel_id,
                c.server_id,
                sm.role
            FROM messages m
            JOIN channels c ON m.channel_id = c.id
            JOIN server_members sm ON c.server_id = sm.server_id AND sm.user_id = $2
            WHERE m.id = $1
        `, [messageId, userId]);

        if (messageResult.rows.length === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }

        const message = messageResult.rows[0];

        // Check if user can delete (owner or admin/moderator)
        if (message.user_id !== userId && !['admin', 'moderator'].includes(message.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        // Delete message
        await db.query('DELETE FROM messages WHERE id = $1', [messageId]);

        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Validation rules
const messageValidation = [
    body('content')
        .isLength({ min: 1, max: 2000 })
        .withMessage('Message content must be between 1 and 2000 characters')
        .trim(),
    body('replyTo')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Reply ID must be a positive integer')
];

module.exports = {
    getChannelMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    messageValidation
};