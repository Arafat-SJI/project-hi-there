SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('activity_logs', 'knowledge_sources', 'meeting_transcripts', 'tasks')
ORDER BY table_name;
