import { supabase } from '@/integrations/supabase/client';
import { Student, Mark, SUBJECTS_BY_YEAR, getSubjectsForYearSem } from '@/types';

export const api = {
  // Student functions
  async registerStudent(name: string, registerNumber: string, year: number, department: string, semester?: number): Promise<Student> {
    // Check if student already exists
    const { data: existingStudent } = await supabase
      .from('students')
      .select('*')
      .eq('register_number', registerNumber)
      .maybeSingle();

    if (existingStudent) {
      throw new Error('Student with this register number already exists');
    }

    // Try with semester field first
    let { data, error } = await supabase
      .from('students')
      .insert([{ 
        name, 
        register_number: registerNumber, 
        year,
        department,
        semester
      }])
      .select()
      .single();

    // If semester column doesn't exist, try without it
    if (error && (error.message.includes('column') || error.message.includes('does not exist'))) {
      console.warn('Semester column not available, creating student without semester:', error.message);
      const result = await supabase
        .from('students')
        .insert([{ 
          name, 
          register_number: registerNumber, 
          year,
          department
        }])
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) throw error;

    // Create empty marks for all subjects based on year and semester
    const subjects = getSubjectsForYearSem(year, semester);
    const marksToInsert = subjects.map(subject => ({
      student_id: data.id,
      subject,
      iat1: null,
      iat2: null,
      model: null,
      signed: false,
      assignmentSubmitted: false,
      departmentFine: 0
    }));

    const { error: marksError } = await supabase
      .from('marks')
      .insert(marksToInsert);

    if (marksError) {
      console.error('Error creating marks:', marksError);
      // Don't throw error for marks creation failure in registration
    }

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

      // Create a properly typed student object with department and semester
      const student: Student = {
        id: data.id,
        name: data.name,
        register_number: data.register_number,
        department: data.department || 'Not Specified',
        year: data.year,
        semester: data.semester,
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

  // Student update function
  async updateStudent(id: string, updates: { name?: string; department?: string; year?: number; semester?: number }): Promise<void> {
    try {
      const { error } = await supabase
        .from('students')
        .update({
          name: updates.name,
          department: updates.department,
          year: updates.year,
          semester: updates.semester,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        // If semester column doesn't exist, try without it
        if (error.message.includes('column') && error.message.includes('semester')) {
          console.warn('Semester column not available, updating student without semester:', error.message);
          const { error: basicError } = await supabase
            .from('students')
            .update({
              name: updates.name,
              department: updates.department,
              year: updates.year,
              updated_at: new Date().toISOString()
            })
            .eq('id', id);
          
          if (basicError) throw basicError;
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  },

  // Admin functions
  async createStudent(name: string, registerNumber: string, year: number, department: string, semester?: number): Promise<Student> {
    try {
      // First try with semester field
      let { data, error } = await supabase
        .from('students')
        .insert([{ 
          name, 
          register_number: registerNumber, 
          year,
          department,
          semester
        }])
        .select()
        .single();

      // If semester column doesn't exist, try without it
      if (error && (error.message.includes('column') || error.message.includes('does not exist'))) {
        console.warn('Semester column not available, creating student without semester:', error.message);
        const result = await supabase
          .from('students')
          .insert([{ 
            name, 
            register_number: registerNumber, 
            year,
            department
          }])
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Supabase error creating student:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Create empty marks for all subjects of the year and semester
      const subjects = getSubjectsForYearSem(year, semester);
      const marksToInsert = subjects.map(subject => ({
        student_id: data.id,
        subject,
        iat1: null,
        iat2: null,
        model: null,
        signed: false,
        assignmentSubmitted: false,
        departmentFine: 0
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

  async updateMarks(studentId: string, marks: Array<{ subject: string; iat1?: number; iat2?: number; model?: number; signed?: boolean; assignmentSubmitted?: boolean; departmentFine?: number }>): Promise<void> {
    try {
      for (const mark of marks) {
        // First, try with all fields
        let { error } = await supabase
          .from('marks')
          .upsert({
            student_id: studentId,
            subject: mark.subject,
            iat1: mark.iat1 ?? null,
            iat2: mark.iat2 ?? null,
            model: mark.model ?? null,
            signed: mark.signed ?? false,
            assignmentSubmitted: mark.assignmentSubmitted ?? false,
            departmentFine: mark.departmentFine ?? 0
          }, {
            onConflict: 'student_id,subject'
          });

        // If error due to missing columns, try with basic fields only
        if (error && (error.message.includes('column') || error.message.includes('does not exist'))) {
          console.warn('New columns not available, trying with available fields:', error.message);
          
          // Try with assignmentSubmitted included (it might exist even if other columns don't)
          let { error: basicError } = await supabase
            .from('marks')
            .upsert({
              student_id: studentId,
              subject: mark.subject,
              iat1: mark.iat1 ?? null,
              iat2: mark.iat2 ?? null,
              model: mark.model ?? null,
              signed: mark.signed ?? false,
              assignmentSubmitted: mark.assignmentSubmitted ?? false
            }, {
              onConflict: 'student_id,subject'
            });
          
          // If still error, try with minimal fields only
          if (basicError && (basicError.message.includes('column') || basicError.message.includes('does not exist'))) {
            console.warn('assignmentSubmitted column not available, using minimal fields:', basicError.message);
            const { error: minimalError } = await supabase
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
            
            if (minimalError) {
              console.error('Supabase error updating marks (minimal):', minimalError);
              throw new Error(`Database error: ${minimalError.message}`);
            }
          } else if (basicError) {
            console.error('Supabase error updating marks (basic):', basicError);
            throw new Error(`Database error: ${basicError.message}`);
          }
        } else if (error) {
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