// Database migration utility to add missing columns
import { supabase } from '@/integrations/supabase/client';

export const checkDatabaseSchema = async () => {
  try {
    // Test if new columns exist by trying to select them
    const { data, error } = await supabase
      .from('students')
      .select('semester')
      .limit(1);
    
    const { data: marksData, error: marksError } = await supabase
      .from('marks')
      .select('assignmentSubmitted, departmentFine')
      .limit(1);

    return {
      studentsHasSemester: !error,
      marksHasNewFields: !marksError,
      studentsError: error?.message,
      marksError: marksError?.message
    };
  } catch (error) {
    console.error('Error checking database schema:', error);
    return {
      studentsHasSemester: false,
      marksHasNewFields: false,
      studentsError: 'Unknown error',
      marksError: 'Unknown error'
    };
  }
};

// SQL commands to add missing columns (for manual execution in Supabase dashboard)
export const getMigrationSQL = () => {
  return `
-- Add semester column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS semester INTEGER;

-- Add new columns to marks table
ALTER TABLE marks ADD COLUMN IF NOT EXISTS assignmentSubmitted BOOLEAN DEFAULT FALSE;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS departmentFine INTEGER DEFAULT 0;

-- Update existing records to have default values
UPDATE marks SET assignmentSubmitted = FALSE WHERE assignmentSubmitted IS NULL;
UPDATE marks SET departmentFine = 0 WHERE departmentFine IS NULL;
  `.trim();
};
