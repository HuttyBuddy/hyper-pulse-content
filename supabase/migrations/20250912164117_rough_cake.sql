/*
  # Enhanced Email & Notification System

  1. New Tables
    - `user_notifications` - In-app notification system
    - Enhanced `email_campaigns` with scheduling and automation
    - Enhanced `social_media_posts` with recurring post support

  2. Security
    - Enable RLS on all new tables
    - Add policies for user-specific access

  3. Features
    - Notification system for real-time updates
    - Email campaign automation
    - Recurring social media posts
    - Enhanced lead scoring triggers
*/

-- Create user notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('lead_captured', 'content_generated', 'campaign_sent', 'system_update', 'milestone_reached')),
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  is_read boolean DEFAULT false,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON user_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON user_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON user_notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add indexes for notifications
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread 
  ON user_notifications (user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_notifications_expires 
  ON user_notifications (expires_at) WHERE expires_at IS NOT NULL;

-- Enhance email campaigns table with automation features
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_campaigns' AND column_name = 'automation_config'
  ) THEN
    ALTER TABLE email_campaigns ADD COLUMN automation_config jsonb DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_campaigns' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE email_campaigns ADD COLUMN template_id uuid;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_campaigns' AND column_name = 'send_status'
  ) THEN
    ALTER TABLE email_campaigns ADD COLUMN send_status text DEFAULT 'pending' CHECK (send_status IN ('pending', 'sending', 'sent', 'failed', 'cancelled'));
  END IF;
END $$;

-- Enhance social media posts with recurring features
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'social_media_posts' AND column_name = 'recurrence_pattern'
  ) THEN
    ALTER TABLE social_media_posts ADD COLUMN recurrence_pattern jsonb DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'social_media_posts' AND column_name = 'parent_post_id'
  ) THEN
    ALTER TABLE social_media_posts ADD COLUMN parent_post_id uuid;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'social_media_posts' AND column_name = 'auto_generated'
  ) THEN
    ALTER TABLE social_media_posts ADD COLUMN auto_generated boolean DEFAULT false;
  END IF;
END $$;

-- Create function to generate notifications
CREATE OR REPLACE FUNCTION create_user_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_action_url text DEFAULT NULL,
  p_priority text DEFAULT 'normal',
  p_metadata jsonb DEFAULT '{}'
) RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO user_notifications (
    user_id, type, title, message, action_url, priority, metadata
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_action_url, p_priority, p_metadata
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for lead notifications
CREATE OR REPLACE FUNCTION notify_new_lead() RETURNS trigger AS $$
BEGIN
  -- Create notification for new lead
  PERFORM create_user_notification(
    NEW.user_id,
    'lead_captured',
    'New Lead Captured! 🎯',
    'A new ' || COALESCE(NEW.lead_source, 'lead') || ' lead has been captured: ' || 
    COALESCE((NEW.lead_data->>'name'), (NEW.lead_data->>'email'), 'Unknown'),
    '/analytics?tab=leads',
    CASE 
      WHEN NEW.lead_source = 'property_valuation' THEN 'high'
      WHEN NEW.lead_source = 'consultation_request' THEN 'high'
      ELSE 'normal'
    END,
    jsonb_build_object(
      'lead_id', NEW.id,
      'lead_source', NEW.lead_source,
      'lead_score', NEW.lead_score
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for lead notifications
DROP TRIGGER IF EXISTS trigger_notify_new_lead ON lead_submissions;
CREATE TRIGGER trigger_notify_new_lead
  AFTER INSERT ON lead_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_lead();

-- Create trigger function for content generation notifications
CREATE OR REPLACE FUNCTION notify_content_generated() RETURNS trigger AS $$
BEGIN
  -- Create notification for new content
  PERFORM create_user_notification(
    NEW.user_id,
    'content_generated',
    'Content Generated! ✨',
    'Your ' || NEW.content_type || ' content for ' || 
    COALESCE(NEW.neighborhood, 'your area') || ' is ready to use',
    '/content/' || COALESCE(NEW.neighborhood, 'content'),
    'normal',
    jsonb_build_object(
      'content_id', NEW.id,
      'content_type', NEW.content_type,
      'neighborhood', NEW.neighborhood
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for content notifications
DROP TRIGGER IF EXISTS trigger_notify_content_generated ON content_history;
CREATE TRIGGER trigger_notify_content_generated
  AFTER INSERT ON content_history
  FOR EACH ROW
  EXECUTE FUNCTION notify_content_generated();

-- Create function to clean up old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications() RETURNS void AS $$
BEGIN
  -- Delete read notifications older than 30 days
  DELETE FROM user_notifications 
  WHERE is_read = true 
    AND created_at < now() - interval '30 days';
    
  -- Delete expired notifications
  DELETE FROM user_notifications 
  WHERE expires_at IS NOT NULL 
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;