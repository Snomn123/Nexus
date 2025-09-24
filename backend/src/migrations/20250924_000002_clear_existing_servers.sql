-- Clear all existing servers and related data
-- This will delete all servers, server members, channels, and messages

-- Delete messages first (due to foreign key constraints)
DELETE FROM messages WHERE channel_id IN (
  SELECT id FROM channels WHERE server_id IN (
    SELECT id FROM servers
  )
);

-- Delete channels
DELETE FROM channels WHERE server_id IN (
  SELECT id FROM servers
);

-- Delete server members
DELETE FROM server_members;

-- Finally delete servers
DELETE FROM servers;

-- Reset sequences if needed
SELECT setval('servers_id_seq', 1, false);
SELECT setval('channels_id_seq', 1, false);
SELECT setval('messages_id_seq', 1, false);
SELECT setval('server_members_id_seq', 1, false);