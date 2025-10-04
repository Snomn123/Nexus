# Nexus Component Map

## Component Relationships

```
┌─────────────────┐
│      App.tsx    │  ← Main application shell
└─────────────────┘
         │
    ┌────▼────┐
    │  Home   │  ← Main dashboard/landing
    └─────────┘
         │
    ┌────▼────┐
    │ Router  │  ← Navigation between views
    └─────────┘
         │
    ┌────▼────────────────────────────┐
    │        Feature Views            │
    └─────────────────────────────────┘
         │
    ┌────▼─────┬─────┬─────┬─────────┐
    │   Auth   │Chat │Srvr │ Friends │
    └──────────┴─────┴─────┴─────────┘
```

## Chat System Architecture

```
UnifiedChat  ← Main container
    │
    ├── UnifiedMessageList  ← Message display
    │   │
    │   └── UnifiedMessageItem[]  ← Individual messages
    │       │
    │       ├── UserAvatar  ← User profile pic
    │       ├── Message actions (reply/edit/delete)
    │       └── Reply indicators
    │
    └── UnifiedMessageInput  ← Message composition
        │
        ├── Reply preview
        ├── Send button  
        └── Keyboard shortcuts
```

## Data Flow

```
User Action
    │
    ▼
Component Event Handler
    │
    ▼
API Service Call
    │
    ▼
Context State Update  
    │
    ▼
Component Re-render
    │
    ▼
Socket.io Real-time Sync
```

## Import Hierarchy

```
┌─────────────────────────┐
│     App-Level Imports   │
│  (contexts, services)   │
└─────────────────────────┘
            │
┌─────────────────────────┐
│   Category Imports      │
│ (auth, chat, server)    │  
└─────────────────────────┘
            │
┌─────────────────────────┐
│   Shared Components     │
│ (Spinner, Avatar, etc.) │
└─────────────────────────┘
            │
┌─────────────────────────┐
│     Utility Functions   │
│ (dateFormatting, etc.)  │
└─────────────────────────┘
```

## Component Patterns

### 1. **Container Components**
```tsx
// Handle data fetching and state management
const ChatContainer = () => {
  const [messages, setMessages] = useState([]);
  // Business logic here
  return <UnifiedChat messages={messages} />;
};
```

### 2. **Presentation Components**  
```tsx
// Pure UI rendering with props
const UnifiedMessageItem = ({ message, actions }) => {
  // UI logic only
  return <div>{message.content}</div>;
};
```

### 3. **Shared Components**
```tsx
// Reusable across multiple contexts
const Spinner = ({ size, color }) => (
  <div className={`spinner ${size} ${color}`} />
);
```

## 🔍 Component Discovery

### By Feature:
- **Messaging**: `components/chat/`
- **Servers**: `components/server/`  
- **Auth**: `components/auth/`
- **Social**: `components/friends/`

### By Type:
- **UI Elements**: `components/shared/`
- **Pages**: Root level (`Home.tsx`, etc.)
- **Legacy**: `components/legacy/` (avoid)

### By Usage:
- **High Frequency**: `UnifiedChat`, `Spinner`, `UserAvatar`
- **Medium Frequency**: `ServerBrowser`, `LoginForm`
- **Low Frequency**: `ServerSettingsModal`, `EncryptionStatus`

---