-- Recovered 2026-08-02 from prod migration history (was applied via dashboard only).

-- Add image support to league_posts
ALTER TABLE league_posts ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Post comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      UUID NOT NULL REFERENCES league_posts(id) ON DELETE CASCADE,
  league_id    UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body         TEXT CHECK (char_length(body) <= 500),
  image_url    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT body_or_image CHECK (body IS NOT NULL OR image_url IS NOT NULL)
);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- League members can read comments in their league
CREATE POLICY "league members can view post comments"
  ON post_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM league_members
      WHERE league_members.league_id = post_comments.league_id
        AND league_members.user_id = auth.uid()
    )
  );

-- League members can insert their own comments
CREATE POLICY "league members can post comments"
  ON post_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM league_members
      WHERE league_members.league_id = post_comments.league_id
        AND league_members.user_id = auth.uid()
    )
  );

-- Users can delete their own comments
CREATE POLICY "users can delete own comments"
  ON post_comments FOR DELETE
  USING (user_id = auth.uid());

-- Commissioners can delete any comment in their league
CREATE POLICY "commissioners can delete any comment"
  ON post_comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM league_members
      WHERE league_members.league_id = post_comments.league_id
        AND league_members.user_id = auth.uid()
        AND league_members.is_commissioner = TRUE
    )
  );

-- Storage bucket for post images (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  TRUE,
  5242880,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone authenticated can upload to post-images
CREATE POLICY "authenticated users can upload post images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'post-images');

-- Public read for post images
CREATE POLICY "public can view post images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'post-images');

-- Users can delete their own uploaded images
CREATE POLICY "users can delete own post images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'post-images' AND owner = auth.uid());
