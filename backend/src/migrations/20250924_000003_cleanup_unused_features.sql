-- Migration: Simplified Schema - Remove Unused Features
-- Created: 2025-09-24

-- Clean up unused tables and features

-- Drop unused message_attachments table
DROP TABLE IF EXISTS message_attachments CASCADE;

-- Remove voice channel support (simplify to text only)
-- Update any voice channels to text
UPDATE channels SET type = 'text' WHERE type = 'voice';

-- Drop unnecessary indexes for removed features
DROP INDEX IF EXISTS idx_message_attachments_message_id;

-- Remove voice-related socket events are handled in code, not DB

-- Remove unused updated_at triggers for frequently changing tables
-- Keep triggers only for tables that actually need them
DO $$
BEGIN
    -- Keep triggers for: users, servers, channels, friend_requests
    -- Remove for: messages, direct_messages (too frequent updates)
    
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_messages_updated_at') THEN
        DROP TRIGGER update_messages_updated_at ON messages;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_direct_messages_updated_at') THEN
        DROP TRIGGER update_direct_messages_updated_at ON direct_messages;
    END IF;
END
$$;