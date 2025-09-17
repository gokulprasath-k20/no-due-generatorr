import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { getEnvironmentInfo } from '@/utils/env-check';
import { api } from '@/utils/supabase-api';
import { checkDatabaseSchema, getMigrationSQL } from '@/utils/database-migration';

export function AdminDebug() {
  const [envInfo, setEnvInfo] = useState<any>(null);
  const [supabaseTest, setSupabaseTest] = useState<string>('Not tested');
  const [authTest, setAuthTest] = useState<string>('Not tested');
  const [studentTest, setStudentTest] = useState<string>('Not tested');
  const [schemaTest, setSchemaTest] = useState<string>('Not tested');
  const [showMigrationSQL, setShowMigrationSQL] = useState(false);

  useEffect(() => {
    setEnvInfo(getEnvironmentInfo());
  }, []);

  const testSupabaseConnection = async () => {
    try {
      setSupabaseTest('Testing...');
      const { data, error } = await supabase.from('students').select('id').limit(1);
      if (error) {
        setSupabaseTest(`❌ Error: ${error.message}`);
      } else {
        setSupabaseTest('✅ Connection successful');
      }
    } catch (error) {
      setSupabaseTest(`❌ Connection failed: ${error}`);
    }
  };

  const testAdminAuth = () => {
    try {
      setAuthTest('Testing...');
      const result = api.validateAdmin('avsecit', 'avsecit001');
      setAuthTest(result ? '✅ Admin auth works' : '❌ Admin auth failed');
    } catch (error) {
      setAuthTest(`❌ Auth error: ${error}`);
    }
  };

  const testStudentSearch = async () => {
    try {
      setStudentTest('Testing...');
      // Test with a sample register number - this will likely fail but show us the error
      const result = await api.getStudentByRegNo('TEST123');
      if (result.student) {
        setStudentTest('✅ Student search works');
      } else {
        setStudentTest('✅ Student search works (no student found)');
      }
    } catch (error) {
      setStudentTest(`❌ Student search error: ${error}`);
    }
  };

  const testDatabaseSchema = async () => {
    try {
      setSchemaTest('Testing...');
      const result = await checkDatabaseSchema();
      
      if (result.studentsHasSemester && result.marksHasNewFields) {
        setSchemaTest('✅ Database schema is up to date');
      } else {
        const missing = [];
        if (!result.studentsHasSemester) missing.push('semester column');
        if (!result.marksHasNewFields) missing.push('assignment/fees columns');
        setSchemaTest(`❌ Missing: ${missing.join(', ')}`);
        setShowMigrationSQL(true);
      }
    } catch (error) {
      setSchemaTest(`❌ Schema check failed: ${error}`);
    }
  };

  const runAllTests = async () => {
    testAdminAuth();
    await testSupabaseConnection();
    await testDatabaseSchema();
    await testStudentSearch();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            🔧 Admin Panel Debug Information
            <Button onClick={runAllTests} variant="outline" size="sm">
              Run All Tests
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Environment Info */}
          <div>
            <h3 className="font-semibold mb-2">Environment Variables</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(envInfo, null, 2)}
            </pre>
          </div>

          {/* Supabase Connection Test */}
          <div>
            <h3 className="font-semibold mb-2">Supabase Connection</h3>
            <div className="flex items-center gap-2">
              <Button onClick={testSupabaseConnection} size="sm">
                Test Connection
              </Button>
              <span className="text-sm">{supabaseTest}</span>
            </div>
          </div>

          {/* Admin Auth Test */}
          <div>
            <h3 className="font-semibold mb-2">Admin Authentication</h3>
            <div className="flex items-center gap-2">
              <Button onClick={testAdminAuth} size="sm">
                Test Auth
              </Button>
              <span className="text-sm">{authTest}</span>
            </div>
          </div>

          {/* Database Schema Test */}
          <div>
            <h3 className="font-semibold mb-2">Database Schema</h3>
            <div className="flex items-center gap-2">
              <Button onClick={testDatabaseSchema} size="sm">
                Check Schema
              </Button>
              <span className="text-sm">{schemaTest}</span>
            </div>
          </div>

          {/* Student Search Test */}
          <div>
            <h3 className="font-semibold mb-2">Student Search API</h3>
            <div className="flex items-center gap-2">
              <Button onClick={testStudentSearch} size="sm">
                Test Student Search
              </Button>
              <span className="text-sm">{studentTest}</span>
            </div>
          </div>

          {/* Migration SQL */}
          {showMigrationSQL && (
            <div>
              <h3 className="font-semibold mb-2">🔧 Database Migration Required</h3>
              <p className="text-sm text-yellow-700 mb-2">
                Your database is missing some columns. Run this SQL in your Supabase dashboard:
              </p>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto border">
                {getMigrationSQL()}
              </pre>
              <p className="text-xs text-gray-600 mt-2">
                Go to Supabase Dashboard → SQL Editor → Run the above commands
              </p>
            </div>
          )}

          {/* Current URL */}
          <div>
            <h3 className="font-semibold mb-2">Current URL</h3>
            <code className="bg-gray-100 p-2 rounded text-sm">
              {typeof window !== 'undefined' ? window.location.href : 'Server-side'}
            </code>
          </div>

          {/* Local Storage Check */}
          <div>
            <h3 className="font-semibold mb-2">Admin Session</h3>
            <code className="bg-gray-100 p-2 rounded text-sm block">
              {typeof window !== 'undefined' 
                ? localStorage.getItem('admin_session') || 'No session found'
                : 'Server-side'
              }
            </code>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
