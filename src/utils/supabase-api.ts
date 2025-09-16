import { supabase } from "@/integrations/supabase/client";
import { Student, Mark, SUBJECTS_BY_YEAR } from "@/types";

export const api = {
  // Student functions
  async getStudentByRegNo(registerNumber: string): Promise<{ student: Student | null, marks: Mark[] }> {
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('register_number', registerNumber)
      .maybeSingle();

    if (error) throw error;

    if (!student) {
      return { student: null, marks: [] };
    }

    const { data: marks, error: marksError } = await supabase
      .from('marks')
      .select('*')
      .eq('student_id', student.id);

    if (marksError) throw marksError;

    return { student, marks: marks || [] };
  },

  // Admin functions
  async createStudent(name: string, registerNumber: string, year: number): Promise<Student> {
    const { data, error } = await supabase
      .from('students')
      .insert([{ name, register_number: registerNumber, year }])
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

  async updateMarks(studentId: string, marks: Array<{ subject: string; iat1?: number; iat2?: number; model?: number; }>): Promise<void> {
    for (const mark of marks) {
      const { error } = await supabase
        .from('marks')
        .upsert({
          student_id: studentId,
          subject: mark.subject,
          iat1: mark.iat1 ?? null,
          iat2: mark.iat2 ?? null,
          model: mark.model ?? null
        });

      if (error) throw error;
    }
  },

  // Admin auth
  validateAdmin(username: string, password: string): boolean {
    return username === 'avsecit' && password === 'avsecit001';
  }
};