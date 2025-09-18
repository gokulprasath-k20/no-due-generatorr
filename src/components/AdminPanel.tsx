import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { api } from '@/utils/supabase-api';
import { Student, Mark, SUBJECTS_BY_YEAR, getSubjectsForYearSem } from '@/types';
import { Loader2, Search, UserPlus, Save, LogOut } from 'lucide-react';
import { shouldShowMarksColumns } from '@/utils/subject-config';

interface AdminPanelProps {
  onLogout: () => void;
}

export function AdminPanel({ onLogout }: AdminPanelProps) {
  const [searchRegNo, setSearchRegNo] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // New student form
  const [showNewStudent, setShowNewStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRegNo, setNewStudentRegNo] = useState('');
  const [newStudentYear, setNewStudentYear] = useState<string>('');
  const [newStudentSem, setNewStudentSem] = useState<string>('');
  const [newStudentDept, setNewStudentDept] = useState<string>('');
  
  // Fetch all registered students on component mount
  useEffect(() => {
    fetchAllStudents();
  }, []);

  const fetchAllStudents = async () => {
    setLoadingStudents(true);
    try {
      const students = await api.getAllStudents();
      setAllStudents(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to fetch registered students",
        variant: "destructive"
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  const selectStudent = async (selectedStudent: Student) => {
    setSearchRegNo(selectedStudent.register_number);
    setStudent(selectedStudent);
    setLoading(true);
    try {
      const { marks } = await api.getStudentByRegNo(selectedStudent.register_number);
      setMarks(marks);
    } catch (error) {
      console.error('Error fetching student marks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch student marks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const DEPARTMENTS = [
    'Computer Science and Engineering',
    'Information Technology',
    'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering'
  ];

  const searchStudent = async () => {
    if (!searchRegNo.trim()) {
      toast({
        title: "Error",
        description: "Please enter a register number",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { student: foundStudent, marks: foundMarks } = await api.getStudentByRegNo(searchRegNo.trim());
      
      if (!foundStudent) {
        setStudent(null);
        setMarks([]);
        setShowNewStudent(true);
        toast({
          title: "Student Not Found",
          description: "Student not found. You can create a new student below.",
          variant: "destructive"
        });
        return;
      }

      setStudent(foundStudent);
      setMarks(foundMarks);
      setShowNewStudent(false);
      
      // Debug logging
      console.log('Found student:', foundStudent);
      console.log('Found marks:', foundMarks);
      
      toast({
        title: "Success",
        description: `Found student: ${foundStudent.name}`,
      });
    } catch (error) {
      console.error('Error searching student:', error);
      toast({
        title: "Error",
        description: "Failed to search student",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async () => {
    if (!newStudentName.trim() || !newStudentRegNo.trim() || !newStudentYear || !newStudentSem || !newStudentDept) {
      toast({
        title: "Error",
        description: "Please fill in all fields including semester",
        variant: "destructive"
      });
      return;
    }

    try {
      // Use registerStudent instead of createStudent
      await api.registerStudent(
        newStudentName.trim(),
        newStudentRegNo.trim(),
        parseInt(newStudentYear),
        newStudentDept,
        parseInt(newStudentSem)
      );
      
      toast({
        title: "Success",
        description: "Student registered successfully"
      });
      
      // Reset form and hide
      setNewStudentName('');
      setNewStudentRegNo('');
      setNewStudentYear('');
      setNewStudentSem('');
      setNewStudentDept('');
      setShowNewStudent(false);
      
      // Refresh student list or search
      await searchStudent();
    } catch (error) {
      console.error('Error registering student:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register student",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMark = (subject: string, field: 'iat1' | 'iat2' | 'model', value: string) => {
    const numValue = value === '' ? null : parseInt(value);
    setMarks(prev => {
      const existing = prev.find(m => m.subject === subject);
      if (existing) {
        return prev.map(m => 
          m.subject === subject 
            ? { ...m, [field]: numValue }
            : m
        );
      } else {
        return [...prev, {
          id: '', // Will be generated by database
          student_id: student!.id,
          subject,
          iat1: field === 'iat1' ? numValue : null,
          iat2: field === 'iat2' ? numValue : null,
          model: field === 'model' ? numValue : null,
          signed: false,
          assignmentSubmitted: false,
          departmentFine: 0,
          created_at: new Date().toISOString()
        }];
      }
    });
  };

  const updateAssignmentSubmission = (subject: string, submitted: boolean) => {
    console.log(`[DEBUG] Updating assignment submission for ${subject} to:`, submitted);
    
    setMarks(prev => {
      const existingIndex = prev.findIndex(m => m.subject === subject);
      
      if (existingIndex >= 0) {
        // Update existing mark
        const updatedMarks = [...prev];
        updatedMarks[existingIndex] = {
          ...updatedMarks[existingIndex],
          assignmentSubmitted: submitted
        };
        console.log(`[DEBUG] Updated existing mark for ${subject}:`, updatedMarks[existingIndex]);
        return updatedMarks;
      } else {
        // Create new mark entry
        const newMark = {
          id: '',
          student_id: student!.id,
          subject,
          iat1: null,
          iat2: null,
          model: null,
          signed: false,
          assignmentSubmitted: submitted,
          departmentFine: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        console.log(`[DEBUG] Created new mark entry for ${subject}:`, newMark);
        return [...prev, newMark];
      }
    });
  };

  const updateDepartmentFees = (subject: string, isPaid: boolean) => {
    setMarks(prev => {
      const existing = prev.find(m => m.subject === subject);
      if (existing) {
        return prev.map(m => 
          m.subject === subject 
            ? { ...m, departmentFine: isPaid ? 0 : 1 } // 0 = paid, 1 = pending
            : m
        );
      } else {
        return [...prev, {
          id: '',
          student_id: student!.id,
          subject,
          iat1: null,
          iat2: null,
          model: null,
          signed: false,
          assignmentSubmitted: false,
          departmentFine: isPaid ? 0 : 1,
          created_at: new Date().toISOString()
        }];
      }
    });
  };

  const updateSignature = (subject: string, signed: boolean) => {
    setMarks(prev => {
      const existing = prev.find(m => m.subject === subject);
      if (existing) {
        return prev.map(m => 
          m.subject === subject 
            ? { ...m, signed }
            : m
        );
      } else {
        return [...prev, {
          id: '',
          student_id: student!.id,
          subject,
          iat1: null,
          iat2: null,
          model: null,
          signed,
          assignmentSubmitted: false,
          departmentFine: 0,
          created_at: new Date().toISOString()
        }];
      }
    });
  };

  const getDueStatus = (subject: string): 'Completed' | 'Pending' => {
    const mark = marks.find(m => m.subject === subject);
    if (!mark) return 'Pending';
    
    // For Office and Library, only check signature
    if (subject === 'Office' || subject === 'Library') {
      return mark.signed ? 'Completed' : 'Pending';
    }
    
    // For academic subjects, check assignment submission and department fees
    return mark.assignmentSubmitted && mark.departmentFine === 0 ? 'Completed' : 'Pending';
  };

  const saveMarks = async () => {
    if (!student) return;

    setSaving(true);
    console.log('[DEBUG] Starting to save marks...');
    
    try {
      // 1. Prepare marks data with proper field names
      const marksToSave = marks.map(mark => {
        const markData: any = {
          subject: mark.subject,
          iat1: mark.iat1,
          iat2: mark.iat2,
          model: mark.model,
          signed: mark.signed,
          departmentFine: mark.departmentFine ?? 0,
          assignmentSubmitted: mark.assignmentSubmitted ?? false
        };
        
        console.log(`[DEBUG] Preparing mark for ${mark.subject}:`, {
          ...markData,
          assignmentSubmitted: mark.assignmentSubmitted
        });
        
        return markData;
      });

      console.log('[DEBUG] Saving marks data:', marksToSave);
      
      // 2. Save marks data first
      await api.updateMarks(student.id, marksToSave);
      
      // 3. Save student details
      await api.updateStudent(student.id, {
        name: student.name,
        department: student.department,
        year: student.year,
        semester: student.semester
      });
      
      console.log('[DEBUG] Data saved successfully, refreshing...');
      
      // 4. Refresh student data to ensure everything is in sync
      const { student: updatedStudent, marks: updatedMarks } = await api.getStudentByRegNo(student.register_number);
      console.log('[DEBUG] Refreshed data:', { updatedStudent, updatedMarks });
      
      setStudent(updatedStudent);
      setMarks(updatedMarks);
      
      toast({
        title: "Success",
        description: "All student data saved successfully",
      });
    } catch (error) {
      console.error('Error saving data:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save data";
      toast({
        title: "Error",
        description: errorMessage.includes('column') || errorMessage.includes('does not exist') 
          ? "Database schema needs updating. Some new features may not be available."
          : errorMessage,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getMarkValue = (subject: string, field: 'iat1' | 'iat2' | 'model'): string => {
    const mark = marks.find(m => m.subject === subject);
    const value = mark?.[field];
    return value === null || value === undefined ? '' : value.toString();
  };

  const getAssignmentStatus = (subject: string): string => {
    const mark = marks.find(m => m.subject === subject);
    return mark?.assignmentSubmitted ? 'submitted' : 'not-submitted';
  };

  const getDepartmentFeesStatus = (subject: string): boolean => {
    const mark = marks.find(m => m.subject === subject);
    return mark?.departmentFine === 0; // 0 = paid, >0 = pending
  };

  const getSignatureStatus = (subject: string): boolean => {
    const mark = marks.find(m => m.subject === subject);
    return mark?.signed ?? false;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Search Student */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Student
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter register number"
                value={searchRegNo}
                onChange={(e) => setSearchRegNo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchStudent()}
              />
              <Button onClick={searchStudent} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Registered Students List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Registered Students ({allStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStudents ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading students...</span>
              </div>
            ) : allStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No registered students found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left font-medium">Name</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-medium">Register Number</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-medium">Department</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-medium">Year/Sem</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allStudents.map((studentItem) => (
                      <tr key={studentItem.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2">{studentItem.name}</td>
                        <td className="border border-gray-300 px-4 py-2 font-mono">{studentItem.register_number}</td>
                        <td className="border border-gray-300 px-4 py-2">{studentItem.department}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          {studentItem.year === 2 ? '2nd' : '3rd'} Year
                          {studentItem.semester && ` / ${studentItem.semester}th Sem`}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => selectStudent(studentItem)}
                            disabled={loading}
                          >
                            {loading && student?.id === studentItem.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Select'
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Student Form */}
        {showNewStudent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Create New Student
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="regNo">Register Number</Label>
                  <Input
                    id="regNo"
                    value={newStudentRegNo}
                    onChange={(e) => setNewStudentRegNo(e.target.value)}
                    placeholder="Enter register number"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-student-year">Year</Label>
                    <Select value={newStudentYear} onValueChange={(value) => {
                      setNewStudentYear(value);
                      setNewStudentSem(''); // Reset semester when year changes
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-student-sem">Semester</Label>
                    <Select value={newStudentSem} onValueChange={setNewStudentSem} disabled={!newStudentYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {newStudentYear === '2' && (
                          <>
                            <SelectItem value="3">3rd Semester</SelectItem>
                            <SelectItem value="4">4th Semester</SelectItem>
                          </>
                        )}
                        {newStudentYear === '3' && (
                          <SelectItem value="5">5th Semester</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-student-dept">Department</Label>
                    <Select value={newStudentDept} onValueChange={setNewStudentDept}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <Button onClick={handleCreateStudent} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Create Student
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Marks Entry */}
        {student && (
          <Card>
            <CardHeader>
              <CardTitle>Student: {student.name} ({student.register_number})</CardTitle>
              <p className="text-muted-foreground">
                Year: {student.year === 2 ? '2nd' : '3rd'} 
                {student.semester && ` | Semester: ${student.semester}`}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Subject</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">IAT1</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">IAT2</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Model</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Assignment</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Due Status</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Signature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSubjectsForYearSem(student.year, student.semester).map((subject) => {
                      const showMarks = shouldShowMarksColumns(subject);
                      return (
                        <tr key={subject}>
                          <td className="border border-gray-300 px-4 py-2 font-medium">{subject}</td>
                          <td className="border border-gray-300 px-2 py-2">
                            {showMarks ? (
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={getMarkValue(subject, 'iat1')}
                                onChange={(e) => updateMark(subject, 'iat1', e.target.value)}
                                className="text-center"
                              />
                            ) : (
                              <span className="text-gray-400 text-center block">N/A</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-2 py-2">
                            {showMarks ? (
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={getMarkValue(subject, 'iat2')}
                                onChange={(e) => updateMark(subject, 'iat2', e.target.value)}
                                className="text-center"
                              />
                            ) : (
                              <span className="text-gray-400 text-center block">N/A</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-2 py-2">
                            {showMarks ? (
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={getMarkValue(subject, 'model')}
                                onChange={(e) => updateMark(subject, 'model', e.target.value)}
                                className="text-center"
                              />
                            ) : (
                              <span className="text-gray-400 text-center block">N/A</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center">
                            {shouldShowMarksColumns(subject) ? (
                              <Select
                                value={getAssignmentStatus(subject)}
                                onValueChange={(value) => {
                                  const isSubmitted = value === 'submitted';
                                  console.log(`Assignment ${subject} submission set to:`, isSubmitted);
                                  updateAssignmentSubmission(subject, isSubmitted);
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="submitted">Submitted</SelectItem>
                                  <SelectItem value="not-submitted">Not Submitted</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center">
                            <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium ${
                              getDueStatus(subject) === 'Completed' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {getDueStatus(subject)}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center">
                            <Select
                              value={getSignatureStatus(subject) ? 'signed' : 'pending'}
                              onValueChange={(value) => updateSignature(subject, value === 'signed')}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="signed">Signed</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Department Fees Section - Single Row */}
              <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold mb-3">Department Fees Status</h3>
                <div className="flex items-center gap-4">
                  <Label className="font-medium">Overall Department Fees:</Label>
                  <Select
                    value={marks.some(m => m.departmentFine > 0) ? 'pending' : 'paid'}
                    onValueChange={(value) => {
                      const isPaid = value === 'paid';
                      // Update all academic subjects (not Office/Library)
                      getSubjectsForYearSem(student.year, student.semester).forEach(subject => {
                        if (shouldShowMarksColumns(subject)) {
                          updateDepartmentFees(subject, isPaid);
                        }
                      });
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={saveMarks} disabled={saving} className="w-full md:w-auto">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save All Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
    </div>
  );
}