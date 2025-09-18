-- Remove boolean functions and columns for signature and assignment submission

-- First, drop all triggers that depend on update_updated_at_column
DROP TRIGGER IF EXISTS update_marks_updated_at ON marks;
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;

-- Now it's safe to drop the function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create a new version of the update_student_marks function without boolean parameters
CREATE OR REPLACE FUNCTION update_student_marks(
  p_student_id UUID,
  p_subject TEXT,
  p_iat1 INTEGER DEFAULT NULL,
  p_iat2 INTEGER DEFAULT NULL,
  p_model INTEGER DEFAULT NULL,
  p_department_fine INTEGER DEFAULT 0
) 
RETURNS VOID AS $$
BEGIN
  -- Update existing record
  UPDATE marks
  SET 
    iat1 = COALESCE(p_iat1, iat1),
    iat2 = COALESCE(p_iat2, iat2),
    model = COALESCE(p_model, model),
    department_fine = COALESCE(p_department_fine, department_fine),
    updated_at = NOW()
  WHERE student_id = p_student_id AND subject = p_subject;
  
  -- If no rows were updated, insert a new record
  IF NOT FOUND THEN
    INSERT INTO marks (
      student_id, 
      subject, 
      iat1, 
      iat2, 
      model, 
      department_fine
    )
    VALUES (
      p_student_id, 
      p_subject, 
      p_iat1, 
      p_iat2, 
      p_model, 
      p_department_fine
    )
    ON CONFLICT (student_id, subject) 
    DO UPDATE SET 
      iat1 = EXCLUDED.iat1,
      iat2 = EXCLUDED.iat2,
      model = EXCLUDED.model,
      department_fine = EXCLUDED.department_fine,
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- First create the helper function if it doesn't exist
CREATE OR REPLACE FUNCTION safe_drop_column(table_name text, column_name text) RETURNS void AS $$
DECLARE
  constraint_rec RECORD;
  index_rec RECORD;
  column_exists boolean;
BEGIN
  -- Check if column exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = $1 
    AND column_name = $2
  ) INTO column_exists;
  
  IF column_exists THEN
    -- Drop any constraints first
    FOR constraint_rec IN 
      SELECT conname, contype
      FROM pg_constraint
      WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = $1)
      AND conname IN (
        SELECT conname 
        FROM pg_constraint
        WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = $1)
        AND pg_get_constraintdef(oid) LIKE '%' || $2 || '%'
      )
    LOOP
      EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I CASCADE', $1, constraint_rec.conname);
      RAISE NOTICE 'Dropped constraint % on table %', constraint_rec.conname, $1;
    END LOOP;
    
    -- Drop any indexes on the column
    FOR index_rec IN 
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = $1
      AND indexdef LIKE '%' || $2 || '%'
    LOOP
      EXECUTE format('DROP INDEX IF EXISTS %I', index_rec.indexname);
      RAISE NOTICE 'Dropped index % on table %', index_rec.indexname, $1;
    END LOOP;
    
    -- Now drop the column
    EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS %I CASCADE', $1, $2);
    RAISE NOTICE 'Dropped column % from table %', $2, $1;
  ELSE
    RAISE NOTICE 'Column % does not exist in table %', $2, $1;
  END IF;
  
  RETURN;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error dropping column % from %: %', $2, $1, SQLERRM;
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Drop the old columns if they exist
DO $$
BEGIN
  -- Drop the columns using the helper function
  PERFORM safe_drop_column('marks', 'assignment_submitted');
  PERFORM safe_drop_column('marks', 'signed');
  
  -- Clean up the helper function
  DROP FUNCTION IF EXISTS safe_drop_column(text, text);
  
  RAISE NOTICE 'Successfully processed column removal';
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error in main block: %', SQLERRM;
END $$;

  -- Recreate the update trigger function
  EXECUTE '
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql';

  -- Recreate the trigger
  EXECUTE '
    CREATE TRIGGER update_marks_updated_at
    BEFORE UPDATE ON marks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column()';
  
  RAISE NOTICE 'Recreated update_marks_updated_at trigger';
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error updating database schema: %', SQLERRM;
END $$;
