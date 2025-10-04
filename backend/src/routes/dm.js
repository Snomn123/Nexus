const express = require('express');
const router = express.Router();
const dmController = require('../controllers/dmController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get user's DM conversations
router.get('/conversations', dmController.getConversations);

// Start or get conversation with a user
router.post('/conversations', dmController.startConversation);

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', dmController.getConversationMessages);

// Mark messages as read in a conversation
router.post('/conversations/:conversationId/read', dmController.markAsRead);

// Send a direct message
router.post('/send', dmController.sendDirectMessage);

// Delete a direct message
router.delete('/messages/:messageId', dmController.deleteDirectMessage);

module.exports = router;