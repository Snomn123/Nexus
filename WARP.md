# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in the Nexus repository.

## Development Commands

### Initial Setup
```powershell
# Install all dependencies for monorepo
npm run install:all

# Start required services (PostgreSQL, Redis, Adminer)
docker-compose up -d

# Set up environment files
cp backend\.env.example backend\.env
cp frontend\.env.example frontend\.env
```

### Development Server Commands
```powershell
# Start backend development server with auto-reload
npm run dev:backend

# Start frontend development server
npm run frontend

# Start both frontend and backend simultaneously (separate terminals)
npm run backend    # Terminal 1
npm run frontend   # Terminal 2
```

### Backend Commands
```powershell
# Run backend server in production mode
npm run start

# Start backend with nodemon for development
cd backend && nodemon src/server.js

# Apply database schema manually
docker exec -i nexus_postgres psql -U postgres -d nexus < backend/schema.sql
```

### Frontend Commands
```powershell
# Start React development server
cd frontend && npm start

# Build for production
cd frontend && npm run build

# Run frontend tests
cd frontend && npm test
```

### Database & Infrastructure
```powershell
# View database via Adminer web interface
# Navigate to http://localhost:8080

# Connect to PostgreSQL directly
docker exec -it nexus_postgres psql -U postgres -d nexus

# Connect to Redis CLI
docker exec -it nexus_redis redis-cli

# View container logs
docker-compose logs postgres
docker-compose logs redis
```

## Architecture Overview

### Project Structure
This is a full-stack Nexus collaboration platform with a monorepo structure containing separate `backend/` and `frontend/` directories, each with their own dependencies.

### Backend Architecture (Node.js/Express)
- Server: Express server with Socket.IO for real-time communication
- Authentication: JWT with HTTP-only cookies, bcrypt password hashing
- Database Layer: PostgreSQL with connection pooling, Redis for caching/sessions
- Real-time: Socket.IO with authentication middleware and room-based messaging
- Security: Helmet, CORS, rate limiting, input validation

Key Backend Components:
- `server.js` - Main Express server with middleware setup
- `config/database.js` - PostgreSQL and Redis connection management  
- `controllers/` - Request handlers for auth, servers, messages
- `middleware/auth.js` - JWT authentication and authorization
- `socket/socketHandler.js` - Real-time messaging and user presence
- `routes/` - API endpoint definitions

### Frontend Architecture (React/TypeScript)
- Framework: React 18 with TypeScript for type safety
- Styling: TailwindCSS for responsive UI components
- API Communication: Axios with automatic token refresh interceptors
- Real-time: Socket.IO client for live messaging and user status
- State Management: React Context for auth and socket connections

Key Frontend Components:
- `services/api.ts` - Centralized API client with error handling
- `types/index.ts` - Comprehensive TypeScript type definitions
- `components/` - Reusable React components
- `contexts/` - React Context providers for global state

### Database Schema
Core Tables:
- `users` - User accounts with status tracking
- `servers` - Nexus workspace/server entities with invite codes
- `server_members` - Many-to-many user-server relationships with roles
- `channels` - Text/voice channels within servers
- `messages` - Chat messages with reply threading support
- `friends` - User friendship relationships
- `direct_messages` - Private messaging between users

Performance Features:
- Indexed columns for message queries and relationships
- Automatic timestamp triggers for `updated_at` columns
- Connection pooling for database efficiency

### Real-time Communication
- Socket Authentication: JWT verification on socket connection
- Room Management: Automatic joining of user's server channels
- Message Broadcasting: Channel-based message distribution
- Presence System: User online/offline status with disconnect handling
- Typing Indicators: Live typing status in channels

### Security Implementation
- Authentication: JWT access tokens (15 min) + refresh tokens (7 days)
- Password Security: bcrypt with 12 rounds for hashing
- Session Management: Redis-stored refresh tokens with expiration
- Input Validation: express-validator on all API endpoints  
- Rate Limiting: 100 requests per 15 minutes per IP
- CORS: Configured for frontend-backend communication

### Environment Configuration
The application requires specific environment variables for database connections, JWT secrets, and service URLs. Both backend and frontend have separate `.env.example` files showing required configurations.

### Docker Integration
PostgreSQL, Redis, and Adminer services are containerized with persistent volumes. The database schema is automatically applied on first container startup via the `docker-entrypoint-initdb.d` mechanism.

## Development Workflows

### Adding New Features
1. API Endpoints: Add routes in `backend/src/routes/`, implement controllers
2. Database Changes: Update `schema.sql` and rebuild containers if needed  
3. Frontend Integration: Add API calls to `services/api.ts`, update TypeScript types
4. Real-time Features: Extend `socketHandler.js` for live updates

### Testing Database Changes
```powershell
# Rebuild database with schema changes
docker-compose down -v
docker-compose up -d
```

### Debugging
- Backend: Check server logs and database queries in terminal
- Frontend: Use browser DevTools, check API Network tab
- Database: Use Adminer at http://localhost:8080 for query debugging
- Real-time: Monitor Socket.IO connection events in browser console

### Common Issues
- CORS Errors: Verify `FRONTEND_URL` matches actual frontend port
- Database Connection: Ensure Docker containers are running with `docker-compose ps`
- Authentication Issues: Check JWT secrets match between services
- Socket Connection: Verify token is being passed in socket auth headers