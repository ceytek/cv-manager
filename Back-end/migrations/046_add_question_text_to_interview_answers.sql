-- Migration: Add question_text to interview_answers table
-- This stores the question text at the time of answering, 
-- so template changes don't affect completed interviews

ALTER TABLE interview_answers
ADD COLUMN question_text TEXT DEFAULT NULL;

COMMENT ON COLUMN interview_answers.question_text IS 'The question text at the time the answer was given. Preserves history even if template questions change.';

-- Backfill existing answers with current question text from questions table
UPDATE interview_answers a
SET question_text = q.question_text
FROM interview_questions q
WHERE a.question_id = q.id AND a.question_text IS NULL;

