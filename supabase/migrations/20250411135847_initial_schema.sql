-- Migration: initial_schema
-- Description: Creates initial tables (stacks, flashcards, generation_error_logs), sets up foreign keys to auth.users, creates indexes, enables RLS, and defines security policies.
-- Affected Tables: stacks, flashcards, generation_error_logs
-- Notes: Uses timestamptz for timestamps, includes ON DELETE CASCADE for foreign keys, and adds a trigger for updated_at.

-- Create stacks table
CREATE TABLE stacks (
    id SERIAL PRIMARY KEY,
    topic VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    model VARCHAR(255),
    generated_count INTEGER,
    accepted_unedited_count INTEGER,
    source_text_hash VARCHAR(255),
    source_text_length INTEGER,
    generation_time INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create flashcards table
CREATE TABLE flashcards (
    id SERIAL PRIMARY KEY,
    front VARCHAR(255) NOT NULL,
    back VARCHAR(255) NOT NULL,
    stack_id INTEGER NOT NULL REFERENCES stacks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create generation_error_logs table
CREATE TABLE generation_error_logs (
    id SERIAL PRIMARY KEY,
    stack_id INTEGER NOT NULL REFERENCES stacks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    error_message TEXT NOT NULL,
    error_code VARCHAR(255),
    model VARCHAR(255),
    request_payload TEXT,
    response_payload TEXT,
    stack_trace TEXT
);

-- Create Indexes
CREATE INDEX idx_flashcards_stack_id_user_id ON flashcards (stack_id, user_id);
CREATE INDEX idx_stacks_user_id ON stacks (user_id);
CREATE INDEX idx_generation_error_logs_stack_id_user_id ON generation_error_logs (stack_id, user_id);

-- Enable RLS and define policies for flashcards
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own flashcards" ON flashcards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own flashcards" ON flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own flashcards" ON flashcards FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own flashcards" ON flashcards FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS and define policies for stacks
ALTER TABLE stacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own stacks" ON stacks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own stacks" ON stacks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own stacks" ON stacks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own stacks" ON stacks FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS and define policies for generation_error_logs
ALTER TABLE generation_error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view error logs for their own stacks" ON generation_error_logs FOR SELECT USING (auth.uid() = user_id);

-- Function/trigger to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to tables with an 'updated_at' column
CREATE TRIGGER set_stacks_timestamp
BEFORE UPDATE ON stacks
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_flashcards_timestamp
BEFORE UPDATE ON flashcards
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
