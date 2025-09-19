import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { api } from '@/utils/supabase-api';
import { getYearFromSemester } from '@/types';
import { Loader2, UserPlus, ArrowLeft } from 'lucide-react';

interface StudentRegistrationProps {
  onBack: () => void;
  onRegistrationSuccess: (registerNumber: string) => void;
}

const DEPARTMENTS = [
  'Information Technology',
  'Computer Science and Engineering',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering'
];

export function StudentRegistration({ onBack, onRegistrationSuccess }: StudentRegistrationProps) {
  const [name, setName] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [semester, setSemester] = useState<string>('');
  const [department, setDepartment] = useState<string>('Information Technology');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Enhanced validation
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter your full name",
        variant: "destructive"
      });
      return;
    }

    if (!registerNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter your register number",
        variant: "destructive"
      });
      return;
    }

    if (!semester) {
      toast({
        title: "Error",
        description: "Please select your semester",
        variant: "destructive"
      });
      return;
    }

    if (!department) {
      toast({
        title: "Error",
        description: "Please select your department",
        variant: "destructive"
      });
      return;
    }

    // Validate register number format (basic check)
    const regNoPattern = /^[A-Za-z0-9]+$/;
    if (!regNoPattern.test(registerNumber.trim())) {
      toast({
        title: "Error",
        description: "Register number should contain only letters and numbers",
        variant: "destructive"
      });
      return;
    }

    // Validate name (should contain only letters and spaces)
    const namePattern = /^[A-Za-z\s]+$/;
    if (!namePattern.test(name.trim())) {
      toast({
        title: "Error",
        description: "Name should contain only letters and spaces",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('StudentRegistration: Starting registration process...');
      const semesterNum = parseInt(semester);
      const year = getYearFromSemester(semesterNum);
      
      // Validate semester and year combination
      if (semesterNum < 3 || semesterNum > 8) {
        throw new Error('Invalid semester selected. Please select a semester between 3rd and 8th.');
      }

      console.log('StudentRegistration: Calling API with:', { 
        name: name.trim(), 
        registerNumber: registerNumber.trim().toUpperCase(), 
        year, 
        department, 
        semesterNum 
      });
      
      await api.registerStudent(
        name.trim(), 
        registerNumber.trim().toUpperCase(), 
        year, 
        department, 
        semesterNum
      );
      
      toast({
        title: "Registration Successful",
        description: `Welcome ${name}! You can now access your certificate.`,
      });
      
      // Automatically log them in after successful registration
      onRegistrationSuccess(registerNumber.trim().toUpperCase());
    } catch (error) {
      console.error('StudentRegistration: Registration failed:', error);
      console.error('StudentRegistration: Error type:', typeof error);
      console.error('StudentRegistration: Error details:', error instanceof Error ? { message: error.message, stack: error.stack } : error);
      
      let errorMessage = "An error occurred during registration";
      
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          errorMessage = "A student with this register number is already registered. Please use a different register number or contact admin.";
        } else if (error.message.includes('violates')) {
          errorMessage = "Invalid data provided. Please check your information and try again.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-2 sm:p-0">
        <Button 
          variant="ghost" 
          onClick={onBack} 
          className="mb-4 no-print h-12 px-4 rounded-xl"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Login
        </Button>
        
        <Card className="shadow-lg border mobile-card">
          <CardHeader className="text-center space-y-3 pb-4">
            <div className="mx-auto w-20 h-20 sm:w-16 sm:h-16 bg-primary rounded-full flex items-center justify-center mb-4 shadow-lg">
              <UserPlus className="w-10 h-10 sm:w-8 sm:h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
              Student Registration
            </CardTitle>
            <p className="text-muted-foreground text-sm sm:text-base px-2">
              Enter your details to register for a no-due certificate
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            <div className="space-y-3">
              <label htmlFor="name" className="text-base font-medium text-foreground block">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-lg h-12 rounded-xl border-2 focus:border-primary transition-colors"
              />
            </div>
            
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
                className="font-mono text-lg h-12 rounded-xl border-2 focus:border-primary transition-colors"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3">
                <label htmlFor="semester" className="text-base font-medium text-foreground block">
                  Semester
                </label>
                <Select value={semester} onValueChange={setSemester}>
                  <SelectTrigger className="h-12 rounded-xl border-2 focus:border-primary transition-colors">
                    <SelectValue placeholder="Select semester" />
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
              
              <div className="space-y-3">
                <label htmlFor="department" className="text-base font-medium text-foreground block">
                  Department
                </label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="h-12 rounded-xl border-2 focus:border-primary transition-colors">
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
            
            <Button 
              onClick={handleRegister} 
              className="w-full h-12 text-base font-semibold rounded-xl shadow-lg mt-8"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-5 w-5" />
                  Register Student
                </>
              )}
            </Button>
          </CardContent>
        </Card>
    </div>
  );
}
