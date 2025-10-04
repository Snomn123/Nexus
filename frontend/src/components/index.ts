// NEXUS COMPONENT ARCHITECTURE
// Organized by feature and purpose for easy navigation

// Authentication & User Management
export * from './auth';

// Modern Chat System (Unified - Use These for New Development)
export * from './chat';

// Server Management & Communities
export * from './server';

// Friends & Social Features
export * from './friends';

// Shared/Reusable Components
export * from './shared';

// Core App Components
export { default as Home } from './Home';
export { default as Avatar } from './Avatar';
export { default as EncryptionStatus } from './EncryptionStatus';

// Legacy Components (Being Phased Out)
// Import from './legacy' only if absolutely necessary
// Prefer unified components from './chat' instead
export * from './legacy';

/*
FOLDER STRUCTURE GUIDE:

auth/           - Login, Register, User Authentication
chat/           - Modern unified chat system (USE THESE)
server/         - Server browsing, management, settings
friends/        - Friends list, social features
shared/         - Reusable UI components (Spinner, Avatar, etc.)
legacy/         - Old components being replaced (avoid using)

FOR NEW FEATURES:
- Use components from chat/ for messaging
- Use components from shared/ for common UI
- Add new features to appropriate category folder
*/