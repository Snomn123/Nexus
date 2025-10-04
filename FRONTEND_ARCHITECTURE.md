# Nexus Frontend Architecture Guide

## Project Structure

```
frontend/src/
├── App.tsx                    # Main application component
├── App.css                    # Global styles
├── index.tsx                  # React entry point
│
├── components/                # UI Components (organized by feature)
│   ├── auth/                 # Authentication & user management
│   ├── chat/                 # Unified messaging system
│   ├── server/               # Server management & communities
│   ├── friends/              # Social features & friend management
│   ├── shared/               # Reusable UI components
│   └── legacy/               # Components being replaced
│
├── contexts/                  # React Context providers
│   ├── AuthContext.tsx          # User authentication state
│   ├── SocketContext.tsx        # Real-time WebSocket connection
│   ├── DMContext.tsx            # Direct message state
│   └── FriendsContext.tsx       # Friends & social state
│
├── services/                  # API & external service integrations
│   ├── api.ts                   # REST API calls
│   ├── unifiedAPI.ts            # Unified message system adapters
│   └── encryptionService.js     # Message encryption
│
├── types/                     # TypeScript type definitions
│   ├── index.ts                 # Core application types
│   └── unified.ts               # Unified messaging system types
│
├── utils/                     # Helper functions & utilities
│   ├── avatarColors.ts          # User avatar color generation
│   ├── dateFormatting.ts        # Date/time formatting utilities
│   └── sounds.ts                # Notification sounds
│
└── hooks/                     # Custom React hooks
    └── useKeyboardShortcuts.ts  # Keyboard shortcut handling
```

## Quick Start Guide

### Understanding the Chat System
```tsx
// Modern: Use unified components for new development
import { UnifiedChat } from './components/chat';

// Legacy: Avoid these (being replaced)
import { MessageList, DMChat } from './components/legacy';
```

### Adding New Features
```tsx
// Chat features -> add to components/chat/
// Server features -> add to components/server/
// Social features -> add to components/friends/
// Reusable UI -> add to components/shared/
```

### Component Import Patterns
```tsx
// Import by category for better organization
import { LoginForm, RegisterForm } from 'components/auth';
import { UnifiedChat, UnifiedMessageInput } from 'components/chat';
import { Spinner, UserAvatar } from 'components/shared';
```

## Architecture Principles

### Unified System Benefits
- Single Implementation: Write once, works for both server channels and DMs
- Consistent UX: Same behavior across all chat contexts
- Easy Maintenance: Bug fixes apply everywhere
- Type Safety: Strong TypeScript prevents errors

### Folder Organization Rules
1. Feature-Based: Group by what the component does
2. Clear Hierarchy: shared -> specific features -> legacy
3. Import Simplicity: Each folder has index.ts for easy imports
4. Migration Path: Legacy folder isolates old code during transition

## Component Categories

### Authentication (`components/auth/`)
- `LoginForm` - User login interface
- `RegisterForm` - New user registration

### Chat System (`components/chat/`) - Preferred for new development
- `UnifiedChat` - Main chat container (works for servers + DMs)
- `UnifiedMessageList` - Message list with grouping & scrolling
- `UnifiedMessageItem` - Individual message rendering
- `UnifiedMessageInput` - Message input with reply preview
- `DMChatUnified` - DM-specific chat implementation

### Server Management (`components/server/`)
- `ServerBrowser` - Discover and join servers
- `ServerChat` - Server channel chat interface
- `ServerListItem` - Individual server in sidebar
- `ServerSettingsModal` - Server configuration

### Friends & Social (`components/friends/`)
- `FriendsList` - Friends management interface

### Shared Components (`components/shared/`)
- `Spinner` - Loading indicators (multiple sizes/colors)
- `UserAvatar` - Consistent user avatar display
- `LoadingState` - Full loading UI with message
- `EmptyState` - Empty state messaging

### Legacy (`components/legacy/`) - Avoid using
- Old message components being replaced
- Only import if absolutely necessary
- Prefer unified components instead

## State Management

### Contexts
```tsx
// Authentication & user data
const { user, login, logout } = useAuth();

// Real-time WebSocket connection
const { socket, connected } = useSocket();

// Direct messaging state
const { activeConversation, messages, sendDirectMessage } = useDM();

// Friends & social features  
const { friends, friendRequests, sendFriendRequest } = useFriends();
```

## API Architecture

### Service Layer
```tsx
// REST API calls
import { messageAPI, dmAPI, serverAPI } from 'services/api';

// Unified message system (handles both server + DM messages)
import { getMessageHandlers } from 'services/unifiedAPI';
```

## Development Workflows

### Adding a New Chat Feature
```tsx
// 1. Add to UnifiedMessageItem (renders in all chat contexts)
// 2. Update UnifiedMessage interface if needed
// 3. Test in both server channels and DMs
// 4. Feature works everywhere
```

### Adding a New UI Component
```tsx
// 1. Create in appropriate category folder
// 2. Export from category index.ts
// 3. Add to main components/index.ts
// 4. Document in this guide
```

### Migrating Legacy Code
```tsx
// 1. Keep legacy component for now
// 2. Create equivalent with unified system
// 3. Test new implementation thoroughly
// 4. Update imports to use new component
// 5. Remove legacy component
```

## Finding Components

### **Component Finder**
| Need a... | Look in... | Examples |
|-----------|------------|----------|
| **Chat feature** | `components/chat/` | Messages, replies, input |
| **Server feature** | `components/server/` | Browse, join, settings |
| **Auth feature** | `components/auth/` | Login, register |
| **Social feature** | `components/friends/` | Friends list, requests |
| **Reusable UI** | `components/shared/` | Spinners, avatars, states |
| **Legacy code** | `components/legacy/` | Old implementations |

### **Quick Search Tips**
```bash
# Find all chat components
find . -path "*/components/chat/*" -name "*.tsx"

# Find component usage
grep -r "UnifiedChat" src/

# Find type definitions  
grep -r "interface.*Message" src/types/
```

**Import errors:**
```tsx
// Wrong: Deep imports
import UnifiedChat from './components/chat/UnifiedChat';

// Correct: Category imports  
import { UnifiedChat } from './components/chat';
```

**Type errors:**
```tsx
// Wrong: Using legacy types
const message: Message | DirectMessage = ...;

// Correct: Using unified types
const message: UnifiedMessage = ...;
```

**Feature duplication:**
```tsx
// Wrong: Implementing for each message type
// (adds to MessageList AND DMChat)

// Correct: Implement once in unified system
// (add to UnifiedMessageItem)
```

---