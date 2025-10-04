# Developer Navigation Guide

## "I want to..." Quick Reference

### Add a messaging feature
```bash
# 1. For ALL message types (recommended):
components/chat/UnifiedMessageItem.tsx  # Add feature here
types/unified.ts                        # Update interfaces if needed

# 2. Test in both contexts:
components/server/ServerChat.tsx         # Server messages
components/chat/DMChatUnified.tsx       # Direct messages
```

### Add a server feature
```bash
components/server/                       # Server management components
services/api.ts                         # Add API calls
types/index.ts                          # Add/update Server types
```

### Add an authentication feature
```bash
components/auth/                        # Login, register, user management
contexts/AuthContext.tsx               # Auth state management
services/api.ts                        # Auth API calls
```

### Create reusable UI
```bash
components/shared/                      # Reusable components
components/shared/index.ts              # Export for easy imports
```

### Add social features
```bash
components/friends/                     # Friends, requests, etc.
contexts/FriendsContext.tsx            # Friends state
```

## File Finder

### By Feature
| Feature | Location | Key Files |
|---------|----------|-----------|
| Messaging | `components/chat/` | `UnifiedChat.tsx`, `UnifiedMessageItem.tsx` |
| Servers | `components/server/` | `ServerBrowser.tsx`, `ServerChat.tsx` |
| Auth | `components/auth/` | `LoginForm.tsx`, `RegisterForm.tsx` |
| Social | `components/friends/` | `FriendsList.tsx` |
| UI Kit | `components/shared/` | `Spinner.tsx`, `UserAvatar.tsx` |

### By File Type
| Type | Location | Purpose |
|------|----------|---------|
| State | `contexts/` | Global app state (auth, socket, etc.) |
| APIs | `services/` | External API calls and integrations |
| Types | `types/` | TypeScript interfaces and types |
| Utils | `utils/` | Helper functions and utilities |## Search Patterns

### **Find components by purpose:**
```bash
# Messaging components
find components/chat -name "*.tsx"

# Legacy code (avoid using)  
find components/legacy -name "*.tsx"

# Shared/reusable components
find components/shared -name "*.tsx"
```

### **Find usage of components:**
```bash
# Where is UnifiedChat used?
grep -r "UnifiedChat" src/

# Find all message-related types
grep -r "Message" src/types/

# Find API calls
grep -r "API" src/services/
```

## Import Cheatsheet

```tsx
// Clean: Import by category
import { LoginForm, RegisterForm } from 'components/auth';
import { UnifiedChat, UnifiedMessageInput } from 'components/chat';
import { ServerBrowser } from 'components/server';
import { Spinner, UserAvatar } from 'components/shared';

// Avoid: Deep imports
import LoginForm from 'components/auth/LoginForm';
import UnifiedChat from 'components/chat/UnifiedChat';
```

## Common Tasks

### **Add a new message action (like emoji reactions):**
```typescript
// 1. Update the unified message interface
// File: types/unified.ts
export interface UnifiedMessage {
  // ... existing fields
  reactions?: MessageReaction[];
}

// 2. Add the UI in the message component  
// File: components/chat/UnifiedMessageItem.tsx  
const ReactionButton = () => (
  <button onClick={handleAddReaction}>😀</button>
);

// 3. Add API handler
// File: services/unifiedAPI.ts
addReaction: async (messageId: number, emoji: string) => {
  // Implementation
}

// 4. Done! Works in servers + DMs + future contexts
```

### **Create a new reusable component:**
```typescript
// 1. Create component file
// File: components/shared/NewComponent.tsx
export const NewComponent = ({ prop }) => <div>{prop}</div>;

// 2. Export from index
// File: components/shared/index.ts  
export { NewComponent } from './NewComponent';

// 3. Use anywhere
import { NewComponent } from 'components/shared';
```

### **Migrate legacy code:**
```typescript
// 1. Keep old component working
// File: components/legacy/OldComponent.tsx (unchanged)

// 2. Create new version with unified system
// File: components/chat/NewComponent.tsx  

// 3. Update imports gradually
// Old: import OldComponent from 'components/legacy'; 
// New: import { NewComponent } from 'components/chat';

// 4. Remove legacy after migration complete
```

## Debugging Guide

### **TypeScript errors:**
```bash
# Check all types
npx tsc --noEmit

# Common fix: Update import paths after file moves
# Pattern: '../' becomes '../../' when moved one folder deeper
```

### **Import errors:**
```bash  
# Check component exports
cat components/[category]/index.ts

# Verify component export format
# Use: export { ComponentName } from './ComponentName';
# Or:  export default ComponentName; (then import as default)
```

### **Runtime errors:**  
```bash
# Check component is properly exported
grep -n "export" components/[category]/ComponentName.tsx

# Verify import matches export format
# Named export: import { Component } from 'path';
# Default export: import Component from 'path';
```

---