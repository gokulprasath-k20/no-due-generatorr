-- First, add the assignment_submitted column if it doesn't exist
DO $$
BEGIN
    -- Check if assignmentSubmitted column exists in either case
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'marks' 
        AND column_name = 'assignmentSubmitted'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'marks' 
        AND column_name = 'assignment_submitted'
    ) THEN
        -- Add the column if it doesn't exist in either case
        ALTER TABLE marks 
        ADD COLUMN assignment_submitted BOOLEAN NOT NULL DEFAULT FALSE;
        
        RAISE NOTICE 'Added assignment_submitted column to marks table';
    ELSE
        RAISE NOTICE 'assignmentSubmitted or assignment_submitted column already exists';
    END IF;
    
    -- Rename if using camelCase to snake_case
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'marks' 
        AND column_name = 'assignmentSubmitted'
    ) THEN
        ALTER TABLE marks RENAME COLUMN "assignmentSubmitted" TO assignment_submitted;
        RAISE NOTICE 'Renamed assignmentSubmitted to assignment_submitted';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'marks' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE marks 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Set initial value for existing rows
        UPDATE marks 
        SET updated_at = COALESCE(created_at, NOW())
        WHERE updated_at IS NULL;
        
        RAISE NOTICE 'Added updated_at column to marks table';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error updating database schema: %', SQLERRM;
END $$;

-- Create or replace the update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'update_marks_updated_at'
    ) THEN
        CREATE TRIGGER update_marks_updated_at
        BEFORE UPDATE ON marks
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        
        RAISE NOTICE 'Created update_marks_updated_at trigger';
    END IF;
END $$;

-- Create or replace the function to update marks
CREATE OR REPLACE FUNCTION update_student_marks(
    p_student_id UUID,
    p_subject TEXT,
    p_iat1 INTEGER DEFAULT NULL,
    p_iat2 INTEGER DEFAULT NULL,
    p_model INTEGER DEFAULT NULL,
    p_signed BOOLEAN DEFAULT FALSE,
    p_assignment_submitted BOOLEAN DEFAULT FALSE,
    p_department_fine INTEGER DEFAULT 0
) 
RETURNS VOID AS $$
BEGIN
    -- First try to update existing record
    UPDATE marks
    SET 
        iat1 = COALESCE(p_iat1, iat1),
        iat2 = COALESCE(p_iat2, iat2),
        model = COALESCE(p_model, model),
        signed = COALESCE(p_signed, signed),
        assignment_submitted = COALESCE(p_assignment_submitted, assignment_submitted),
        department_fine = COALESCE(p_department_fine, department_fine),
        updated_at = NOW()
    WHERE student_id = p_student_id 
    AND subject = p_subject;
    
    -- If no rows were updated, insert a new record
    IF NOT FOUND THEN
        INSERT INTO marks (
            student_id, 
            subject, 
            iat1, 
            iat2, 
            model, 
            signed, 
            assignment_submitted, 
            department_fine,
            created_at,
            updated_at
        )
        VALUES (
            p_student_id, 
            p_subject, 
            p_iat1, 
            p_iat2, 
            p_model, 
            p_signed, 
            p_assignment_submitted, 
            p_department_fine,
            NOW(),
            NOW()
        )
        ON CONFLICT (student_id, subject) 
        DO UPDATE SET 
            iat1 = EXCLUDED.iat1,
            iat2 = EXCLUDED.iat2,
            model = EXCLUDED.model,
            signed = EXCLUDED.signed,
            assignment_submitted = EXCLUDED.assignment_submitted,
            department_fine = EXCLUDED.department_fine,
            updated_at = NOW();
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error in update_student_marks: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
