const express = require('express');
const router = express.Router();
const friendsController = require('../controllers/friendsController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get user's friends list
router.get('/', friendsController.getFriends);

// Get friend requests
router.get('/requests', friendsController.getFriendRequests);

// Send friend request
router.post('/request', friendsController.sendFriendRequest);

// Accept friend request
router.post('/requests/:requestId/accept', friendsController.acceptFriendRequest);

// Decline friend request
router.post('/requests/:requestId/decline', friendsController.declineFriendRequest);

// Remove friend
router.delete('/:friendId', friendsController.removeFriend);

module.exports = router;