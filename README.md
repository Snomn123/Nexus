# Discord Clone

A full-stack Discord-like chat application built with React, Node.js, PostgreSQL, Redis, and Socket.IO.

## Features

- **Real-time messaging** with Socket.IO
- **User authentication** with JWT and HTTP-only cookies
- **Server and channel management** 
- **User presence** and online status
- **Message replies** and editing
- **Typing indicators**
- **Secure password hashing** with bcrypt
- **Redis caching** for performance
- **PostgreSQL database** with proper relationships
- **Responsive UI** with TailwindCSS
- **TypeScript** for type safety

## Tech Stack

### Backend
- **Node.js** with Express
- **Socket.IO** for real-time communication
- **PostgreSQL** for data persistence
- **Redis** for caching and session management
- **JWT** for authentication
- **bcrypt** for password hashing
- **Express Rate Limiting** for security

### Frontend  
- **React** with TypeScript
- **TailwindCSS** for styling
- **Axios** for API calls
- **Socket.IO Client** for real-time features
- **React Router** for navigation

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd discord-clone
   ```

2. **Start the databases with Docker**
   ```bash
   docker-compose up -d
   ```

3. **Set up the backend**
   ```bash
   cd backend
   cp .env.example .env
   npm install
   ```

4. **Set up the frontend**
   ```bash
   cd ../frontend
   cp .env.example .env
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
DB_NAME=discord_clone
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

The database schema will be automatically applied when you start the PostgreSQL container. You can also manually apply it:

```bash
docker exec -i discord_clone_postgres psql -U postgres -d discord_clone < backend/schema.sql
```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm start
   ```

3. **Access the application**
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
- **users** - User accounts and profiles
- **servers** - Discord servers/guilds
- **server_members** - Many-to-many relationship between users and servers
- **channels** - Text and voice channels within servers
- **messages** - Chat messages with reply support
- **message_attachments** - File attachments for messages
- **direct_messages** - Private messages between users
- **friends** - Friend relationships between users

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
discord-clone/
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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Inspired by Discord's user interface and functionality
- Built with modern web development best practices
- Uses industry-standard security and performance optimizations