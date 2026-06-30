-- RLS policies moved to 20260101_meeting_transcripts.sql (table did not exist at this version).

DO $$ BEGIN
  RAISE NOTICE 'Skipping early meeting_transcripts RLS (applied with table creation).';
END $$;
