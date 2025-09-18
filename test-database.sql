-- Test script to verify database schema and data
-- Run this in Supabase SQL Editor to check if everything is working

-- 1. Check if tables exist and have correct structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name IN ('students', 'marks', 'admins')
ORDER BY table_name, ordinal_position;

-- 2. Check if we have any students
SELECT COUNT(*) as student_count FROM students;

-- 3. Check if we have any marks
SELECT COUNT(*) as marks_count FROM marks;

-- 4. Check marks structure - should include new columns
SELECT 
    subject,
    iat1,
    iat2, 
    model,
    signed,
    assignmentSubmitted,
    departmentFine
FROM marks 
LIMIT 5;

-- 5. Test creating a sample student (will be auto-deleted)
DO $$
DECLARE
    test_student_id UUID;
    marks_created INTEGER;
BEGIN
    -- Insert test student
    INSERT INTO students (name, register_number, department, year, semester)
    VALUES ('Test Student', 'TEST001', 'Computer Science and Engineering', 2, 3)
    RETURNING id INTO test_student_id;
    
    -- Check if marks were auto-created
    SELECT COUNT(*) INTO marks_created 
    FROM marks 
    WHERE student_id = test_student_id;
    
    RAISE NOTICE 'Test student created with ID: %', test_student_id;
    RAISE NOTICE 'Marks auto-created: %', marks_created;
    
    -- Show the created marks
    RAISE NOTICE 'Created marks:';
    FOR rec IN 
        SELECT subject, assignmentSubmitted, departmentFine 
        FROM marks 
        WHERE student_id = test_student_id 
        ORDER BY subject
    LOOP
        RAISE NOTICE 'Subject: %, Assignment: %, Fees: %', rec.subject, rec.assignmentSubmitted, rec.departmentFine;
    END LOOP;
    
    -- Clean up test data
    DELETE FROM students WHERE id = test_student_id;
    
    RAISE NOTICE 'Test completed and cleaned up';
END $$;

-- 6. Verify admin user exists
SELECT username, full_name, is_active FROM admins;
