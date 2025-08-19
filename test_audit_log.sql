-- Audit Log Verification Script
-- Run this in Supabase SQL Editor to verify audit logging is working

-- 1. Check if audit_log table has data
SELECT 
    'Audit Log Overview' as test_name,
    COUNT(*) as total_entries,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT action) as unique_actions,
    MIN(created_at) as oldest_entry,
    MAX(created_at) as newest_entry
FROM audit_log;

-- 2. Check audit entries by action type
SELECT 
    'Actions Breakdown' as test_name,
    action,
    COUNT(*) as count,
    MAX(created_at) as latest_occurrence
FROM audit_log 
GROUP BY action 
ORDER BY count DESC;

-- 3. Check audit entries by entity type
SELECT 
    'Entities Breakdown' as test_name,
    entity,
    COUNT(*) as count,
    MAX(created_at) as latest_occurrence
FROM audit_log 
GROUP BY entity 
ORDER BY count DESC;

-- 4. Recent audit activities (last 24 hours)
SELECT 
    'Recent Activities' as test_name,
    action,
    entity,
    entity_id,
    meta,
    created_at
FROM audit_log 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;

-- 5. Check for missing audit entries (potential gaps)
-- These queries check if critical actions are being logged

-- Subject creation audit
SELECT 
    'Subject Audit Check' as test_name,
    COUNT(s.id) as subjects_created,
    COUNT(a.id) as audit_entries
FROM subjects s
LEFT JOIN audit_log a ON a.entity = 'subject' 
    AND a.entity_id = s.id 
    AND a.action = 'CREATE'
    AND a.user_id = s.owner_id;

-- Student creation audit  
SELECT 
    'Student Audit Check' as test_name,
    COUNT(s.id) as students_created,
    COUNT(a.id) as audit_entries
FROM students s
LEFT JOIN audit_log a ON a.entity = 'student' 
    AND a.entity_id = s.id 
    AND a.action = 'CREATE'
    AND a.user_id = s.owner_id;

-- Assessment creation audit
SELECT 
    'Assessment Audit Check' as test_name,
    COUNT(ass.id) as assessments_created,
    COUNT(a.id) as audit_entries
FROM assessments ass
LEFT JOIN audit_log a ON a.entity = 'assessment' 
    AND a.entity_id = ass.id 
    AND a.action = 'CREATE'
    AND a.user_id = ass.owner_id;

-- Score update audit (should have many entries)
SELECT 
    'Score Audit Check' as test_name,
    COUNT(DISTINCT s.assessment_id, s.student_id) as scores_entered,
    COUNT(a.id) as audit_entries
FROM scores s
LEFT JOIN audit_log a ON a.entity = 'score' 
    AND a.action IN ('UPDATE', 'CREATE')
    AND a.user_id = s.owner_id;

-- 6. Check audit metadata quality
SELECT 
    'Metadata Quality Check' as test_name,
    action,
    entity,
    COUNT(*) as entries_with_meta,
    COUNT(*) - COUNT(meta) as entries_without_meta,
    ROUND((COUNT(meta) * 100.0 / COUNT(*)), 2) as metadata_percentage
FROM audit_log 
GROUP BY action, entity
ORDER BY metadata_percentage ASC;

-- 7. User activity summary
SELECT 
    'User Activity Summary' as test_name,
    user_id,
    COUNT(*) as total_actions,
    COUNT(DISTINCT action) as unique_actions,
    COUNT(DISTINCT entity) as entities_affected,
    MIN(created_at) as first_activity,
    MAX(created_at) as last_activity
FROM audit_log 
GROUP BY user_id
ORDER BY total_actions DESC;

-- 8. Timeline of actions (to verify chronological logging)
SELECT 
    'Timeline Verification' as test_name,
    DATE(created_at) as activity_date,
    COUNT(*) as activities_count,
    STRING_AGG(DISTINCT action, ', ') as actions_performed
FROM audit_log 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY activity_date DESC;

-- 9. Check for potential audit gaps or issues
-- This query finds entities that should have audit entries but don't
SELECT 
    'Potential Audit Gaps' as test_name,
    'subjects' as entity_type,
    COUNT(*) as records_without_audit
FROM subjects s
WHERE NOT EXISTS (
    SELECT 1 FROM audit_log a 
    WHERE a.entity = 'subject' 
    AND a.entity_id = s.id 
    AND a.action = 'CREATE'
)

UNION ALL

SELECT 
    'Potential Audit Gaps' as test_name,
    'students' as entity_type,
    COUNT(*) as records_without_audit
FROM students s
WHERE NOT EXISTS (
    SELECT 1 FROM audit_log a 
    WHERE a.entity = 'student' 
    AND a.entity_id = s.id 
    AND a.action = 'CREATE'
);

-- 10. Performance check - audit log table size and indexes
SELECT 
    'Performance Check' as test_name,
    pg_size_pretty(pg_total_relation_size('audit_log')) as table_size,
    (SELECT COUNT(*) FROM audit_log) as total_rows,
    (SELECT COUNT(*) FROM pg_stat_user_indexes WHERE relname = 'audit_log') as index_count;

-- Success Criteria:
-- 1. Audit entries exist for CREATE actions on all entities
-- 2. Score UPDATE/CREATE actions are logged
-- 3. All entries have user_id and owner_id properly set
-- 4. Recent activities are being logged
-- 5. Metadata is populated for most entries
-- 6. No significant gaps in audit trail
-- 7. Performance is acceptable (table not too large)
