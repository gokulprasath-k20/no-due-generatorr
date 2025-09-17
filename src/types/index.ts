export interface Student {
  id: string;
  name: string;
  register_number: string;
  department?: string; // Made optional to handle existing records
  year: number;
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

export const SUBJECTS_BY_YEAR = {
  2: ['DM', 'DPCO', 'DSA', 'FDS', 'Oops', 'Office', 'Library'],
  3: ['Computer Network', 'Distributing Computing', 'Es&IoT', 'Full Stack WebDevelopment', 'Software Testing & Automation', 'Cloud Computing', 'Office', 'Library']
};