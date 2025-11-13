-- Add image_url column to ingredients table if it doesn't exist
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS image_url TEXT;

