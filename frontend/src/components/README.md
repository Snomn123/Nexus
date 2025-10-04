# Components Directory

This directory contains all React components organized by feature and purpose.

## Structure

```
components/
├── auth/           Authentication & user management
├── chat/           Unified messaging system
├── server/         Server management & communities
├── friends/        Social features & friend management
├── shared/         Reusable UI components
└── legacy/         Components being replaced
```

## Quick Import Guide

```tsx
// Import by category for clean code
import { LoginForm } from './auth';
import { UnifiedChat, UnifiedMessageInput } from './chat';
import { ServerBrowser } from './server';
import { Spinner, UserAvatar } from './shared';
```

## Chat System

The unified chat system (`./chat/`) handles Nexus messaging:

- Use these components for all new chat features
- Works everywhere: Server channels, DMs, future group chats
- Single implementation: Write once, works everywhere

### Core Chat Components:

| Component | Purpose |
|-----------|---------|
| `UnifiedChat` | Main chat container - drop-in for any chat context |
| `UnifiedMessageList` | Message display with grouping & scroll management |
| `UnifiedMessageItem` | Individual message with actions (reply/edit/delete) |
| `UnifiedMessageInput` | Message input with reply preview & keyboard shortcuts |

## Shared Components

Reusable UI components that maintain consistency:

| Component | Use Case |
|-----------|----------|
| `Spinner` | Loading indicators (sm/md/lg, multiple colors) |
| `UserAvatar` | Consistent user avatars with fallbacks |
| `LoadingState` | Full-page loading with custom messages |
| `EmptyState` | Empty state messaging with icons |

## Migration Notes

**Legacy components** are being replaced with the unified system:

- `DMChat.tsx` → Use `UnifiedChat` with DM context
- `MessageList.tsx` → Use `UnifiedMessageList` 
- `MessageInput.tsx` → Use `UnifiedMessageInput`

**Why?** The old system required implementing every feature twice (servers + DMs). The new system implements once and works everywhere.

## 🎯 Development Guidelines

### ✅ For New Features:
1. **Chat features** → Add to `UnifiedMessageItem` (works everywhere)
2. **Reusable UI** → Create in `shared/` folder
3. **Feature-specific** → Add to appropriate category folder

### 🔍 Finding Components:
- Need messaging? → `chat/`
- Need server management? → `server/`
- Need authentication? → `auth/`
- Need social features? → `friends/`
- Need reusable UI? → `shared/`

---

This organization makes the codebase easy to navigate and maintain. Every component has a clear purpose and location.