-- Add is_public column to servers table
-- This migration handles existing databases that don't have the is_public column

-- Add the is_public column with default value
ALTER TABLE servers ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

-- Update existing servers to be public by default
UPDATE servers SET is_public = TRUE WHERE is_public IS NULL;