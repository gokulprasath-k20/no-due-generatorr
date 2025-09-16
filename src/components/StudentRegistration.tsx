import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { api } from '@/utils/supabase-api';
import { Layout } from './Layout';
import { Loader2, UserPlus, ArrowLeft } from 'lucide-react';

interface StudentRegistrationProps {
  onBack: () => void;
  onRegistrationSuccess: (registerNumber: string) => void;
}

const DEPARTMENTS = [
  'Computer Science and Engineering',
  'Information Technology',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering'
];

export function StudentRegistration({ onBack, onRegistrationSuccess }: StudentRegistrationProps) {
  const [name, setName] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [year, setYear] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !registerNumber.trim() || !year || !department) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await api.registerStudent(name.trim(), registerNumber.trim(), parseInt(year), department);
      
      toast({
        title: "Registration Successful",
        description: `Welcome ${name}! You can now access your certificate.`,
      });
      
      // Automatically log them in after successful registration
      onRegistrationSuccess(registerNumber.trim());
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to register student';
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
    <Layout>
      <div className="max-w-md mx-auto">
        <Button 
          variant="ghost" 
          onClick={onBack} 
          className="mb-4 no-print"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Button>
        
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Student Registration
            </CardTitle>
            <p className="text-gray-600 text-sm">
              Enter your details to register for a no-due certificate
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-lg"
              />
            </div>
            
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
                className="font-mono text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="year" className="text-sm font-medium text-gray-700">
                Year
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Year</label>
                  <Select value={year} onValueChange={setYear}>
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
                  <label className="text-sm font-medium text-gray-700">Department</label>
                  <Select value={department} onValueChange={setDepartment}>
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
            
            <Button 
              onClick={handleRegister} 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
