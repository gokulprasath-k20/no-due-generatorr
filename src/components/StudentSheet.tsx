import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { api } from '@/utils/supabase-api';
import { Student, Mark, getSubjectsForYearSem } from '@/types';
import { Loader2, Save, Download, RefreshCw, Filter } from 'lucide-react';
import { shouldShowMarksColumns } from '@/utils/subject-config';

interface StudentSheetProps {
  allStudents: Student[];
  onRefresh: () => void;
  loading: boolean;
}

interface StudentWithMarks extends Student {
  marks: Mark[];
}

export function StudentSheet({ allStudents, onRefresh, loading }: StudentSheetProps) {
  const [selectedSemester, setSelectedSemester] = useState<string>('3');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [studentsWithMarks, setStudentsWithMarks] = useState<StudentWithMarks[]>([]);
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Get filtered students for selected semester
  const getFilteredStudents = (): Student[] => {
    const semesterNumber = parseInt(selectedSemester);
    return allStudents.filter(student => {
      const studentSemester = typeof student.semester === 'string' 
        ? parseInt(student.semester) 
        : student.semester;
      return studentSemester === semesterNumber;
    });
  };

  // Load marks for all students in selected semester
  const loadStudentsWithMarks = async () => {
    const filteredStudents = getFilteredStudents();
    if (filteredStudents.length === 0) {
      setStudentsWithMarks([]);
      setSubjects([]);
      return;
    }

    setLoadingMarks(true);
    try {
      const studentsWithMarksData: StudentWithMarks[] = [];
      
      // Get subjects for this semester
      const semesterSubjects = getSubjectsForYearSem(
        filteredStudents[0].year, 
        parseInt(selectedSemester)
      );
      setSubjects(semesterSubjects);

      // Load marks for each student
      for (const student of filteredStudents) {
        try {
          const { marks } = await api.getStudentByRegNo(student.register_number);
          studentsWithMarksData.push({
            ...student,
            marks: marks || []
          });
        } catch (error) {
          console.error(`Error loading marks for ${student.register_number}:`, error);
          // Add student with empty marks if there's an error
          studentsWithMarksData.push({
            ...student,
            marks: []
          });
        }
      }

      setStudentsWithMarks(studentsWithMarksData);
      
      toast({
        title: "Success",
        description: `Loaded ${studentsWithMarksData.length} students with their marks`,
      });
    } catch (error) {
      console.error('Error loading students with marks:', error);
      toast({
        title: "Error",
        description: "Failed to load student marks",
        variant: "destructive"
      });
    } finally {
      setLoadingMarks(false);
    }
  };

  // Load data when semester changes
  useEffect(() => {
    if (selectedSemester && allStudents.length > 0) {
      loadStudentsWithMarks();
    }
  }, [selectedSemester, allStudents]);

  // Update mark value
  const updateMark = (studentId: string, subject: string, field: 'iat1' | 'iat2' | 'model', value: string) => {
    const numValue = value === '' ? null : parseInt(value);
    setStudentsWithMarks(prev => 
      prev.map(student => {
        if (student.id !== studentId) return student;
        
        const existingMarkIndex = student.marks.findIndex(m => m.subject === subject);
        if (existingMarkIndex >= 0) {
          // Update existing mark
          const updatedMarks = [...student.marks];
          updatedMarks[existingMarkIndex] = {
            ...updatedMarks[existingMarkIndex],
            [field]: numValue
          };
          return { ...student, marks: updatedMarks };
        } else {
          // Create new mark
          const newMark: Mark = {
            id: '',
            student_id: studentId,
            subject,
            iat1: field === 'iat1' ? numValue : null,
            iat2: field === 'iat2' ? numValue : null,
            model: field === 'model' ? numValue : null,
            signed: false,
            assignmentSubmitted: false,
            departmentFine: 0,
            created_at: new Date().toISOString()
          };
          return { ...student, marks: [...student.marks, newMark] };
        }
      })
    );
  };

  // Update assignment submission
  const updateAssignmentSubmission = (studentId: string, subject: string, submitted: boolean) => {
    setStudentsWithMarks(prev => 
      prev.map(student => {
        if (student.id !== studentId) return student;
        
        const existingMarkIndex = student.marks.findIndex(m => m.subject === subject);
        if (existingMarkIndex >= 0) {
          const updatedMarks = [...student.marks];
          updatedMarks[existingMarkIndex] = {
            ...updatedMarks[existingMarkIndex],
            assignmentSubmitted: submitted
          };
          return { ...student, marks: updatedMarks };
        } else {
          const newMark: Mark = {
            id: '',
            student_id: studentId,
            subject,
            iat1: null,
            iat2: null,
            model: null,
            signed: false,
            assignmentSubmitted: submitted,
            departmentFine: 0,
            created_at: new Date().toISOString()
          };
          return { ...student, marks: [...student.marks, newMark] };
        }
      })
    );
  };

  // Update department fees
  const updateDepartmentFees = (studentId: string, subject: string, isPaid: boolean) => {
    setStudentsWithMarks(prev => 
      prev.map(student => {
        if (student.id !== studentId) return student;
        
        const existingMarkIndex = student.marks.findIndex(m => m.subject === subject);
        if (existingMarkIndex >= 0) {
          const updatedMarks = [...student.marks];
          updatedMarks[existingMarkIndex] = {
            ...updatedMarks[existingMarkIndex],
            departmentFine: isPaid ? 0 : 1
          };
          return { ...student, marks: updatedMarks };
        } else {
          const newMark: Mark = {
            id: '',
            student_id: studentId,
            subject,
            iat1: null,
            iat2: null,
            model: null,
            signed: false,
            assignmentSubmitted: false,
            departmentFine: isPaid ? 0 : 1,
            created_at: new Date().toISOString()
          };
          return { ...student, marks: [...student.marks, newMark] };
        }
      })
    );
  };

  // Update signature status
  const updateSignature = (studentId: string, subject: string, signed: boolean) => {
    setStudentsWithMarks(prev => 
      prev.map(student => {
        if (student.id !== studentId) return student;
        
        const existingMarkIndex = student.marks.findIndex(m => m.subject === subject);
        if (existingMarkIndex >= 0) {
          const updatedMarks = [...student.marks];
          updatedMarks[existingMarkIndex] = {
            ...updatedMarks[existingMarkIndex],
            signed: signed
          };
          return { ...student, marks: updatedMarks };
        } else {
          const newMark: Mark = {
            id: '',
            student_id: studentId,
            subject,
            iat1: null,
            iat2: null,
            model: null,
            signed: signed,
            assignmentSubmitted: false,
            departmentFine: 0,
            created_at: new Date().toISOString()
          };
          return { ...student, marks: [...student.marks, newMark] };
        }
      })
    );
  };

  // Get mark value for a student and subject
  const getMarkValue = (studentId: string, subject: string, field: 'iat1' | 'iat2' | 'model'): string => {
    const student = studentsWithMarks.find(s => s.id === studentId);
    const mark = student?.marks.find(m => m.subject === subject);
    const value = mark?.[field];
    return value === null || value === undefined ? '' : value.toString();
  };

  // Get assignment status
  const getAssignmentStatus = (studentId: string, subject: string): string => {
    const student = studentsWithMarks.find(s => s.id === studentId);
    const mark = student?.marks.find(m => m.subject === subject);
    return mark?.assignmentSubmitted ? 'submitted' : 'not-submitted';
  };

  // Get department fees status
  const getDepartmentFeesStatus = (studentId: string, subject: string): boolean => {
    const student = studentsWithMarks.find(s => s.id === studentId);
    const mark = student?.marks.find(m => m.subject === subject);
    return mark?.departmentFine === 0;
  };

  // Get signature status
  const getSignatureStatus = (studentId: string, subject: string): boolean => {
    const student = studentsWithMarks.find(s => s.id === studentId);
    const mark = student?.marks.find(m => m.subject === subject);
    return mark?.signed ?? false;
  };

  // Get due status
  const getDueStatus = (studentId: string, subject: string): 'Completed' | 'Pending' => {
    const student = studentsWithMarks.find(s => s.id === studentId);
    const mark = student?.marks.find(m => m.subject === subject);
    if (!mark) return 'Pending';
    
    // For Office and Library, only check signature
    if (subject === 'Office' || subject === 'Library') {
      return mark.signed ? 'Completed' : 'Pending';
    }
    
    // For academic subjects, check assignment submission and department fees
    return mark.assignmentSubmitted && mark.departmentFine === 0 ? 'Completed' : 'Pending';
  };

  // Get mark value for selected subject only
  const getSubjectMarkValue = (studentId: string, field: 'iat1' | 'iat2' | 'model'): string => {
    const student = studentsWithMarks.find(s => s.id === studentId);
    if (!student) return '';
    
    // If no specific subject selected, return empty
    if (selectedSubject === 'all') return '';
    
    const mark = student.marks.find(m => m.subject === selectedSubject);
    const value = mark?.[field];
    return value !== null && value !== undefined ? value.toString() : '';
  };

  // Update marks for selected subject only
  const updateSubjectMark = (studentId: string, field: 'iat1' | 'iat2' | 'model', value: string) => {
    // Only update if a specific subject is selected
    if (selectedSubject === 'all') {
      toast({
        title: "Select Subject",
        description: "Please select a specific subject to enter marks",
        variant: "destructive"
      });
      return;
    }
    
    updateMark(studentId, selectedSubject, field, value);
  };

  // Get overall assignment status
  const getOverallAssignmentStatus = (studentId: string): string => {
    const student = studentsWithMarks.find(s => s.id === studentId);
    if (!student) return 'not-submitted';
    
    const academicSubjects = subjects.filter(subject => shouldShowMarksColumns(subject));
    const submittedCount = academicSubjects.filter(subject => {
      const mark = student.marks.find(m => m.subject === subject);
      return mark?.assignmentSubmitted;
    }).length;
    
    return submittedCount === academicSubjects.length ? 'submitted' : 'not-submitted';
  };

  // Update assignment submission for selected subject only
  const updateSelectedSubjectAssignmentSubmission = (studentId: string, submitted: boolean) => {
    if (selectedSubject === 'all') {
      toast({
        title: "Select Subject",
        description: "Please select a specific subject to update assignment submission",
        variant: "destructive"
      });
      return;
    }
    
    updateAssignmentSubmission(studentId, selectedSubject, submitted);
  };

  // Get overall department fees status
  const getOverallDepartmentFeesStatus = (studentId: string): boolean => {
    const student = studentsWithMarks.find(s => s.id === studentId);
    if (!student) return false;
    
    const academicSubjects = subjects.filter(subject => shouldShowMarksColumns(subject));
    const paidCount = academicSubjects.filter(subject => {
      const mark = student.marks.find(m => m.subject === subject);
      return mark?.departmentFine === 0;
    }).length;
    
    return paidCount === academicSubjects.length;
  };

  // Update department fees for selected subject only
  const updateSelectedSubjectDepartmentFees = (studentId: string, isPaid: boolean) => {
    if (selectedSubject === 'all') {
      toast({
        title: "Select Subject",
        description: "Please select a specific subject to update department fees",
        variant: "destructive"
      });
      return;
    }
    
    const feeAmount = isPaid ? 0 : 100; // 0 means paid, >0 means unpaid
    updateDepartmentFees(studentId, selectedSubject, feeAmount);
  };

  // Get assignment submission status for selected subject
  const getSelectedSubjectAssignmentStatus = (studentId: string): string => {
    if (selectedSubject === 'all') return 'not-submitted';
    
    const student = studentsWithMarks.find(s => s.id === studentId);
    if (!student) return 'not-submitted';
    
    const mark = student.marks.find(m => m.subject === selectedSubject);
    return mark?.assignmentSubmitted ? 'submitted' : 'not-submitted';
  };

  // Get department fees status for selected subject
  const getSelectedSubjectDepartmentFeesStatus = (studentId: string): boolean => {
    if (selectedSubject === 'all') return false;
    
    const student = studentsWithMarks.find(s => s.id === studentId);
    if (!student) return false;
    
    const mark = student.marks.find(m => m.subject === selectedSubject);
    return (mark?.departmentFine ?? 100) === 0; // 0 means paid
  };

  // Get overall status for selected subject (Completed if both assignment submitted and fees paid)
  const getSelectedSubjectOverallStatus = (studentId: string): 'Completed' | 'Pending' => {
    if (selectedSubject === 'all') return 'Pending';
    
    const student = studentsWithMarks.find(s => s.id === studentId);
    if (!student) return 'Pending';
    
    const mark = student.marks.find(m => m.subject === selectedSubject);
    if (!mark) return 'Pending';
    
    // For Office and Library, only check signature
    if (selectedSubject === 'Office' || selectedSubject === 'Library') {
      return mark.signed ? 'Completed' : 'Pending';
    }
    
    // For academic subjects, check both assignment submission and department fees
    const assignmentSubmitted = mark.assignmentSubmitted;
    const feesPaid = (mark.departmentFine ?? 100) === 0;
    
    return assignmentSubmitted && feesPaid ? 'Completed' : 'Pending';
  };

  // Get overall status
  const getOverallStatus = (studentId: string): 'Completed' | 'Pending' => {
    const student = studentsWithMarks.find(s => s.id === studentId);
    if (!student) return 'Pending';
    
    // Check all subjects (both academic and non-academic)
    const allCompleted = subjects.every(subject => {
      const mark = student.marks.find(m => m.subject === subject);
      if (!mark) return false;
      
      // For Office and Library, only check signature
      if (subject === 'Office' || subject === 'Library') {
        return mark.signed;
      }
      
      // For academic subjects, check assignment submission and department fees
      return mark.assignmentSubmitted && mark.departmentFine === 0;
    });
    
    return allCompleted ? 'Completed' : 'Pending';
  };

  // Save changes for selected subject only
  const saveAllChanges = async () => {
    if (selectedSubject === 'all') {
      toast({
        title: "Select Subject",
        description: "Please select a specific subject to save marks",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const student of studentsWithMarks) {
        try {
          console.log(`[DEBUG] Saving marks for student: ${student.name} (${student.id}) - Subject: ${selectedSubject}`);
          
          // Find existing mark for selected subject or create a new one
          let existingMark = student.marks.find(m => m.subject === selectedSubject);
          
          if (!existingMark) {
            // Create a default mark entry for this subject
            existingMark = {
              id: '',
              student_id: student.id,
              subject: selectedSubject,
              iat1: null,
              iat2: null,
              model: null,
              signed: false,
              assignmentSubmitted: false,
              departmentFine: 0,
              created_at: new Date().toISOString()
            };
          }
          
          // Only save marks for the selected subject
          const marksToSave = [{
            subject: existingMark.subject,
            iat1: existingMark.iat1,
            iat2: existingMark.iat2,
            model: existingMark.model,
            signed: existingMark.signed,
            departmentFine: existingMark.departmentFine ?? 0,
            assignmentSubmitted: existingMark.assignmentSubmitted ?? false
          }];

          console.log(`[DEBUG] Marks to save for ${student.name}:`, marksToSave);
          await api.updateMarks(student.id, marksToSave);
          console.log(`[DEBUG] Successfully saved marks for ${student.name}`);
          successCount++;
        } catch (error) {
          console.error(`[ERROR] Failed to save marks for ${student.name}:`, error);
          console.error(`[ERROR] Student ID: ${student.id}`);
          console.error(`[ERROR] Error details:`, error instanceof Error ? error.message : error);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        toast({
          title: "Success",
          description: `Successfully saved ${selectedSubject} marks for all ${successCount} students`,
        });
      } else {
        toast({
          title: "Partial Success",
          description: `Saved ${successCount} students, ${errorCount} failed. Check console for details.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('[ERROR] Error saving all changes:', error);
      toast({
        title: "Error",
        description: "Failed to save changes. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Helper function to get ordinal suffix
  const getOrdinalSuffix = (num: string | number): string => {
    const numStr = num.toString();
    if (numStr === '1') return '1st';
    if (numStr === '2') return '2nd';
    if (numStr === '3') return '3rd';
    return `${numStr}th`;
  };

  // Handle keyboard navigation (Enter, Arrow keys)
  const handleKeyDown = (e: React.KeyboardEvent, currentKey: string) => {
    const allKeys = Object.keys(inputRefs.current).sort();
    const currentIndex = allKeys.indexOf(currentKey);
    
    let targetIndex = -1;
    
    switch (e.key) {
      case 'Enter':
      case 'ArrowDown':
        e.preventDefault();
        // Move to next input (down)
        targetIndex = currentIndex < allKeys.length - 1 ? currentIndex + 1 : 0;
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        // Move to previous input (up)
        targetIndex = currentIndex > 0 ? currentIndex - 1 : allKeys.length - 1;
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        // Move to next field in same row
        const currentStudentId = currentKey.split('-')[0];
        const currentField = currentKey.split('-')[1];
        const fields = ['iat1', 'iat2', 'model'];
        const fieldIndex = fields.indexOf(currentField);
        if (fieldIndex < fields.length - 1) {
          const nextField = fields[fieldIndex + 1];
          const nextKey = `${currentStudentId}-${nextField}`;
          if (inputRefs.current[nextKey]) {
            targetIndex = allKeys.indexOf(nextKey);
          }
        }
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        // Move to previous field in same row
        const currentStudentIdLeft = currentKey.split('-')[0];
        const currentFieldLeft = currentKey.split('-')[1];
        const fieldsLeft = ['iat1', 'iat2', 'model'];
        const fieldIndexLeft = fieldsLeft.indexOf(currentFieldLeft);
        if (fieldIndexLeft > 0) {
          const prevField = fieldsLeft[fieldIndexLeft - 1];
          const prevKey = `${currentStudentIdLeft}-${prevField}`;
          if (inputRefs.current[prevKey]) {
            targetIndex = allKeys.indexOf(prevKey);
          }
        }
        break;
    }
    
    if (targetIndex >= 0 && targetIndex < allKeys.length) {
      const targetKey = allKeys[targetIndex];
      const targetInput = inputRefs.current[targetKey];
      if (targetInput) {
        targetInput.focus();
        targetInput.select();
      }
    }
  };

  // Generate input key for ref management
  const getInputKey = (studentId: string, field: string): string => {
    return `${studentId}-${field}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            📊 Student Sheet View
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Semester:</Label>
              <Select
                value={selectedSemester}
                onValueChange={setSelectedSemester}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3rd Semester</SelectItem>
                  <SelectItem value="4">4th Semester</SelectItem>
                  <SelectItem value="5">5th Semester</SelectItem>
                  <SelectItem value="6">6th Semester</SelectItem>
                  <SelectItem value="7">7th Semester</SelectItem>
                  <SelectItem value="8">8th Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Subject:</Label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefresh}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadStudentsWithMarks}
                disabled={loadingMarks}
              >
                {loadingMarks ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Reload Sheet'
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loadingMarks ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading student data...</span>
          </div>
        ) : studentsWithMarks.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              No students found for {getOrdinalSuffix(selectedSemester)} semester
            </div>
            <div className="text-sm text-gray-400">
              Total students in database: {allStudents.length}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                {getOrdinalSuffix(selectedSemester)} Semester - {studentsWithMarks.length} Students
              </h3>
              <div className="text-sm text-blue-600">
                Subjects: {subjects.join(', ')}
              </div>
            </div>

            {/* Simple Excel-like Table */}
            <div className="overflow-x-auto border border-gray-300 rounded-lg">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">Name</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">Reg.No</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-sm">IAT1</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-sm">IAT2</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-sm">MODEL</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-sm">ASSIGNMENT SUBMISSION</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-sm">DEPARTMENTAL FEES</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-sm">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsWithMarks.map((student, index) => (
                    <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {/* Name */}
                      <td className="border border-gray-300 px-4 py-3 text-sm font-medium">
                        {student.name}
                      </td>
                      
                      {/* Register Number */}
                      <td className="border border-gray-300 px-4 py-3 text-sm font-mono">
                        {student.register_number}
                      </td>
                      
                      {/* IAT1 - For selected subject only */}
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <Input
                          ref={(el) => {
                            const key = getInputKey(student.id, 'iat1');
                            inputRefs.current[key] = el;
                          }}
                          type="number"
                          min="0"
                          max="100"
                          value={getSubjectMarkValue(student.id, 'iat1')}
                          onChange={(e) => updateSubjectMark(student.id, 'iat1', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, getInputKey(student.id, 'iat1'))}
                          className="w-16 h-8 text-center text-sm"
                          placeholder="0"
                          disabled={selectedSubject === 'all'}
                        />
                      </td>
                      
                      {/* IAT2 - For selected subject only */}
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <Input
                          ref={(el) => {
                            const key = getInputKey(student.id, 'iat2');
                            inputRefs.current[key] = el;
                          }}
                          type="number"
                          min="0"
                          max="100"
                          value={getSubjectMarkValue(student.id, 'iat2')}
                          onChange={(e) => updateSubjectMark(student.id, 'iat2', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, getInputKey(student.id, 'iat2'))}
                          className="w-16 h-8 text-center text-sm"
                          placeholder="0"
                          disabled={selectedSubject === 'all'}
                        />
                      </td>
                      
                      {/* MODEL - For selected subject only */}
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <Input
                          ref={(el) => {
                            const key = getInputKey(student.id, 'model');
                            inputRefs.current[key] = el;
                          }}
                          type="number"
                          min="0"
                          max="100"
                          value={getSubjectMarkValue(student.id, 'model')}
                          onChange={(e) => updateSubjectMark(student.id, 'model', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, getInputKey(student.id, 'model'))}
                          className="w-16 h-8 text-center text-sm"
                          placeholder="0"
                          disabled={selectedSubject === 'all'}
                        />
                      </td>
                      
                      {/* Assignment Submission - For Selected Subject */}
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <Select
                          value={getSelectedSubjectAssignmentStatus(student.id)}
                          onValueChange={(value) => {
                            const isSubmitted = value === 'submitted';
                            updateSelectedSubjectAssignmentSubmission(student.id, isSubmitted);
                          }}
                          disabled={selectedSubject === 'all'}
                        >
                          <SelectTrigger className="w-32 h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="not-submitted">Not Submitted</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      
                      {/* Departmental Fees - For Selected Subject */}
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <Select
                          value={getSelectedSubjectDepartmentFeesStatus(student.id) ? 'paid' : 'pending'}
                          onValueChange={(value) => {
                            const isPaid = value === 'paid';
                            updateSelectedSubjectDepartmentFees(student.id, isPaid);
                          }}
                          disabled={selectedSubject === 'all'}
                        >
                          <SelectTrigger className="w-24 h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      
                      {/* Overall Status - For Selected Subject */}
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${
                          getSelectedSubjectOverallStatus(student.id) === 'Completed' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }`}>
                          {getSelectedSubjectOverallStatus(student.id)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Save Button */}
            <div className="flex justify-between items-center pt-4">
              <div className="text-sm text-gray-600">
                {studentsWithMarks.length} students • {subjects.length} subjects
              </div>
              <Button onClick={saveAllChanges} disabled={saving} className="min-w-[120px]">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save All
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
