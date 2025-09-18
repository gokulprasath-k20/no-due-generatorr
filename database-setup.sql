-- Complete Supabase Database Setup for No Due Certificate System
-- Run this SQL in your Supabase Dashboard -> SQL Editor

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS marks CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- 1. Create students table
CREATE TABLE students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    register_number TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    year INTEGER NOT NULL CHECK (year IN (2, 3)),
    semester INTEGER CHECK (semester IN (3, 4, 5)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create marks table
CREATE TABLE marks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    iat1 INTEGER CHECK (iat1 >= 0 AND iat1 <= 100),
    iat2 INTEGER CHECK (iat2 >= 0 AND iat2 <= 100),
    model INTEGER CHECK (model >= 0 AND model <= 100),
    signed BOOLEAN DEFAULT FALSE,
    assignmentSubmitted BOOLEAN DEFAULT FALSE,
    departmentFine INTEGER DEFAULT 0 CHECK (departmentFine >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, subject)
);

-- 3. Create admins table for better admin management
CREATE TABLE admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX idx_students_register_number ON students(register_number);
CREATE INDEX idx_students_year_semester ON students(year, semester);
CREATE INDEX idx_students_department ON students(department);
CREATE INDEX idx_marks_student_id ON marks(student_id);
CREATE INDEX idx_marks_subject ON marks(subject);
CREATE INDEX idx_admins_username ON admins(username);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for public access (since this is an admin-only system)
-- Allow all operations for now - you can restrict this later if needed
CREATE POLICY "Allow all operations on students" ON students
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on marks" ON marks
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on admins" ON admins
    FOR ALL USING (true) WITH CHECK (true);

-- 7. Insert default admin user
-- Default admin credentials: username = avsecit, password = avsecit001
INSERT INTO admins (username, password_hash, full_name, email) VALUES
('avsecit', 'avsecit001', 'AVS Engineering College IT Admin', 'admin@avsec.edu');

-- 8. Insert sample data for testing (optional)
-- Uncomment the following lines if you want sample data

/*
-- Sample students for different semesters
INSERT INTO students (name, register_number, department, year, semester) VALUES
('Arjun Kumar', '22CSE001', 'Computer Science and Engineering', 2, 3),
('Priya Sharma', '22CSE002', 'Computer Science and Engineering', 2, 4),
('Rahul Patel', '21CSE001', 'Computer Science and Engineering', 3, 5),
('Sneha Reddy', '22IT001', 'Information Technology', 2, 3),
('Vikram Singh', '22ECE001', 'Electronics and Communication Engineering', 2, 4);

-- Sample marks for Arjun Kumar (2nd year, 3rd semester)
INSERT INTO marks (student_id, subject, iat1, iat2, model, signed, assignmentSubmitted, departmentFine) 
SELECT id, 'DM', 85, 90, 88, false, true, 0 FROM students WHERE register_number = '22CSE001'
UNION ALL
SELECT id, 'DPCO', 78, 82, 85, false, true, 0 FROM students WHERE register_number = '22CSE001'
UNION ALL
SELECT id, 'DSA', 92, 88, 90, false, true, 0 FROM students WHERE register_number = '22CSE001'
UNION ALL
SELECT id, 'FDS', 80, 85, 83, false, true, 0 FROM students WHERE register_number = '22CSE001'
UNION ALL
SELECT id, 'Oops', 88, 90, 89, false, true, 0 FROM students WHERE register_number = '22CSE001'
UNION ALL
SELECT id, 'Office', null, null, null, false, false, 0 FROM students WHERE register_number = '22CSE001'
UNION ALL
SELECT id, 'Library', null, null, null, false, false, 0 FROM students WHERE register_number = '22CSE001';

-- Sample marks for Priya Sharma (2nd year, 4th semester)
INSERT INTO marks (student_id, subject, iat1, iat2, model, signed, assignmentSubmitted, departmentFine) 
SELECT id, 'TOC', 90, 85, 87, false, true, 0 FROM students WHERE register_number = '22CSE002'
UNION ALL
SELECT id, 'AI&ML', 88, 92, 90, false, true, 0 FROM students WHERE register_number = '22CSE002'
UNION ALL
SELECT id, 'DBMS', 85, 88, 86, false, true, 0 FROM students WHERE register_number = '22CSE002'
UNION ALL
SELECT id, 'WE', 82, 85, 84, false, true, 0 FROM students WHERE register_number = '22CSE002'
UNION ALL
SELECT id, 'INTRODUCTION OF OS', 87, 90, 89, false, true, 0 FROM students WHERE register_number = '22CSE002'
UNION ALL
SELECT id, 'ESS', 85, 88, 87, false, true, 0 FROM students WHERE register_number = '22CSE002'
UNION ALL
SELECT id, 'Office', null, null, null, false, false, 0 FROM students WHERE register_number = '22CSE002'
UNION ALL
SELECT id, 'Library', null, null, null, false, false, 0 FROM students WHERE register_number = '22CSE002';
*/

-- 9. Create a function to automatically create marks when a student is created
CREATE OR REPLACE FUNCTION create_student_marks()
RETURNS TRIGGER AS $$
DECLARE
    subjects TEXT[];
