-- Add encryption support to messages and direct messages
-- Migration: 20250920_000004_add_encryption_fields.sql

-- Add encryption fields to messages table
ALTER TABLE messages 
ADD COLUMN encrypted_content TEXT,
ADD COLUMN is_encrypted BOOLEAN DEFAULT FALSE,
ADD COLUMN encryption_version VARCHAR(10);

-- Add encryption fields to direct_messages table
ALTER TABLE direct_messages
ADD COLUMN encrypted_content TEXT,
ADD COLUMN is_encrypted BOOLEAN DEFAULT FALSE,
ADD COLUMN encryption_version VARCHAR(10);

-- Add indexes for performance on encrypted fields
CREATE INDEX IF NOT EXISTS idx_messages_encrypted ON messages(is_encrypted);
CREATE INDEX IF NOT EXISTS idx_direct_messages_encrypted ON direct_messages(is_encrypted);