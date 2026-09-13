/*
  # Add user_id to chats table for multi-user isolation

  1. Changes
    - Adds `user_id` column (text) to `chats` table.
    - Creates index on `user_id` for fast filtering.
*/

ALTER TABLE chats ADD COLUMN IF NOT EXISTS user_id text;

CREATE INDEX IF NOT EXISTS chats_user_id_idx ON chats(user_id);
