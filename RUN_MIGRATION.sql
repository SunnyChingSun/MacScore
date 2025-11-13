-- Run this SQL in your Supabase SQL Editor to add the image_url column to ingredients table
-- This fixes the error: "Could not find the 'image_url' column of 'ingredients' in the schema cache"

-- Add image_url column to ingredients table if it doesn't exist
ALTER TABLE ingredients 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create index on image_url for faster lookups (optional)
CREATE INDEX IF NOT EXISTS idx_ingredients_image_url ON ingredients(image_url) WHERE image_url IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ingredients' AND column_name = 'image_url';

