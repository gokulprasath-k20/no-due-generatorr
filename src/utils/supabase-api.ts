import { supabase } from "@/integrations/supabase/client";
import { Student, Mark, SUBJECTS_BY_YEAR } from "@/types";

export const api = {
  // Student functions
  async registerStudent(name: string, registerNumber: string, year: number, department: string): Promise<Student> {
    // Check if student already exists
    const { data: existingStudent } = await supabase
      .from('students')
      .select('*')
      .eq('register_number', registerNumber)
      .maybeSingle();

    if (existingStudent) {
      throw new Error('Student with this register number already exists');
    }

    const { data, error } = await supabase
      .from('students')
      .insert([{ 
        name, 
        register_number: registerNumber, 
        year,
        department
      }])
      .select()
      .single();

    if (error) throw error;

    // Create empty marks for all subjects of the year
    const subjects = SUBJECTS_BY_YEAR[year as keyof typeof SUBJECTS_BY_YEAR];
    const marksToInsert = subjects.map(subject => ({
      student_id: data.id,
      subject,
      iat1: null,
      iat2: null,
      model: null
    }));

    const { error: marksError } = await supabase
      .from('marks')
      .insert(marksToInsert);

    if (marksError) throw marksError;

    return data;
  },

  async getStudentByRegNo(registerNumber: string): Promise<{ student: Student | null, marks: Mark[] }> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('register_number', registerNumber)
        .maybeSingle<Student & { department?: string }>();
      
      if (error) {
        console.error('Supabase error in getStudentByRegNo:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      // If no student found, return null
      if (!data) {
        return { student: null, marks: [] };
      }

      // Create a properly typed student object with department
      const student: Student = {
        id: data.id,
        name: data.name,
        register_number: data.register_number,
        department: data.department || 'Not Specified',
        year: data.year,
        created_at: data.created_at
      };

      // Get the student's marks
      const { data: marks, error: marksError } = await supabase
        .from('marks')
        .select('*')
        .eq('student_id', student.id);

      if (marksError) {
        console.error('Supabase error getting marks:', marksError);
        throw new Error(`Database error: ${marksError.message}`);
      }

      // Ensure all marks have required properties with default values
      const processedMarks = (marks || []).map(mark => ({
        ...mark,
        signed: (mark as any).signed ?? false,
        assignmentSubmitted: (mark as any).assignmentSubmitted ?? false,
        departmentFine: (mark as any).departmentFine ?? 0
      }));

      return { student, marks: processedMarks };
    } catch (error) {
      console.error('Error in getStudentByRegNo:', error);
      throw error;
    }
  },

  // Admin functions
  async createStudent(name: string, registerNumber: string, year: number, department: string): Promise<Student> {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([{ 
          name, 
          register_number: registerNumber, 
          year,
          department
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating student:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Create empty marks for all subjects of the year
      const subjects = SUBJECTS_BY_YEAR[year as keyof typeof SUBJECTS_BY_YEAR];
      const marksToInsert = subjects.map(subject => ({
        student_id: data.id,
        subject,
        iat1: null,
        iat2: null,
        model: null
      }));

      const { error: marksError } = await supabase
        .from('marks')
        .insert(marksToInsert);

      if (marksError) {
        console.error('Supabase error creating marks:', marksError);
        throw new Error(`Database error: ${marksError.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in createStudent:', error);
      throw error;
    }
  },

  async updateMarks(studentId: string, marks: Array<{ subject: string; iat1?: number; iat2?: number; model?: number; signed?: boolean }>): Promise<void> {
    try {
      for (const mark of marks) {
        const { error } = await supabase
          .from('marks')
          .upsert({
            student_id: studentId,
            subject: mark.subject,
            iat1: mark.iat1 ?? null,
            iat2: mark.iat2 ?? null,
            model: mark.model ?? null,
            signed: mark.signed ?? false
          }, {
            onConflict: 'student_id,subject'
          });

        if (error) {
          console.error('Supabase error updating marks:', error);
          throw new Error(`Database error: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Error in updateMarks:', error);
      throw error;
    }
  },

  // Admin auth
  validateAdmin(username: string, password: string): boolean {
    return username === 'avsecit' && password === 'avsecit001';
  }
};