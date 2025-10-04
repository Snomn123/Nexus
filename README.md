# Nexus

A **zero-knowledge**, real-time communication platform with **mandatory end-to-end encryption** by default. Built with React, Node.js, and PostgreSQL.

## Security First

**ALL COMMUNICATIONS ARE ENCRYPTED BY DEFAULT** - No optional encryption, no plaintext fallbacks.

- **Zero-Knowledge Architecture**: Server cannot decrypt any messages
- **Mandatory E2EE**: System refuses unencrypted communications  
- **Client-Side Encryption**: Messages encrypted before leaving your device
- **Secure Authentication**: Passwords hashed client-side before transmission

## Features

- **Always-On End-to-End Encryption** for all messaging
- Real-time communication via WebSockets
- Unified messaging system with consistent features across server channels and DMs
- Server communities with channels and member management
- Friend system with request management
- Message replies, editing, and deletion
- User presence indicators (online/offline/away/busy)
- Responsive web interface

## Architecture

- Component-based architecture organized by feature
- Unified chat system eliminates code duplication
- Full TypeScript coverage
- Real-time synchronization across clients
- Comprehensive documentation and clear project structure

## Tech Stack

- Frontend: React 18 + TypeScript
- Backend: Node.js + Express + Socket.io
- Database: PostgreSQL + Redis
- Encryption: AES-256 with PBKDF2 key derivation
- Deployment: Docker Compose
- Architecture: Component-based, feature-organized

## Codebase Structure

The project uses a feature-organized architecture:

```
frontend/src/
├── components/            # UI Components (organized by feature)
│   ├── auth/             # Authentication (login, register)
│   ├── chat/             # Unified messaging system
│   ├── server/           # Server management & communities
│   ├── friends/          # Social features & friends
│   ├── shared/           # Reusable UI components
│   └── legacy/           # Components being replaced
├── contexts/             # React state management
├── services/             # API calls & external services
├── types/                # TypeScript definitions
└── utils/                # Helper functions

backend/src/
├── controllers/          # Business logic & request handling
├── routes/               # API route definitions
├── socket/               # Real-time WebSocket handlers
├── middleware/           # Authentication & validation
└── migrations/           # Database schema changes
```

### Key Benefits
- Components organized by feature for easy navigation
- Unified chat system eliminates code duplication
- Comprehensive TypeScript coverage
- Extensive documentation for developers

### Documentation
- [`FRONTEND_ARCHITECTURE.md`](FRONTEND_ARCHITECTURE.md) - Complete structure guide
- [`DEVELOPER_NAVIGATION.md`](DEVELOPER_NAVIGATION.md) - Development task reference
- [`UNIFIED_SYSTEM_GUIDE.md`](UNIFIED_SYSTEM_GUIDE.md) - Messaging architecture

## Security Guarantees for New Installations

**When you download and set up Nexus today, you get:**

✅ **Encryption by Default**: All messages automatically encrypted  
✅ **Zero-Knowledge Database**: Server stores only encrypted content  
✅ **Secure Authentication**: Passwords protected during transmission  
✅ **No Plaintext Fallbacks**: System blocks unencrypted communications  
✅ **Privacy by Design**: Even administrators cannot read your messages  

**Database Schema**: New installations create tables with `is_encrypted = TRUE` by default and enforce encryption constraints.

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Snomn123/Nexus.git
   cd Nexus
   ```

2. Start the application:
   ```bash
   cp .env.docker.example .env.docker
   docker-compose up -d
   ```

3. Open http://localhost:3000 in your browser

**Security Note**: First-time setup automatically creates an encrypted-by-default environment. All user communications are immediately protected with end-to-end encryption.

The database schema is automatically created on first startup.

### Development Setup

To run services locally for development:

1. Start only the databases:
   ```bash
   docker-compose up -d postgres redis
   ```

2. Run the backend:
   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run dev
   ```

3. Run the frontend:
   ```bash
   cd frontend  
   cp .env.example .env
   npm install
   npm start
   ```

## Configuration

Environment files are created automatically from examples during setup. The default configuration works for local development.

### Changing Default Ports

Edit `docker-compose.yml` to change port mappings if needed:

```yaml
services:
  frontend:
    ports:
      - "3000:80"  # Change first number for different frontend port
  
  backend:
    ports:
      - "5000:5000"  # Change first number for different backend port
```

### Database Schema

The database schema is automatically created from `backend/schema.sql` on first startup. It includes:

- User authentication and profiles
- Servers and channels
- Encrypted messaging system
- Friend relationships
- All required indexes and constraints

## Usage

After starting the application:

1. Navigate to http://localhost:3000
2. Create a new account or login
3. Add friends by username or email
4. Start messaging or create servers for group communication

## API Reference

The backend provides a REST API at http://localhost:5000/api with endpoints for:

- Authentication: `/auth/login`, `/auth/register`
- Friends: `/friends/*`
- Messages: `/messages/*` 
- Direct Messages: `/dm/*`
- Servers: `/servers/*`

WebSocket events are handled at the same base URL for real-time features.

## Development

### Running Tests

Backend:
```bash
cd backend && npm test
```

Frontend:
```bash
cd frontend && npm test
```

### Database Migrations

For developers making schema changes:

```bash
cd backend
npm run migrate:status    # Check migration status
npm run migrate          # Apply pending migrations  
npm run migrate:create   # Create new migration
```

### Project Structure

```
nexus/
├── backend/               # Node.js API server
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   └── utils/         # Utilities
│   └── schema.sql         # Database schema
├── frontend/              # React application  
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   └── services/      # API services
├── docker-compose.yml     # Docker services
└── README.md
```

## Troubleshooting

### Application Not Starting
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs frontend

# Restart services
docker-compose restart
```

### Database Issues
```bash
# Reset database (destroys data)
docker-compose down -v
docker-compose up -d
```

### Port Conflicts
If ports 3000 or 5000 are in use, modify the port mappings in `docker-compose.yml`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.