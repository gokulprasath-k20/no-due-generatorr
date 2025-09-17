export interface Student {
  id: string;
  name: string;
  register_number: string;
  department?: string; // Made optional to handle existing records
  year: number;
  semester?: number; // Add semester field
  created_at: string;
}

export interface Mark {
  id: string;
  student_id: string;
  subject: string;
  iat1: number | null;
  iat2: number | null;
  model: number | null;
  signed: boolean;
  assignmentSubmitted: boolean;
  departmentFine: number;
  created_at: string;
}

export const SUBJECTS_BY_YEAR_SEM = {
  '2-3': ['DM', 'DPCO', 'DSA', 'FDS', 'Oops', 'Office', 'Library'], // 2nd year 3rd sem
  '2-4': ['TOC', 'AI&ML', 'DBMS', 'WE', 'INTRODUCTION OF OS', 'ESS', 'Office', 'Library'], // 2nd year 4th sem
  '3-5': ['Computer Network', 'Distributing Computing', 'Es&IoT', 'Full Stack WebDevelopment', 'Software Testing & Automation', 'Cloud Computing', 'Office', 'Library'] // 3rd year 5th sem
};

// Keep backward compatibility for existing code
export const SUBJECTS_BY_YEAR = {
  2: SUBJECTS_BY_YEAR_SEM['2-3'], // Default to 3rd sem for 2nd year
  3: SUBJECTS_BY_YEAR_SEM['3-5']  // Default to 5th sem for 3rd year
};

// Helper function to get subjects based on year and semester
export const getSubjectsForYearSem = (year: number, semester?: number): string[] => {
  if (year === 2) {
    if (semester === 4) return SUBJECTS_BY_YEAR_SEM['2-4'];
    return SUBJECTS_BY_YEAR_SEM['2-3']; // Default to 3rd sem
  }
  if (year === 3) {
    return SUBJECTS_BY_YEAR_SEM['3-5']; // Default to 5th sem
  }
  return [];
};