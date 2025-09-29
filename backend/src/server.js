const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const SocketHandler = require('./socket/socketHandler');
const { middleware: apiResponseMiddleware } = require('./utils/apiResponse');

// Import routes
const authRoutes = require('./routes/auth');
const serverRoutes = require('./routes/servers');
const messageRoutes = require('./routes/messages');
const friendsRoutes = require('./routes/friends');
const dmRoutes = require('./routes/dm');

const app = express();
const server = http.createServer(app);

// Trust proxy for nginx reverse proxy
app.set('trust proxy', true);

// Socket.IO setup with CORS
const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:3000",
    "http://192.168.1.85:3000",
    "https://snomn123.github.io",
    "https://snomn123.github.io/Nexus"
];

const io = socketIo(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    },
    // Add debug logging
    transports: ['polling', 'websocket'],
    allowEIO3: true
});

// Add Socket.IO engine debug logging
io.engine.on('initial_headers', (headers, req) => {
    console.log('Socket.IO initial headers from:', req.url);
});

io.engine.on('connection_error', (err) => {
    console.error('Socket.IO engine connection error:', err);
});

io.on('connect_error', (err) => {
    console.error('Socket.IO connect error:', err);
});

console.log('Socket.IO server initialized with CORS origin:', process.env.FRONTEND_URL || "http://localhost:3000");

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Add standardized API response methods
app.use(apiResponseMiddleware);

// Rate limiting middleware
const rateLimit = require('express-rate-limit');

// Different rate limits for development vs production
const rateLimitConfig = process.env.NODE_ENV === 'production' ? {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes in production
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    }
} : {
    windowMs: 1 * 60 * 1000, // 1 minute in development
    max: 1000, // Much higher limit for development testing
    message: {
        error: 'Rate limit exceeded (development mode)',
        retryAfter: '1 minute'
    }
};

const limiter = rateLimit({
    ...rateLimitConfig,
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);
console.log(`Rate limiting enabled for ${process.env.NODE_ENV || 'development'} with ${rateLimitConfig.max} requests per ${rateLimitConfig.windowMs / 60000} minutes`);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/dm', dmRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.apiSuccess({
        status: 'OK',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: require('../package.json').version
    }, 'Service is healthy');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: err.message
        });
    }
    
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid token'
        });
    }
    
    // Handle database errors
    if (err.code === '23505') { // Unique constraint violation
        return res.status(409).json({
            error: 'Resource already exists'
        });
    }
    
    // Default error
    res.status(500).json({
        error: 'Internal server error'
    });
});

// Note: 404 handler removed due to path-to-regexp compatibility issue
// Routes not matching API endpoints will be handled by frontend

// Initialize Socket.IO handler
const socketHandler = new SocketHandler(io);

// Make socket handler available to routes
app.set('socketHandler', socketHandler);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Process terminated');
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('Process terminated');
    });
});

module.exports = { app, server, io };