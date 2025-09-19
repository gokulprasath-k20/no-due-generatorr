import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { api } from '@/utils/supabase-api';
import { Student, Mark, getSubjectsForYearSem } from '@/types';
import { Loader2, Save, Download, RefreshCw } from 'lucide-react';
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
  const [studentsWithMarks, setStudentsWithMarks] = useState<StudentWithMarks[]>([]);
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);

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

  // Save all changes
  const saveAllChanges = async () => {
    setSaving(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const student of studentsWithMarks) {
        try {
          const marksToSave = student.marks.map(mark => ({
            subject: mark.subject,
            iat1: mark.iat1,
            iat2: mark.iat2,
            model: mark.model,
            signed: mark.signed,
            departmentFine: mark.departmentFine ?? 0,
            assignmentSubmitted: mark.assignmentSubmitted ?? false
          }));

          await api.updateMarks(student.id, marksToSave);
          successCount++;
        } catch (error) {
          console.error(`Error saving marks for ${student.name}:`, error);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        toast({
          title: "Success",
          description: `Successfully saved changes for all ${successCount} students`,
        });
      } else {
        toast({
          title: "Partial Success",
          description: `Saved ${successCount} students, ${errorCount} failed`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving all changes:', error);
      toast({
        title: "Error",
        description: "Failed to save changes",
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

            {/* Excel-like Table */}
            <div className="overflow-x-auto border border-gray-300 rounded-lg">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left font-medium text-sm sticky left-0 bg-gray-100 z-10">
                      Student Details
                    </th>
                    {subjects.map((subject) => (
                      <th key={subject} className="border border-gray-300 px-2 py-2 text-center font-medium text-sm min-w-[200px]">
                        <div className="space-y-1">
                          <div className="font-semibold">{subject}</div>
                          <div className="flex justify-center gap-1 text-xs">
                            {shouldShowMarksColumns(subject) && (
                              <>
                                <span className="bg-blue-100 px-1 rounded">IAT1</span>
                                <span className="bg-blue-100 px-1 rounded">IAT2</span>
                                <span className="bg-blue-100 px-1 rounded">Model</span>
                                <span className="bg-green-100 px-1 rounded">Assign</span>
                                <span className="bg-yellow-100 px-1 rounded">Fees</span>
                              </>
                            )}
                            <span className="bg-purple-100 px-1 rounded">Sign</span>
                            <span className="bg-gray-100 px-1 rounded">Status</span>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {studentsWithMarks.map((student, index) => (
                    <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {/* Student Details - Sticky Column */}
                      <td className="border border-gray-300 px-3 py-2 sticky left-0 bg-inherit z-10">
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{student.name}</div>
                          <div className="text-xs text-gray-600 font-mono">{student.register_number}</div>
                          <div className="text-xs text-gray-500">{student.department}</div>
                        </div>
                      </td>
                      
                      {/* Subject Columns */}
                      {subjects.map((subject) => (
                        <td key={subject} className="border border-gray-300 px-2 py-2">
                          <div className="space-y-2">
                            {shouldShowMarksColumns(subject) && (
                              <>
                                {/* Marks Row */}
                                <div className="flex gap-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={getMarkValue(student.id, subject, 'iat1')}
                                    onChange={(e) => updateMark(student.id, subject, 'iat1', e.target.value)}
                                    className="w-12 h-6 text-xs text-center p-1"
                                    placeholder="IAT1"
                                  />
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={getMarkValue(student.id, subject, 'iat2')}
                                    onChange={(e) => updateMark(student.id, subject, 'iat2', e.target.value)}
                                    className="w-12 h-6 text-xs text-center p-1"
                                    placeholder="IAT2"
                                  />
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={getMarkValue(student.id, subject, 'model')}
                                    onChange={(e) => updateMark(student.id, subject, 'model', e.target.value)}
                                    className="w-12 h-6 text-xs text-center p-1"
                                    placeholder="Model"
                                  />
                                </div>
                                
                                {/* Assignment & Fees Row */}
                                <div className="flex gap-1">
                                  <Select
                                    value={getAssignmentStatus(student.id, subject)}
                                    onValueChange={(value) => {
                                      const isSubmitted = value === 'submitted';
                                      updateAssignmentSubmission(student.id, subject, isSubmitted);
                                    }}
                                  >
                                    <SelectTrigger className="w-16 h-6 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="submitted">✓</SelectItem>
                                      <SelectItem value="not-submitted">✗</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  
                                  <Select
                                    value={getDepartmentFeesStatus(student.id, subject) ? 'paid' : 'pending'}
                                    onValueChange={(value) => {
                                      const isPaid = value === 'paid';
                                      updateDepartmentFees(student.id, subject, isPaid);
                                    }}
                                  >
                                    <SelectTrigger className="w-16 h-6 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="paid">Paid</SelectItem>
                                      <SelectItem value="pending">Pending</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </>
                            )}
                            
                            {/* Signature & Status Row */}
                            <div className="flex gap-1">
                              <Select
                                value={getSignatureStatus(student.id, subject) ? 'signed' : 'unsigned'}
                                onValueChange={(value) => {
                                  const isSigned = value === 'signed';
                                  updateSignature(student.id, subject, isSigned);
                                }}
                              >
                                <SelectTrigger className="w-16 h-6 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="signed">✓</SelectItem>
                                  <SelectItem value="unsigned">✗</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium w-16 h-6 ${
                                getDueStatus(student.id, subject) === 'Completed' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {getDueStatus(student.id, subject) === 'Completed' ? '✓' : '⏳'}
                              </span>
                            </div>
                          </div>
                        </td>
                      ))}
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
