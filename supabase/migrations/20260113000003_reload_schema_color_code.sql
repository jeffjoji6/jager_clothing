-- Reload schema cache to recognize color_code column
-- This ensures PostgREST recognizes the new column

NOTIFY pgrst, 'reload schema';
