-- Auto-Escalation System for Unassigned Complaints
-- Complaints validated but not assigned within 2 days are escalated to warden

-- Add a function to check and escalate overdue complaints
CREATE OR REPLACE FUNCTION escalate_overdue_complaints()
RETURNS void AS $$
BEGIN
    -- Update complaints that are validated but not assigned for more than 2 minutes (TESTING - change to '2 days' for production)
    UPDATE complaints
    SET 
        status = 'escalated',
        escalated_to = 'warden',
        escalated_at = NOW(),
        updated_at = NOW()
    WHERE 
        status = 'validated'
        AND validated_at IS NOT NULL
        AND validated_at < NOW() - INTERVAL '2 minutes'
        AND escalated_at IS NULL;
        
    -- Log the escalation in complaint history
    INSERT INTO complaint_history (complaint_id, action, from_status, to_status, notes, created_at)
    SELECT 
        id,
        'auto_escalated',
        'validated',
        'escalated',
        'Automatically escalated to warden - not assigned within 2 minutes (TESTING)',
        NOW()
    FROM complaints
    WHERE 
        status = 'escalated'
        AND escalated_to = 'warden'
        AND escalated_at >= NOW() - INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run the escalation check (if using pg_cron extension)
-- Note: This requires pg_cron extension to be enabled in Supabase
-- Alternatively, this can be called from the backend API periodically

-- For manual testing, you can run:
-- SELECT escalate_overdue_complaints();

-- Add index for better performance on escalation queries
CREATE INDEX IF NOT EXISTS idx_complaints_validated_at ON complaints(validated_at);
CREATE INDEX IF NOT EXISTS idx_complaints_escalated_at ON complaints(escalated_at);
CREATE INDEX IF NOT EXISTS idx_complaints_escalated_to ON complaints(escalated_to);

-- View to easily see complaints that need escalation
CREATE OR REPLACE VIEW complaints_pending_escalation AS
SELECT 
    c.id,
    c.title,
    c.description,
    c.category,
    c.location,
    c.priority,
    c.validated_at,
    c.validated_by,
    u.name as validated_by_name,
    EXTRACT(EPOCH FROM (NOW() - c.validated_at))/60 as minutes_since_validation
FROM complaints c
LEFT JOIN users u ON c.validated_by = u.id
WHERE 
    c.status = 'validated'
    AND c.validated_at IS NOT NULL
    AND c.validated_at < NOW() - INTERVAL '2 minutes'
    AND c.escalated_at IS NULL
ORDER BY c.validated_at ASC;

-- View to see all escalated complaints
CREATE OR REPLACE VIEW escalated_complaints AS
SELECT 
    c.id,
    c.title,
    c.description,
    c.category,
    c.location,
    c.priority,
    c.status,
    c.escalated_to,
    c.escalated_at,
    c.validated_at,
    EXTRACT(DAY FROM (c.escalated_at - c.validated_at)) as days_before_escalation,
    u.name as submitted_by
FROM complaints c
LEFT JOIN users u ON c.user_id = u.id
WHERE 
    c.status = 'escalated'
    OR c.escalated_at IS NOT NULL
ORDER BY c.escalated_at DESC;
