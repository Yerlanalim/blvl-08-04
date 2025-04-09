-- Add notification_settings and ui_settings fields to the profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"email": {"marketing": true, "social": true, "security": true, "courseUpdates": true}, "push": {"newContent": true, "completedLevels": true, "achievements": true, "reminders": false}}'::JSONB,
  ADD COLUMN IF NOT EXISTS ui_settings JSONB DEFAULT '{"theme": "system", "fontSize": "default", "reducedMotion": false}'::JSONB;
