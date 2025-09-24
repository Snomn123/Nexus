const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const crypto = require('crypto');

const createServer = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, isPublic } = req.body;
        const userId = req.user.id;
        const inviteCode = crypto.randomBytes(10).toString('hex');
        
        console.log('Creating server:', { name, description, isPublic, userId });

        // Create server
        const newServer = await db.query(
            'INSERT INTO servers (name, description, owner_id, invite_code, is_public) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, description, userId, inviteCode, isPublic !== false] // Default to true if not specified
        );
        
        console.log('Server created:', newServer.rows[0]);

        const server = newServer.rows[0];

        // Add owner as admin member
        await db.query(
            'INSERT INTO server_members (user_id, server_id, role) VALUES ($1, $2, $3)',
            [userId, server.id, 'admin']
        );

        // Create default channel
        await db.query(
            'INSERT INTO channels (name, server_id, position) VALUES ($1, $2, $3)',
            ['general', server.id, 0]
        );

        res.status(201).json({
            message: 'Server created successfully',
            server
        });
    } catch (error) {
        console.error('Create server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getUserServers = async (req, res) => {
    try {
        const userId = req.user.id;

        const servers = await db.query(`
            SELECT s.*, sm.role, sm.joined_at
            FROM servers s
            JOIN server_members sm ON s.id = sm.server_id
            WHERE sm.user_id = $1
            ORDER BY sm.joined_at DESC
        `, [userId]);

        res.json({ servers: servers.rows });
    } catch (error) {
        console.error('Get user servers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getServerById = async (req, res) => {
    try {
        const { serverId } = req.params;
        const userId = req.user.id;

        // Check if user is member of server
        const membership = await db.query(
            'SELECT role FROM server_members WHERE user_id = $1 AND server_id = $2',
            [userId, serverId]
        );

        if (membership.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get server details
        const serverResult = await db.query(
            'SELECT * FROM servers WHERE id = $1',
            [serverId]
        );

        if (serverResult.rows.length === 0) {
            return res.status(404).json({ error: 'Server not found' });
        }

        // Get server channels
        const channelsResult = await db.query(
            'SELECT * FROM channels WHERE server_id = $1 ORDER BY position, name',
            [serverId]
        );

        // Get server members
        const membersResult = await db.query(`
            SELECT u.id, u.username, u.avatar_url, u.status, sm.role, sm.joined_at
            FROM users u
            JOIN server_members sm ON u.id = sm.user_id
            WHERE sm.server_id = $1
            ORDER BY sm.role DESC, sm.joined_at ASC
        `, [serverId]);

        const server = serverResult.rows[0];
        server.channels = channelsResult.rows;
        server.members = membersResult.rows;
        server.user_role = membership.rows[0].role;

        res.json({ server });
    } catch (error) {
        console.error('Get server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const joinServer = async (req, res) => {
    try {
        const { inviteCode } = req.body;
        const userId = req.user.id;

        // Find server by invite code
        const serverResult = await db.query(
            'SELECT id, name FROM servers WHERE invite_code = $1',
            [inviteCode]
        );

        if (serverResult.rows.length === 0) {
            return res.status(404).json({ error: 'Invalid invite code' });
        }

        const server = serverResult.rows[0];

        // Check if user is already a member
        const existingMember = await db.query(
            'SELECT id FROM server_members WHERE user_id = $1 AND server_id = $2',
            [userId, server.id]
        );

        if (existingMember.rows.length > 0) {
            return res.status(400).json({ error: 'Already a member of this server' });
        }

        // Add user as member
        await db.query(
            'INSERT INTO server_members (user_id, server_id, role) VALUES ($1, $2, $3)',
            [userId, server.id, 'member']
        );

        res.json({
            message: 'Successfully joined server',
            server
        });
    } catch (error) {
        console.error('Join server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateServer = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { serverId } = req.params;
        const { name, description } = req.body;
        const userId = req.user.id;

        // Check if user is admin or owner
        const membership = await db.query(
            'SELECT role FROM server_members WHERE user_id = $1 AND server_id = $2',
            [userId, serverId]
        );

        if (membership.rows.length === 0 || !['admin', 'owner'].includes(membership.rows[0].role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        // Update server
        const updatedServer = await db.query(
            'UPDATE servers SET name = $1, description = $2 WHERE id = $3 RETURNING *',
            [name, description, serverId]
        );

        if (updatedServer.rows.length === 0) {
            return res.status(404).json({ error: 'Server not found' });
        }

        res.json({
            message: 'Server updated successfully',
            server: updatedServer.rows[0]
        });
    } catch (error) {
        console.error('Update server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteServer = async (req, res) => {
    try {
        const { serverId } = req.params;
        const userId = req.user.id;

        // Check if user is owner
        const serverResult = await db.query(
            'SELECT owner_id FROM servers WHERE id = $1',
            [serverId]
        );

        if (serverResult.rows.length === 0) {
            return res.status(404).json({ error: 'Server not found' });
        }

        if (serverResult.rows[0].owner_id !== userId) {
            return res.status(403).json({ error: 'Only server owner can delete server' });
        }

        // Delete server (cascade will handle related records)
        await db.query('DELETE FROM servers WHERE id = $1', [serverId]);

        res.json({ message: 'Server deleted successfully' });
    } catch (error) {
        console.error('Delete server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const leaveServer = async (req, res) => {
    try {
        const { serverId } = req.params;
        const userId = req.user.id;

        // Check if user is a member
        const membershipResult = await db.query(
            'SELECT role FROM server_members WHERE user_id = $1 AND server_id = $2',
            [userId, serverId]
        );

        if (membershipResult.rows.length === 0) {
            return res.status(404).json({ error: 'Not a member of this server' });
        }

        // Check if user is the owner
        const serverResult = await db.query(
            'SELECT owner_id FROM servers WHERE id = $1',
            [serverId]
        );

        if (serverResult.rows.length === 0) {
            return res.status(404).json({ error: 'Server not found' });
        }

        if (serverResult.rows[0].owner_id === userId) {
            return res.status(403).json({ error: 'Server owner cannot leave server. Use delete server instead.' });
        }

        // Remove user from server
        await db.query(
            'DELETE FROM server_members WHERE user_id = $1 AND server_id = $2',
            [userId, serverId]
        );

        res.json({ message: 'Successfully left server' });
    } catch (error) {
        console.error('Leave server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getPublicServers = async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log('Getting public servers for user:', userId);
        
        // Get public servers with basic info and member count, excluding servers the user is already in
        const serversResult = await db.query(`
            SELECT 
                s.id, s.name, s.description, s.icon_url, s.invite_code, s.created_at, s.updated_at, s.is_public,
                COUNT(sm.user_id) as member_count
            FROM servers s
            LEFT JOIN server_members sm ON s.id = sm.server_id
            WHERE s.is_public = TRUE 
            AND s.id NOT IN (
                SELECT server_id 
                FROM server_members 
                WHERE user_id = $1
            )
            GROUP BY s.id, s.name, s.description, s.icon_url, s.invite_code, s.created_at, s.updated_at, s.is_public
            ORDER BY member_count DESC, s.created_at DESC
        `, [userId]);

        console.log('Found public servers:', serversResult.rows.length);
        console.log('Public servers:', serversResult.rows);

        res.json({ data: serversResult.rows });
    } catch (error) {
        console.error('Get public servers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Validation rules
const serverValidation = [
    body('name')
        .isLength({ min: 1, max: 100 })
        .withMessage('Server name must be between 1 and 100 characters')
        .trim(),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters')
        .trim(),
    body('isPublic')
        .optional()
        .isBoolean()
        .withMessage('isPublic must be a boolean value')
];

module.exports = {
    createServer,
    getUserServers,
    getServerById,
    joinServer,
    updateServer,
    deleteServer,
    leaveServer,
    getPublicServers,
    serverValidation
};
