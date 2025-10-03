# Nexus

A real-time communication platform with end-to-end encryption, built with React, Node.js, and PostgreSQL.

## Features

- End-to-end encryption for secure messaging
- Real-time communication via WebSockets
- Direct messages and server channels
- Friend system with request management
- Message replies, editing, and deletion
- User presence indicators
- Responsive web interface

## Tech Stack

- Frontend: React 18 + TypeScript
- Backend: Node.js + Express + Socket.io
- Database: PostgreSQL + Redis
- Encryption: AES-256 with PBKDF2 key derivation
- Deployment: Docker Compose

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