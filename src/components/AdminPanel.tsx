import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { api } from '@/utils/supabase-api';
import { Student } from '@/types';
import { LogOut } from 'lucide-react';
import { StudentSheet } from './StudentSheet';

interface AdminPanelProps {
  onLogout: () => void;
}

export function AdminPanel({ onLogout }: AdminPanelProps) {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // Fetch all registered students on component mount
  useEffect(() => {
    fetchAllStudents();
  }, []);

  const fetchAllStudents = async () => {
    setLoadingStudents(true);
    try {
      const students = await api.getAllStudents();
      setAllStudents(students || []);
      
      toast({
        title: "Students Loaded",
        description: `Found ${students?.length || 0} registered students`,
      });
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: `Failed to fetch registered students: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
      setAllStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin Panel</h1>
        <Button variant="outline" onClick={onLogout} className="w-full sm:w-auto">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* Student Sheet - Only View */}
      <StudentSheet 
        allStudents={allStudents}
        onRefresh={fetchAllStudents}
        loading={loadingStudents}
      />
    </div>
  );
}