BEGIN
    -- Define subjects based on year and semester
    IF NEW.year = 2 AND NEW.semester = 3 THEN
        subjects := ARRAY['DM', 'DPCO', 'DSA', 'FDS', 'Oops', 'Office', 'Library'];
    ELSIF NEW.year = 2 AND NEW.semester = 4 THEN
        subjects := ARRAY['TOC', 'AI&ML', 'DBMS', 'WE', 'INTRODUCTION OF OS', 'ESS', 'Office', 'Library'];
    ELSIF NEW.year = 3 AND NEW.semester = 5 THEN
        subjects := ARRAY['Computer Network', 'Distributing Computing', 'Es&IoT', 'Full Stack WebDevelopment', 'Software Testing & Automation', 'Cloud Computing', 'Office', 'Library'];
    ELSE
        -- Default to 2nd year 3rd semester subjects
        subjects := ARRAY['DM', 'DPCO', 'DSA', 'FDS', 'Oops', 'Office', 'Library'];
    END IF;
    
    -- Insert marks for each subject
    INSERT INTO marks (student_id, subject, iat1, iat2, model, signed, assignmentSubmitted, departmentFine)
    SELECT NEW.id, unnest(subjects), null, null, null, false, false, 0;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to automatically create marks when student is inserted
DROP TRIGGER IF EXISTS trigger_create_student_marks ON students;
CREATE TRIGGER trigger_create_student_marks
    AFTER INSERT ON students
    FOR EACH ROW
    EXECUTE FUNCTION create_student_marks();

-- 11. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create triggers for updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marks_updated_at BEFORE UPDATE ON marks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Create a view for easy student data retrieval with marks summary
CREATE OR REPLACE VIEW student_summary AS
SELECT 
    s.id,
    s.name,
    s.register_number,
    s.department,
    s.year,
    s.semester,
    s.created_at,
    s.updated_at,
    COUNT(m.id) as total_subjects,
    COUNT(CASE WHEN m.signed = true THEN 1 END) as signed_subjects,
    COUNT(CASE WHEN m.assignmentSubmitted = true THEN 1 END) as assignments_submitted,
    SUM(m.departmentFine) as total_department_fine,
    CASE 
        WHEN COUNT(CASE WHEN m.assignmentSubmitted = true AND m.departmentFine = 0 THEN 1 END) = COUNT(CASE WHEN m.subject NOT IN ('Office', 'Library') THEN 1 END)
        AND COUNT(CASE WHEN m.signed = true AND m.subject IN ('Office', 'Library') THEN 1 END) = COUNT(CASE WHEN m.subject IN ('Office', 'Library') THEN 1 END)
        THEN 'Completed'
        ELSE 'Pending'
    END as overall_status
FROM students s
LEFT JOIN marks m ON s.id = m.student_id
GROUP BY s.id, s.name, s.register_number, s.department, s.year, s.semester, s.created_at, s.updated_at;

-- 14. Create a view for marks with student details
CREATE OR REPLACE VIEW marks_with_student AS
SELECT 
    m.*,
    s.name as student_name,
    s.register_number,
    s.department,
    s.year,
    s.semester
FROM marks m
JOIN students s ON m.student_id = s.id;

-- 15. Grant necessary permissions
GRANT ALL ON students TO anon, authenticated;
GRANT ALL ON marks TO anon, authenticated;
GRANT ALL ON admins TO anon, authenticated;
GRANT SELECT ON student_summary TO anon, authenticated;
GRANT SELECT ON marks_with_student TO anon, authenticated;

-- 16. Create useful functions for the application

-- Function to get student with marks
CREATE OR REPLACE FUNCTION get_student_with_marks(reg_no TEXT)
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    register_number TEXT,
    department TEXT,
    year INTEGER,
    semester INTEGER,
    subject TEXT,
    iat1 INTEGER,
    iat2 INTEGER,
    model INTEGER,
    signed BOOLEAN,
    assignmentSubmitted BOOLEAN,
    departmentFine INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.register_number,
        s.department,
        s.year,
        s.semester,
        m.subject,
        m.iat1,
        m.iat2,
        m.model,
        m.signed,
        m.assignmentSubmitted,
        m.departmentFine
    FROM students s
    LEFT JOIN marks m ON s.id = m.student_id
    WHERE s.register_number = reg_no;
END;
$$ LANGUAGE plpgsql;

-- Setup complete!
-- Your database is now ready for the No Due Certificate System
-- 
-- IMPORTANT: Next steps:
-- 1. Update your .env file with the correct Supabase credentials:
--    VITE_SUPABASE_URL=your_supabase_url
--    VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
--    VITE_SUPABASE_PROJECT_ID=your_project_id
--
-- 2. Test the admin panel:
--    - Go to /admin
--    - Login with: username = avsecit, password = avsecit001
--    - Create a new student
--    - Verify that marks are automatically created
--
-- 3. Database Features:
--    - Automatic marks creation when student is added
--    - Semester-based subject assignment
--    - Assignment submission and department fees tracking
--    - Due status calculation
--    - Comprehensive views for easy data retrieval
--
-- 4. Tables created:
--    - students: Student information with semester support
--    - marks: Academic marks with assignment/fees tracking
--    - admins: Admin user management
--    - student_summary: View with aggregated student data
--    - marks_with_student: View combining marks and student info
