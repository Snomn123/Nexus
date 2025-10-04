import React from 'react';
// This shows how easy migration is - just swap the import and update props

// OLD WAY - Multiple components, duplicate logic:
/*
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import DMChat from './components/DMChat';

// Server messages required 2 separate components:
<div className="chat-container">
  <MessageList 
    channelId={channelId}
    messages={messages}
    onReply={setReplyingTo}
    onMessageDeleted={handleMessageDeleted}
  />
  <MessageInput 
    channelId={channelId}
    replyingTo={replyingTo}
    onCancel={() => setReplyingTo(null)}
  />
</div>

// DM messages required a completely different component:
<DMChat />
*/

// NEW WAY - Single component, unified logic:
import { ServerChat } from '../server';
import { DMChatUnified } from '../chat';

const ExampleMigration: React.FC = () => {
  // Server messages - ONE component:
  const ServerMessageExample = () => (
    <ServerChat
      channelId={1}
      channelName="general"
      messages={[]}
      loading={false}
    />
  );

  // DM messages - ONE component with same interface:
  const DMMessageExample = () => (
    <DMChatUnified
      conversationId="conv_123"
      participantUsername="alice"
      participantId={2}
      messages={[]}
      loading={false}
    />
  );

  return (
    <div>
      {/* Both work identically - same features, same UI, same behavior */}
      <ServerMessageExample />
      <DMMessageExample />
    </div>
  );
};

export default ExampleMigration;