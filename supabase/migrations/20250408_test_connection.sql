-- Create a test table to verify Supabase connection
CREATE TABLE IF NOT EXISTS test_connection (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert a test record
INSERT INTO test_connection (message) 
VALUES ('Connection successful!'); 