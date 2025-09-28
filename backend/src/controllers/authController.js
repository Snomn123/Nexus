const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { generateTokens, verifyRefreshToken } = require('../middleware/auth');
const { sanitizeUsername, sanitizeEmail } = require('../utils/security');

const register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const rawUsername = req.body.username;
        const rawEmail = req.body.email;
        const { password } = req.body;

        // Sanitize inputs
        const username = sanitizeUsername(rawUsername);
        const email = sanitizeEmail(rawEmail);
        
        // Validate sanitized inputs
        if (!username || username.length < 3 || username.length > 20) {
            return res.status(400).json({ error: 'Username must be 3-20 characters and contain only letters, numbers, spaces, underscores, and hyphens' });
        }
        
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Please provide a valid email address' });
        }

        // Check if user already exists
        const existingUser = await db.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user
        const newUser = await db.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
            [username, email, passwordHash]
        );

        const user = newUser.rows[0];
        
        // Auto-join the user to the global "Nexus" server
        try {
            const globalServerResult = await db.query(
                'SELECT id FROM servers WHERE name = $1',
                ['Nexus']
            );
            
            if (globalServerResult.rows.length > 0) {
                const serverId = globalServerResult.rows[0].id;
                
                // Add user to the global server
                await db.query(
                    'INSERT INTO server_members (user_id, server_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                    [user.id, serverId, 'member']
                );
                
                console.log(`User ${user.username} auto-joined global Nexus server`);
            }
        } catch (error) {
            console.error('Error auto-joining user to global server:', error);
            // Don't fail registration if this fails
        }
        
        const { accessToken, refreshToken } = generateTokens(user.id);

        // Store refresh token in Redis
        await db.redisClient.setEx(`refresh_token:${user.id}`, 604800, refreshToken); // 7 days

        // Set HTTP-only cookies
        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { password } = req.body;
        const email = sanitizeEmail(req.body.email);
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const userResult = await db.query(
            'SELECT id, username, email, password_hash FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = userResult.rows[0];

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update user status to online
        await db.query('UPDATE users SET status = $1 WHERE id = $2', ['online', user.id]);

        const { accessToken, refreshToken } = generateTokens(user.id);

        // Store refresh token in Redis
        await db.redisClient.setEx(`refresh_token:${user.id}`, 604800, refreshToken); // 7 days

        // Set HTTP-only cookies
        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const logout = async (req, res) => {
    try {
        const userId = req.user.id;

        // Update user status to offline
        await db.query('UPDATE users SET status = $1 WHERE id = $2', ['offline', userId]);

        // Remove refresh token from Redis
        await db.redisClient.del(`refresh_token:${userId}`);

        // Clear cookies
        res.clearCookie('token');
        res.clearCookie('refreshToken');

        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }

        const decoded = verifyRefreshToken(refreshToken);
        
        // Check if refresh token exists in Redis
        const storedToken = await db.redisClient.get(`refresh_token:${decoded.userId}`);
        if (!storedToken || storedToken !== refreshToken) {
            return res.status(403).json({ error: 'Invalid refresh token' });
        }

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

        // Update refresh token in Redis
        await db.redisClient.setEx(`refresh_token:${decoded.userId}`, 604800, newRefreshToken);

        // Set new cookies
        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({ message: 'Token refreshed successfully' });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(403).json({ error: 'Invalid refresh token' });
    }
};

const me = async (req, res) => {
    try {
        res.json({
            user: req.user
        });
    } catch (error) {
        console.error('Me endpoint error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Validation rules
const registerValidation = [
    body('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Username can only contain letters, numbers, hyphens, and underscores'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];

const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

module.exports = {
    register,
    login,
    logout,
    refreshToken,
    me,
    registerValidation,
    loginValidation
};