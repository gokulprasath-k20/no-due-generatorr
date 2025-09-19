import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { api } from '@/utils/supabase-api';
import { Student, Mark } from '@/types';
import { CertificatePreview } from './CertificatePreview';
import { StudentRegistration } from './StudentRegistration';
import { Layout } from './Layout';
import { Loader2, Search, UserPlus } from 'lucide-react';

export function StudentPanel() {
  const [registerNumber, setRegisterNumber] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);

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
          description: "No student found with this register number. Please check the register number and try again.",
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

  const handleRefresh = (newMarks: Mark[]) => {
    console.log('StudentPanel: Updating marks with refreshed data:', newMarks);
    setMarks(newMarks);
  };

  const handleRegistrationSuccess = async (regNumber: string) => {
    setRegisterNumber(regNumber);
    setShowRegistration(false);
    
    // Add a small delay to ensure database transaction is committed
    setTimeout(async () => {
      try {
        await handleSearch();
      } catch (error) {
        console.error('Error during post-registration search:', error);
        // Don't show error toast here as registration was successful
        // The user can manually search if needed
      }
    }, 500);
  };

  const handleBackFromRegistration = () => {
    setShowRegistration(false);
  };

  if (showRegistration) {
    return (
      <Layout>
        <StudentRegistration 
          onBack={handleBackFromRegistration} 
          onRegistrationSuccess={handleRegistrationSuccess} 
        />
      </Layout>
    );
  }

  if (showPreview && student) {
    return (
      <Layout showHeader={false}>
        <CertificatePreview student={student} marks={marks} onBack={handleBack} onRefresh={handleRefresh} />
      </Layout>
    );
  }

  return (
    <Layout>
      {!showPreview && !showRegistration && (
        <div className="flex items-center justify-center p-2 sm:p-4 min-h-[calc(100vh-200px)]">
          <Card className="w-full max-w-md shadow-lg border mobile-card">
            <CardHeader className="text-center space-y-3 pb-4">
              <div className="mx-auto w-20 h-20 sm:w-16 sm:h-16 bg-primary rounded-full flex items-center justify-center mb-4 shadow-lg">
                <Search className="w-10 h-10 sm:w-8 sm:h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                No Due Certificate Generator
              </CardTitle>
              <p className="text-muted-foreground text-sm sm:text-base px-2">
                Enter your register number to view and generate your certificate
              </p>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <div className="space-y-3">
                <label htmlFor="register" className="text-base font-medium text-foreground block">
                  Register Number
                </label>
                <Input
                  id="register"
                  type="text"
                  placeholder="Enter your register number"
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="text-center font-mono text-lg h-12 rounded-xl border-2 focus:border-primary transition-colors"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                className="w-full h-12 text-base font-semibold rounded-xl shadow-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    Search Student
                  </>
                )}
              </Button>
              
              <div className="text-center pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">
                  Don't have an account?
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setShowRegistration(true)}
                  className="w-full h-12 text-base font-semibold rounded-xl border-2"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  Register New Student
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </Layout>
  );
}