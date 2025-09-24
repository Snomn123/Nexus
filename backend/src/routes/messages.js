const express = require('express');
const router = express.Router();
const {
    getChannelMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    messageValidation
} = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Message routes
router.get('/channels/:channelId', getChannelMessages);
router.post('/channels/:channelId', messageValidation, sendMessage);
router.put('/:messageId', messageValidation, editMessage);
router.delete('/:messageId', deleteMessage);

module.exports = router;