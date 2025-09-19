-- Corrected Database Fix for No Due Certificate System
-- This handles PostgreSQL's case-insensitive column names

-- 1. Check current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'marks' 
ORDER BY ordinal_position;

-- 2. Add missing columns with proper case handling
-- PostgreSQL converts unquoted identifiers to lowercase

-- Add assignmentSubmitted column if it doesn't exist (checking lowercase)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'marks' AND column_name = 'assignmentsubmitted'
    ) THEN
        ALTER TABLE marks ADD COLUMN "assignmentSubmitted" BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added assignmentSubmitted column';
    ELSE
        RAISE NOTICE 'assignmentSubmitted column already exists (as assignmentsubmitted)';
    END IF;
END $$;

-- Add departmentFine column if it doesn't exist (checking lowercase)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'marks' AND column_name = 'departmentfine'
    ) THEN
        ALTER TABLE marks ADD COLUMN "departmentFine" INTEGER DEFAULT 0 CHECK ("departmentFine" >= 0);
        RAISE NOTICE 'Added departmentFine column';
    ELSE
        RAISE NOTICE 'departmentFine column already exists (as departmentfine)';
    END IF;
END $$;

-- Add department_fine column if it doesn't exist (snake_case version)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'marks' AND column_name = 'department_fine'
    ) THEN
        ALTER TABLE marks ADD COLUMN department_fine INTEGER DEFAULT 0 CHECK (department_fine >= 0);
        RAISE NOTICE 'Added department_fine column';
    ELSE
        RAISE NOTICE 'department_fine column already exists';
    END IF;
END $$;

-- 3. Update the API to use the correct column names
-- Since PostgreSQL has converted the columns to lowercase, we need to update our API

-- 4.-- Update existing records to ensure all have default values
-- Set departmentfine to 100 (unpaid) by default, not 0 (paid)
UPDATE marks 
SET 
    assignmentsubmitted = COALESCE(assignmentsubmitted, FALSE),
    departmentfine = CASE 
        WHEN departmentfine IS NULL THEN 100 
        ELSE departmentfine 
    END,
    signed = COALESCE(signed, FALSE)
WHERE 
    assignmentsubmitted IS NULL 
    OR departmentfine IS NULL 
    OR signed IS NULL;

-- 5. Ensure all students have marks for their subjects
CREATE OR REPLACE FUNCTION ensure_student_marks_corrected()
RETURNS INTEGER AS $$
DECLARE
    student_record RECORD;
    subjects TEXT[];
    subject_name TEXT;
    marks_count INTEGER := 0;
BEGIN
    -- Loop through all students
    FOR student_record IN SELECT id, year, semester FROM students LOOP
        -- Get subjects for this student's year and semester
        IF student_record.year = 2 AND student_record.semester = 3 THEN
            subjects := ARRAY['DM', 'DPCO', 'DSA', 'FDS', 'Oops', 'Office', 'Library'];
        ELSIF student_record.year = 2 AND student_record.semester = 4 THEN
            subjects := ARRAY['TOC', 'AI&ML', 'DBMS', 'WE', 'INTRODUCTION OF OS', 'ESS', 'Office', 'Library'];
        ELSIF student_record.year = 3 AND student_record.semester = 5 THEN
            subjects := ARRAY['Computer Network', 'Distributing Computing', 'Es&IoT', 'Full Stack WebDevelopment', 'Software Testing & Automation', 'Cloud Computing', 'Office', 'Library'];
        ELSIF student_record.year = 3 AND student_record.semester = 6 THEN
            subjects := ARRAY['Compiler Design', 'Mobile Application Development', 'Cyber Security', 'Data Science', 'Project Management', 'Office', 'Library'];
        ELSIF student_record.year = 4 AND student_record.semester = 7 THEN
            subjects := ARRAY['Machine Learning', 'Big Data Analytics', 'Blockchain Technology', 'Advanced Algorithms', 'Research Methodology', 'Office', 'Library'];
        ELSIF student_record.year = 4 AND student_record.semester = 8 THEN
            subjects := ARRAY['Project Work', 'Industrial Training', 'Seminar', 'Comprehensive Viva', 'Office', 'Library'];
        ELSE
            subjects := ARRAY['DM', 'DPCO', 'DSA', 'FDS', 'Oops', 'Office', 'Library'];
        END IF;
        
        -- Create marks for each subject if they don't exist
        FOREACH subject_name IN ARRAY subjects LOOP
            INSERT INTO marks (student_id, subject, iat1, iat2, model, signed, assignmentsubmitted, departmentfine)
            SELECT 
                student_record.id, 
                subject_name, 
                NULL, 
                NULL, 
                NULL, 
                FALSE, 
                FALSE, 
                100
            WHERE NOT EXISTS (
                SELECT 1 FROM marks 
                WHERE student_id = student_record.id AND subject = subject_name
            );
            
            GET DIAGNOSTICS marks_count = ROW_COUNT;
        END LOOP;
    END LOOP;
    
    RETURN marks_count;
END;
$$ LANGUAGE plpgsql;

-- Run the function to ensure all students have marks
SELECT ensure_student_marks_corrected() as marks_created;

-- 6. Test upsert with correct column names
DO $$
DECLARE
    test_student_id UUID;
    test_result TEXT;
BEGIN
    SELECT id INTO test_student_id FROM students LIMIT 1;
    
    IF test_student_id IS NOT NULL THEN
        BEGIN
            INSERT INTO marks (student_id, subject, iat1, iat2, model, signed, assignmentsubmitted, departmentfine)
            VALUES (test_student_id, 'TEST_SUBJECT', 85, 90, 88, false, true, 0)
            ON CONFLICT (student_id, subject) 
            DO UPDATE SET 
                iat1 = EXCLUDED.iat1,
                iat2 = EXCLUDED.iat2,
                model = EXCLUDED.model,
                signed = EXCLUDED.signed,
                assignmentsubmitted = EXCLUDED.assignmentsubmitted,
                departmentfine = EXCLUDED.departmentfine,
                updated_at = NOW();
            
            test_result := 'SUCCESS: Upsert operation works with correct column names';
            
            -- Clean up test data
            DELETE FROM marks WHERE student_id = test_student_id AND subject = 'TEST_SUBJECT';
            
        EXCEPTION WHEN OTHERS THEN
            test_result := 'ERROR: ' || SQLERRM;
        END;
    ELSE
        test_result := 'ERROR: No students found for testing';
    END IF;
    
    RAISE NOTICE '%', test_result;
END $$;

-- 7. Show final column structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'marks' 
ORDER BY ordinal_position;

-- Success message
SELECT 'Database fix completed! Column names corrected for PostgreSQL case-insensitive behavior.' as status;
