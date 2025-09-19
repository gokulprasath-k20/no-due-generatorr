-- Debug Script for No Due Certificate System
-- Run this to diagnose the save issues

-- 1. Check if tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('students', 'marks', 'admins')
ORDER BY table_name;

-- 2. Check marks table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'marks' 
ORDER BY ordinal_position;

-- 3. Check if we have any students
SELECT 
    COUNT(*) as total_students,
    COUNT(CASE WHEN semester = 3 THEN 1 END) as semester_3_students,
    COUNT(CASE WHEN semester = 4 THEN 1 END) as semester_4_students,
    COUNT(CASE WHEN semester = 5 THEN 1 END) as semester_5_students
FROM students;

-- 4. Check marks data for each student
SELECT 
    s.name,
    s.register_number,
    s.semester,
    m.subject,
    m.iat1,
    m.iat2,
    m.model,
    m.signed,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marks' AND column_name = 'assignmentSubmitted') 
        THEN m.assignmentSubmitted::text
        ELSE 'Column not found'
    END as assignment_submitted,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marks' AND column_name = 'departmentFine') 
        THEN m.departmentFine::text
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marks' AND column_name = 'department_fine') 
        THEN m.department_fine::text
        ELSE 'Column not found'
    END as department_fine
FROM students s
LEFT JOIN marks m ON s.id = m.student_id
ORDER BY s.semester, s.name, m.subject
LIMIT 20;

-- 5. Check for missing marks entries
SELECT 
    s.name,
    s.register_number,
    s.semester,
    COUNT(m.id) as marks_count,
    CASE s.semester
        WHEN 3 THEN 7  -- Expected subjects for 3rd semester
        WHEN 4 THEN 8  -- Expected subjects for 4th semester
        WHEN 5 THEN 8  -- Expected subjects for 5th semester
        WHEN 6 THEN 7  -- Expected subjects for 6th semester
        WHEN 7 THEN 7  -- Expected subjects for 7th semester
        WHEN 8 THEN 5  -- Expected subjects for 8th semester
        ELSE 7
    END as expected_subjects,
    CASE 
        WHEN COUNT(m.id) < CASE s.semester
            WHEN 3 THEN 7 WHEN 4 THEN 8 WHEN 5 THEN 8 
            WHEN 6 THEN 7 WHEN 7 THEN 7 WHEN 8 THEN 5 ELSE 7
        END THEN 'MISSING MARKS'
        ELSE 'OK'
    END as status
FROM students s
LEFT JOIN marks m ON s.id = m.student_id
GROUP BY s.id, s.name, s.register_number, s.semester
ORDER BY s.semester, s.name;

-- 6. Test upsert operation (this is what the app does)
-- This will show if there are any constraint violations
DO $$
DECLARE
    test_student_id UUID;
    test_result TEXT;
BEGIN
    -- Get a student ID for testing
    SELECT id INTO test_student_id FROM students LIMIT 1;
    
    IF test_student_id IS NOT NULL THEN
        -- Try to upsert a mark (this simulates what the app does)
        BEGIN
            INSERT INTO marks (student_id, subject, iat1, iat2, model, signed, assignmentSubmitted, departmentFine)
            VALUES (test_student_id, 'TEST_SUBJECT', 85, 90, 88, false, true, 0)
            ON CONFLICT (student_id, subject) 
            DO UPDATE SET 
                iat1 = EXCLUDED.iat1,
                iat2 = EXCLUDED.iat2,
                model = EXCLUDED.model,
                signed = EXCLUDED.signed,
                assignmentSubmitted = EXCLUDED.assignmentSubmitted,
                departmentFine = EXCLUDED.departmentFine,
                updated_at = NOW();
            
            test_result := 'SUCCESS: Upsert operation works correctly';
            
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

-- 7. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('students', 'marks', 'admins');

-- 8. Final diagnostic summary
SELECT 
    'Database Diagnostic Complete' as status,
    (SELECT COUNT(*) FROM students) as total_students,
    (SELECT COUNT(*) FROM marks) as total_marks,
    (SELECT COUNT(DISTINCT student_id) FROM marks) as students_with_marks,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marks' AND column_name = 'assignmentSubmitted') 
        THEN 'YES' 
        ELSE 'NO' 
    END as has_assignment_submitted_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marks' AND column_name = 'departmentFine') 
        THEN 'YES'
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marks' AND column_name = 'department_fine') 
        THEN 'YES (snake_case)'
        ELSE 'NO' 
    END as has_department_fine_column;
