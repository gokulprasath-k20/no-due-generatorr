-- Database Fix for No Due Certificate System
-- Run this SQL in your Supabase Dashboard -> SQL Editor to fix the save issues

-- 1. First, let's check if the marks table has the correct columns
-- If you get errors, it means the columns don't exist and need to be added

-- Check current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'marks' 
ORDER BY ordinal_position;

-- 2. Add missing columns if they don't exist
-- This will safely add columns only if they're missing

-- Add assignmentSubmitted column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'marks' AND column_name = 'assignmentSubmitted'
    ) THEN
        ALTER TABLE marks ADD COLUMN assignmentSubmitted BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added assignmentSubmitted column';
    ELSE
        RAISE NOTICE 'assignmentSubmitted column already exists';
    END IF;
END $$;

-- Add departmentFine column if it doesn't exist (note: camelCase)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'marks' AND column_name = 'departmentFine'
    ) THEN
        ALTER TABLE marks ADD COLUMN departmentFine INTEGER DEFAULT 0 CHECK (departmentFine >= 0);
        RAISE NOTICE 'Added departmentFine column';
    ELSE
        RAISE NOTICE 'departmentFine column already exists';
    END IF;
END $$;

-- Add department_fine column if it doesn't exist (note: snake_case)
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

-- 3. Create a trigger to sync both column formats if both exist
CREATE OR REPLACE FUNCTION sync_department_fine_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- If departmentFine is updated, sync to department_fine
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Check if both columns exist
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'marks' AND column_name = 'departmentFine'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'marks' AND column_name = 'department_fine'
        ) THEN
            -- Sync the values
            NEW.department_fine := COALESCE(NEW.departmentFine, NEW.department_fine, 0);
            NEW.departmentFine := COALESCE(NEW.departmentFine, NEW.department_fine, 0);
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_department_fine_trigger ON marks;

-- Create trigger only if both columns exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'marks' AND column_name = 'departmentFine'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'marks' AND column_name = 'department_fine'
    ) THEN
        CREATE TRIGGER sync_department_fine_trigger
            BEFORE INSERT OR UPDATE ON marks
            FOR EACH ROW
            EXECUTE FUNCTION sync_department_fine_columns();
        RAISE NOTICE 'Created sync trigger for department fine columns';
    END IF;
END $$;

-- 4. Update existing records to ensure all have default values
UPDATE marks 
SET 
    assignmentSubmitted = COALESCE(assignmentSubmitted, FALSE),
    departmentFine = COALESCE(departmentFine, 0),
    department_fine = COALESCE(department_fine, 0),
    signed = COALESCE(signed, FALSE)
WHERE 
    assignmentSubmitted IS NULL 
    OR departmentFine IS NULL 
    OR department_fine IS NULL 
    OR signed IS NULL;

-- 5. Ensure all students have marks for their subjects
-- This function will create missing marks entries
CREATE OR REPLACE FUNCTION ensure_student_marks()
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
            INSERT INTO marks (student_id, subject, iat1, iat2, model, signed, assignmentSubmitted, departmentFine, department_fine)
            SELECT 
                student_record.id, 
                subject_name, 
                NULL, 
                NULL, 
                NULL, 
                FALSE, 
                FALSE, 
                0,
                0
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
SELECT ensure_student_marks() as marks_created;

-- 6. Verify the fix by checking a sample of data
SELECT 
    s.name,
    s.register_number,
    s.semester,
    COUNT(m.id) as total_marks,
    COUNT(CASE WHEN m.assignmentSubmitted IS NOT NULL THEN 1 END) as has_assignment_field,
    COUNT(CASE WHEN m.departmentFine IS NOT NULL THEN 1 END) as has_department_fine_camel,
    COUNT(CASE WHEN m.department_fine IS NOT NULL THEN 1 END) as has_department_fine_snake
FROM students s
LEFT JOIN marks m ON s.id = m.student_id
GROUP BY s.id, s.name, s.register_number, s.semester
ORDER BY s.semester, s.name
LIMIT 10;

-- 7. Show final table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'marks' 
ORDER BY ordinal_position;

-- Success message
SELECT 'Database fix completed successfully! All students should now have proper marks entries with correct columns.' as status;
