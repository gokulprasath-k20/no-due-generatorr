import { supabase } from '@/integrations/supabase/client';
import { Student, Mark, SUBJECTS_BY_YEAR, getSubjectsForYearSem } from '@/types';

export const api = {
  // Student functions
  async registerStudent(name: string, registerNumber: string, year: number, department: string, semester?: number): Promise<Student> {
    console.log('API: Registration attempt #', Date.now(), 'for:', { name, registerNumber, year, department, semester });
    
    // Validate input parameters
    if (!name || !name.trim()) {
      throw new Error('Student name is required');
    }
    if (!registerNumber || !registerNumber.trim()) {
      throw new Error('Register number is required');
    }
    if (!department || !department.trim()) {
      throw new Error('Department is required');
    }
    if (!year || year < 1 || year > 4) {
      throw new Error('Invalid year. Year must be between 1 and 4');
    }
    if (semester && (semester < 1 || semester > 8)) {
      throw new Error('Invalid semester. Semester must be between 1 and 8');
    }

    try {
      // Check if student already exists
      const { data: existingStudent, error: checkError } = await supabase
        .from('students')
        .select('*')
        .eq('register_number', registerNumber)
        .maybeSingle();

      if (checkError) {
        console.error('API: Error checking existing student:', checkError);
        throw new Error(`Database error while checking existing student: ${checkError.message}`);
      }

      if (existingStudent) {
        throw new Error('Student with this register number already exists');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        throw error;
      }
      console.error('API: Error during student existence check:', error);
      throw new Error('Failed to verify student registration. Please try again.');
    }

    // Try with semester field first
    let { data, error } = await supabase
      .from('students')
      .insert([{ 
        name: name.trim(), 
        register_number: registerNumber.trim(), 
        year,
        department: department.trim(),
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
          name: name.trim(), 
          register_number: registerNumber.trim(), 
          year,
          department: department.trim()
        }])
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('API: Registration failed with error:', error);
      console.error('API: Error details:', { message: error.message, code: error.code, details: error.details, hint: error.hint });
      
      // Provide more user-friendly error messages
      if (error.code === '23505') {
        throw new Error('A student with this register number already exists');
      } else if (error.code === '23502') {
        throw new Error('Missing required information. Please fill all fields');
      } else if (error.code === '23514') {
        throw new Error('Invalid data provided. Please check your input');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network connection error. Please check your internet and try again');
      } else {
        throw new Error(`Registration failed: ${error.message}`);
      }
    }

    // Create empty marks for all subjects based on year and semester
    const subjects = getSubjectsForYearSem(year, semester);
    console.log('API: Creating marks for subjects:', subjects, 'year:', year, 'semester:', semester);
    
    if (subjects.length === 0) {
      console.warn('API: No subjects found for year:', year, 'semester:', semester);
      console.warn('API: Student created successfully but no marks will be created');
      return data; // Return successfully even if no subjects
    }

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

    console.log('API: Inserting marks:', marksToInsert);

    const { error: marksError } = await supabase
      .from('marks')
      .insert(marksToInsert);

    if (marksError) {
      console.error('API: Error creating marks:', marksError);
      console.error('API: Marks error details:', { message: marksError.message, code: marksError.code, details: marksError.details, hint: marksError.hint });
      // Don't throw error for marks creation failure in registration - student is already created
      console.warn('API: Student registration completed successfully despite marks creation failure');
    } else {
      console.log('API: Marks created successfully for student:', data.id);
    }

    return data;
  },

  async getAllStudents(): Promise<Student[]> {
    try {
      console.log('API: Starting getAllStudents function...');
      console.log('API: Supabase client status:', !!supabase);
      
      console.log('API: Attempting to fetch students from database...');
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('API: Supabase query completed');
      console.log('API: Query error:', error);
      console.log('API: Query data:', data);
      
      if (error) {
        console.error('API: Supabase error in getAllStudents:', error);
        console.error('API: Error code:', error.code);
        console.error('API: Error details:', error.details);
        console.error('API: Error hint:', error.hint);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('API: Raw data from database:', data);
      console.log('API: Data type:', typeof data);
      console.log('API: Is data an array?', Array.isArray(data));
      console.log('API: Number of students found:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('API: First student sample:', data[0]);
        console.log('API: Semester data types analysis:');
        data.forEach((student, index) => {
          const studentAny = student as any; // Cast to any to access potentially missing properties
          console.log(`API: Student ${index + 1} - ${student.name}:`, {
            semester: studentAny.semester,
            semesterType: typeof studentAny.semester,
            semesterValue: JSON.stringify(studentAny.semester),
            allProperties: Object.keys(student)
          });
        });
      }
      
      const result = data || [];
      console.log('API: Returning result:', result);
      return result;
    } catch (error) {
      console.error('API: Caught error in getAllStudents:', error);
      console.error('API: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
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
        assignmentSubmitted: (mark as any).assignmentsubmitted ?? (mark as any).assignmentSubmitted ?? false,
        departmentFine: (mark as any).departmentfine ?? (mark as any).departmentFine ?? (mark as any).department_fine ?? 0
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
        assignmentsubmitted: false,
        departmentfine: 0
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
        // Prepare the data with proper column names
        const markData: any = {
          student_id: studentId,
          subject: mark.subject,
          iat1: mark.iat1 ?? null,
          iat2: mark.iat2 ?? null,
          model: mark.model ?? null,
          signed: mark.signed ?? false,
          assignmentsubmitted: mark.assignmentSubmitted ?? false,
          departmentfine: mark.departmentFine ?? 0
        };

        console.log(`[DEBUG] Updating marks for ${mark.subject}:`, markData);

        // Try with all fields first
        let { error } = await supabase
          .from('marks')
          .upsert(markData, {
            onConflict: 'student_id,subject'
          });

        // If there's a column error, try progressive fallback
        if (error && (error.message.includes('column') || error.message.includes('does not exist'))) {
          console.warn('Column error, trying fallback approach:', error.message);
          
          // Try with assignmentsubmitted but different column name for departmentfine
          let fallbackData = {
            student_id: studentId,
            subject: mark.subject,
            iat1: mark.iat1 ?? null,
            iat2: mark.iat2 ?? null,
            model: mark.model ?? null,
            signed: mark.signed ?? false,
            assignmentsubmitted: mark.assignmentSubmitted ?? false,
            department_fine: mark.departmentFine ?? 0
          };
          
          let fallbackResult = await supabase
            .from('marks')
            .upsert(fallbackData, {
              onConflict: 'student_id,subject'
            });
          
          // If still failing, try without assignmentsubmitted
          if (fallbackResult.error && fallbackResult.error.message.includes('assignmentsubmitted')) {
            console.warn('assignmentsubmitted column not available, trying without it');
            const basicFallbackData: any = {
              student_id: studentId,
              subject: mark.subject,
              iat1: mark.iat1 ?? null,
              iat2: mark.iat2 ?? null,
              model: mark.model ?? null,
              signed: mark.signed ?? false,
              department_fine: mark.departmentFine ?? 0
            };
            
            fallbackResult = await supabase
              .from('marks')
              .upsert(basicFallbackData, {
                onConflict: 'student_id,subject'
              });
          }
          
          error = fallbackResult.error;
        }

        if (error) {
          console.error('Error updating marks:', error);
          throw new Error(`Failed to update marks for ${mark.subject}: ${error.message}`);
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