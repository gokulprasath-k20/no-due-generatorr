import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { api } from '@/utils/supabase-api';
import { Student, Mark } from '@/types';
import { CertificatePreview } from './CertificatePreview';
import { Loader2, Search } from 'lucide-react';

export function StudentPanel() {
  const [registerNumber, setRegisterNumber] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSearch = async () => {
    if (!registerNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a register number",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { student: foundStudent, marks: foundMarks } = await api.getStudentByRegNo(registerNumber.trim());
      
      if (!foundStudent) {
        toast({
          title: "Student Not Found",
          description: "No student found with this register number",
          variant: "destructive"
        });
        return;
      }

      setStudent(foundStudent);
      setMarks(foundMarks);
      setShowPreview(true);
      
      toast({
        title: "Success",
        description: `Found student: ${foundStudent.name}`,
      });
    } catch (error) {
      console.error('Error fetching student:', error);
      toast({
        title: "Error",
        description: "Failed to fetch student data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setShowPreview(false);
    setStudent(null);
    setMarks([]);
  };

  if (showPreview && student) {
    return <CertificatePreview student={student} marks={marks} onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            No Due Certificate Generator
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Enter your register number to view and generate your certificate
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="register" className="text-sm font-medium text-gray-700">
              Register Number
            </label>
            <Input
              id="register"
              type="text"
              placeholder="Enter your register number"
              value={registerNumber}
              onChange={(e) => setRegisterNumber(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="text-center font-mono text-lg"
            />
          </div>
          <Button 
            onClick={handleSearch} 
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              'View Certificate'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}