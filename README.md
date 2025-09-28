# Nexus - Real-Time Discord Clone

<div align="center">
  <h3>🚀 A modern, secure real-time communication platform</h3>
  
  [![Production Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](https://github.com/Snomn123/Nexus)
  [![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
  [![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://docker.com/)
  [![E2EE](https://img.shields.io/badge/Security-End--to--End%20Encrypted-red?logo=shield)](https://github.com/Snomn123/Nexus)

  <p><em>Experience seamless communication with military-grade encryption, real-time messaging, and modern UI design.</em></p>
</div>

---

## ✨ Features

### 🔐 **Security & Privacy**
- **🛡️ End-to-End Encryption** - AES-256 encryption ensures your messages stay private
- **🔑 Zero-Knowledge Architecture** - Server administrators cannot read your messages
- **🚪 JWT Authentication** - Secure login with refresh token rotation
- **🔒 HTTPS/WSS** - All traffic encrypted in transit

### 💬 **Communication**
- **⚡ Real-Time Messaging** - Instant message delivery via WebSockets
- **📱 Direct Messages** - Private conversations between friends
- **🏟️ Server Channels** - Organized team communication
- **↩️ Message Replies** - Thread-like conversation context
- **✏️ Message Editing** - Edit and delete your messages
- **👀 Typing Indicators** - See when others are typing

### 👥 **Social Features**
- **👫 Friend System** - Send and manage friend requests
- **🟢 Online Presence** - Real-time user status indicators
- **👤 User Profiles** - Customizable avatars and usernames
- **🎨 Avatar System** - Colorful generated avatars

### 🎨 **User Experience**
- **📱 Responsive Design** - Works perfectly on desktop and mobile
- **🌙 Modern UI** - Clean, Discord-inspired interface
- **🔊 Sound Notifications** - Audio cues for new messages
- **⌨️ Keyboard Shortcuts** - Power user productivity features
- **📄 Message History** - Paginated message loading

---

## 🏗️ Architecture

### **Tech Stack**
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Socket.io
- **Database**: PostgreSQL with Redis caching
- **Security**: AES-256 encryption + PBKDF2 key derivation
- **Infrastructure**: Docker + Docker Compose

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose
- npm or yarn
- Git

### Quick Start (Recommended)

Option 1: Automated Setup (Easiest)

1. Clone and run setup script
   ```bash
   git clone https://github.com/Snomn123/Nexus.git
   cd Nexus
   
   # On Linux/Mac
   chmod +x setup.sh && ./setup.sh
   
   # On Windows
   setup.bat
   ```

2. Start the applications
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm run dev
   
   # Terminal 2: Start frontend  
   cd frontend
   npm install && npm start
   ```

Option 2: Manual Setup

1. Clone the repository
   ```bash
   git clone https://github.com/Snomn123/Nexus.git
   cd Nexus
   ```

2. Set up environment files
   ```bash
   # Copy environment files
   cp .env.docker.example .env.docker
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. Start the databases
   ```bash
   # Start databases with Docker
   docker-compose up -d postgres redis
   ```

4. Set up and run the applications
   ```bash
   # Install backend dependencies and run migrations
   cd backend
   npm install
   npm run migrate
   npm run dev

   # In a new terminal, install frontend dependencies
   cd frontend
   npm install
   npm start
   ```

### Manual Installation (Alternative)

If you prefer to set up each component manually:

1. Clone the repository
   ```bash
   git clone https://github.com/Snomn123/Nexus.git
   cd Nexus
   ```

2. Start only the databases with Docker
   ```bash
   docker-compose up -d postgres redis
   ```

3. Set up the backend
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env file with your database credentials if needed
   npm install
   ```

4. Set up the frontend
   ```bash
   cd ../frontend
   cp .env.example .env
   # Edit .env file with your API URLs if needed
   npm install
   ```

### Environment Configuration

#### Backend (.env)
```bash
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexus
DB_USER=postgres
DB_PASSWORD=password

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
```

#### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### Database Setup

The project includes a complete database schema that's ready to use:

Automatic Setup (Recommended)
The database schema will be automatically applied when you start the PostgreSQL container with Docker.

Manual Database Setup
If you need to manually set up the database or reset it:

```bash
# If using Docker (recommended)
docker exec -i nexus_postgres psql -U postgres -d nexus < backend/schema.sql

# If using a local PostgreSQL installation
psql -U postgres -d nexus -f backend/schema.sql
```

Migration System
The project includes a built-in migration system for schema updates:

```bash
cd backend

# Check migration status
npm run migrate:status

# Run pending migrations (if any)
npm run migrate

# Create a new migration (for development)
npm run migrate:create "description of changes"
```

Database Schema Includes:
- Users and authentication
- Servers and channels
- Messages and direct messages
- Friends and friend requests
- Proper indexes for performance
- All necessary constraints and triggers

### Running the Application

1. Start the backend server
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend development server
   ```bash
   cd frontend
   npm start
   ```

3. Access the application
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - Database Admin (Adminer): http://localhost:8080

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user  
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Servers
- `GET /api/servers` - Get user's servers
- `POST /api/servers` - Create new server
- `GET /api/servers/:id` - Get server details
- `PUT /api/servers/:id` - Update server
- `DELETE /api/servers/:id` - Delete server
- `POST /api/servers/join` - Join server with invite code

### Messages
- `GET /api/messages/channels/:channelId` - Get channel messages
- `POST /api/messages/channels/:channelId` - Send message
- `PUT /api/messages/:messageId` - Edit message
- `DELETE /api/messages/:messageId` - Delete message

## Socket.IO Events

### Client to Server
- `join_channel` - Join a channel room
- `leave_channel` - Leave a channel room
- `send_message` - Send a message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator

### Server to Client
- `new_message` - New message received
- `user_typing` - User started typing
- `user_stopped_typing` - User stopped typing
- `user_status_change` - User online/offline status changed

## Database Schema

### Tables
- users - User accounts and profiles
- servers - Nexus workspaces/servers
- server_members - Many-to-many relationship between users and servers
- channels - Text and voice channels within servers
- messages - Chat messages with reply support
- message_attachments - File attachments for messages
- direct_messages - Private messages between users
- friends - Friend relationships between users

## Development Scripts

### Backend
```bash
npm run dev          # Start development server with nodemon
npm start           # Start production server
npm run build       # Build TypeScript (if using TS)
```

### Frontend
```bash
npm start           # Start development server
npm run build       # Build for production
npm test            # Run tests
npm run eject       # Eject from Create React App
```

## Project Structure

```
nexus/
├── backend/
│   ├── src/
│   │   ├── config/         # Database and app configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic services
│   │   ├── socket/         # Socket.IO handlers
│   │   └── utils/          # Utility functions
│   ├── schema.sql         # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   └── package.json
├── docker-compose.yml     # Docker services
└── README.md
```

## Security Features

- **JWT with HTTP-only cookies** for secure authentication
- **Password hashing** with bcrypt
- **Rate limiting** to prevent abuse
- **CORS configuration** for cross-origin requests
- **Input validation** on all endpoints
- **SQL injection protection** with parameterized queries
- **XSS protection** with helmet

## Performance Optimizations

- **Redis caching** for frequently accessed data
- **Database indexing** for optimal query performance
- **Connection pooling** for PostgreSQL
- **Message pagination** to reduce data transfer
- **Optimized SQL queries** with proper joins

## Troubleshooting

### Common Issues

**Database connection issues:**
- Make sure Docker is running and containers are up: `docker-compose ps`
- Check database logs: `docker-compose logs postgres`
- Verify environment variables in `.env` files

**Frontend not loading:**
- Ensure `frontend/public/index.html` exists (it should be included in the repository)
- Check that the React dev server is running on port 3000
- Verify API URL in `frontend/.env` matches your backend

**Backend API errors:**
- Check that migrations ran successfully: `cd backend && npm run migrate:status`
- Verify database connection in backend logs
- Ensure all npm dependencies are installed

**Port conflicts:**
- Frontend runs on port 3000
- Backend runs on port 5000  
- PostgreSQL runs on port 5432
- Redis runs on port 6379
- Make sure these ports are available

### Project Validation

To verify the project is set up correctly after cloning:

```bash
# On Linux/Mac
chmod +x validate.sh && ./validate.sh

# On Windows (PowerShell)
# Check key files exist
Get-ChildItem backend\schema.sql, README.md, docker-compose.yml, frontend\public\index.html
```

### Fresh Install Reset

If you need to completely reset the project:

```bash
# Stop all containers
docker-compose down -v

# Remove node_modules (optional)
rm -rf backend/node_modules frontend/node_modules

# Start fresh
docker-compose up -d
cd backend && npm install && npm run migrate
cd ../frontend && npm install && npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Inspired by modern real-time collaboration platforms
- Built with modern web development best practices
- Uses industry-standard security and performance optimizations
- Designed for seamless team communication and collaboration