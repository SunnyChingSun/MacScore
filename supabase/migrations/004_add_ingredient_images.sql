-- Add image_url column to ingredients table
ALTER TABLE ingredients 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create index on image_url for faster lookups (optional)
CREATE INDEX IF NOT EXISTS idx_ingredients_image_url ON ingredients(image_url) WHERE image_url IS NOT NULL;


