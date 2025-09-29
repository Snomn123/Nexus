# Contributing to Nexus

This document provides guidelines for contributing to Nexus.

## Getting Started

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- Git
- Basic knowledge of React, TypeScript, and Node.js

### Development Setup
1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/Nexus.git
   cd Nexus
   ```

2. **Set up environment**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   # Edit .env files as needed
   ```

3. **Start development environment**
   ```bash
   docker-compose up -d postgres redis
   cd backend && npm install && npm run migrate && npm run dev
   cd ../frontend && npm install && npm start
   ```

## Development Guidelines

### Code Standards
- TypeScript: Use strict typing, avoid `any` types
- ESLint: Follow configured rules (Airbnb + custom)
- Prettier: Code is auto-formatted on save
- Naming: Use descriptive variable and function names

### Commit Messages
Follow conventional commits format:
```
type(scope): description

feat(auth): add OAuth2 integration
fix(messages): resolve encryption key derivation bug
docs(readme): update installation instructions
style(ui): improve button hover states
refactor(api): extract message validation logic
test(e2e): add user registration flow tests
```

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

## Pull Request Process

### Before Submitting
1. **Test your changes**
   ```bash
   # Run frontend tests
   cd frontend && npm test
   
   # Run backend tests
   cd backend && npm test
   
   # Check TypeScript compilation
   npm run build
   ```

2. **Lint your code**
   ```bash
   cd frontend && npm run lint
   cd backend && npm run lint
   ```

3. **Update documentation** if needed

### PR Requirements
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated for new functionality
- [ ] Documentation updated if needed
- [ ] No merge conflicts
- [ ] Descriptive PR title and description

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
```

## Bug Reports

### Before Reporting
1. Check existing issues
2. Reproduce the bug
3. Test in latest version

### Bug Report Template
```markdown
**Describe the bug**
Clear description of the issue

**To Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What should have happened

**Screenshots**
Add screenshots if applicable

**Environment:**
- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 91]
- Version: [e.g. v1.2.3]

**Additional context**
Any other relevant information
```

## Feature Requests

### Feature Request Template
```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
Clear description of desired solution

**Describe alternatives considered**
Alternative solutions you've considered

**Additional context**
Any other context, screenshots, or mockups
```

## Architecture Overview

### Frontend Structure
```
src/
├── components/     # Reusable UI components
├── contexts/       # React contexts (Auth, Socket, etc.)
├── hooks/          # Custom React hooks
├── services/       # API services and utilities
├── types/          # TypeScript type definitions
└── utils/          # Helper functions
```

### Backend Structure
```
src/
├── controllers/    # Request handlers
├── middleware/     # Auth, validation middleware
├── routes/         # API route definitions
├── socket/         # WebSocket event handlers
├── migrations/     # Database migrations
└── utils/          # Helper functions
```

## Testing

### Frontend Testing
- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Cypress (planned)
- **Component Testing**: Storybook (planned)

### Backend Testing
- **Unit Tests**: Jest + Supertest
- **Integration Tests**: Database + API testing
- **Load Testing**: Artillery (planned)

### Test Commands
```bash
# Frontend tests
cd frontend
npm test                    # Run all tests
npm test -- --coverage     # Run with coverage
npm test -- --watch        # Watch mode

# Backend tests
cd backend
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

## Security

### Reporting Security Issues
**DO NOT** create public issues for security vulnerabilities.

Email: security@nexus.example.com

Include:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Security Guidelines
- Never commit secrets or API keys
- Use environment variables for configuration
- Follow OWASP security practices
- Validate all user inputs
- Use prepared statements for database queries

## Resources

### Learning Resources
- [React Documentation](https://reactjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Socket.io Documentation](https://socket.io/docs/)

### Project Resources
- [GitHub Issues](https://github.com/Snomn123/Nexus/issues)
- [Project Board](https://github.com/Snomn123/Nexus/projects)
- [Wiki](https://github.com/Snomn123/Nexus/wiki)

## Community

### Communication Channels
- **GitHub Discussions**: General questions and ideas
- **GitHub Issues**: Bug reports and feature requests
- **Discord Server**: Real-time community chat (coming soon)

### Code of Conduct
We are committed to providing a friendly, safe, and welcoming environment for all contributors. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Special contributor badge (future feature)

Thank you for contributing to Nexus.