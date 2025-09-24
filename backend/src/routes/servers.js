const express = require('express');
const router = express.Router();
const {
    createServer,
    getUserServers,
    getServerById,
    joinServer,
    updateServer,
    deleteServer,
    leaveServer,
    getPublicServers,
    serverValidation
} = require('../controllers/serverController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Server routes
router.post('/', serverValidation, createServer);
router.get('/', getUserServers);
router.post('/join', joinServer);
router.get('/public', getPublicServers); // Must come before /:serverId to avoid conflicts
router.get('/:serverId', getServerById);
router.put('/:serverId', serverValidation, updateServer);
router.post('/:serverId/leave', leaveServer);
router.delete('/:serverId', deleteServer);

module.exports = router;
