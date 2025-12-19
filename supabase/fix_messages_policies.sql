-- Fix for duplicate messages policies
-- Run this if you're getting "policy already exists" error

-- Drop all existing messages policies (both old and new names)
DROP POLICY IF EXISTS "Users can view messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their chats" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- Create new policies with updated names (support both match_id and chat_id)
CREATE POLICY "Users can view messages in their chats"
  ON messages FOR SELECT
  USING (
    -- Support old match_id structure
    (
      EXISTS (
        SELECT 1 FROM matches
        WHERE matches.id = messages.match_id
        AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
      )
    ) OR (
      -- Support new chat_id structure
      EXISTS (
        SELECT 1 FROM chats
        WHERE chats.id = messages.chat_id
        AND chats.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can send messages in their chats"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      -- Support old match_id structure
      (
        EXISTS (
          SELECT 1 FROM matches
          WHERE matches.id = messages.match_id
          AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
        )
      ) OR (
        -- Support new chat_id structure
        EXISTS (
          SELECT 1 FROM chats
          WHERE chats.id = messages.chat_id
          AND chats.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id);

