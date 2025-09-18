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
  '3-5': ['Computer Network', 'Distributing Computing', 'Es&IoT', 'Full Stack WebDevelopment', 'Software Testing & Automation', 'Cloud Computing', 'Office', 'Library'], // 3rd year 5th sem
  '3-6': ['Compiler Design', 'Mobile Application Development', 'Cyber Security', 'Data Science', 'Project Management', 'Office', 'Library'], // 3rd year 6th sem
  '4-7': ['Machine Learning', 'Big Data Analytics', 'Blockchain Technology', 'Advanced Algorithms', 'Research Methodology', 'Office', 'Library'], // 4th year 7th sem
  '4-8': ['Project Work', 'Industrial Training', 'Seminar', 'Comprehensive Viva', 'Office', 'Library'] // 4th year 8th sem
};

// Keep backward compatibility for existing code
export const SUBJECTS_BY_YEAR = {
  2: SUBJECTS_BY_YEAR_SEM['2-3'], // Default to 3rd sem for 2nd year
  3: SUBJECTS_BY_YEAR_SEM['3-5'], // Default to 5th sem for 3rd year
  4: SUBJECTS_BY_YEAR_SEM['4-7']  // Default to 7th sem for 4th year
};

// Helper function to get subjects based on year and semester
export const getSubjectsForYearSem = (year: number, semester?: number): string[] => {
  if (!semester) {
    // Fallback to year-based subjects if no semester specified
    return SUBJECTS_BY_YEAR[year as keyof typeof SUBJECTS_BY_YEAR] || [];
  }
  
  const key = `${year}-${semester}` as keyof typeof SUBJECTS_BY_YEAR_SEM;
  return SUBJECTS_BY_YEAR_SEM[key] || [];
};

// Helper function to get year from semester
export const getYearFromSemester = (semester: number): number => {
  if (semester >= 1 && semester <= 2) return 1;
  if (semester >= 3 && semester <= 4) return 2;
  if (semester >= 5 && semester <= 6) return 3;
  if (semester >= 7 && semester <= 8) return 4;
  return 1; // Default fallback
};