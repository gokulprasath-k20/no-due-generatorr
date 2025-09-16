-- Add department column to students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS department TEXT;

-- Update existing rows to have a default department if needed
UPDATE students
SET department = 'Computer Science and Engineering'
WHERE department IS NULL;
