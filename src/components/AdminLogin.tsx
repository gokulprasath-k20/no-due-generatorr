import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { api } from '@/utils/supabase-api';
import { Shield, Loader2, UserPlus, LogIn } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    // Simulate network delay for better UX
    setTimeout(() => {
      if (api.validateAdmin(username, password)) {
        toast({
          title: "Success",
          description: "Login successful",
        });
        onLoginSuccess();
      } else {
        toast({
          title: "Error",
          description: "Invalid credentials",
          variant: "destructive"
        });
      }
      setLoading(false);
    }, 1000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim() || !email.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    // Simulate registration process
    setTimeout(() => {
      // For now, we'll just simulate successful registration
      // In a real app, this would call an API to register the admin
      toast({
        title: "Success",
        description: "Admin account created successfully! You can now login.",
      });
      
      // Switch back to login mode and clear form
      setIsRegisterMode(false);
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setEmail('');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            {isRegisterMode ? 'Admin Registration' : 'Admin Login'}
          </CardTitle>
          <p className="text-gray-600 text-sm">
            {isRegisterMode 
              ? 'Create a new admin account' 
              : 'Enter your credentials to access the admin panel'
            }
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-4">
            {isRegisterMode && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter admin email"
                  disabled={loading}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegisterMode ? "Create password (min 6 chars)" : "Enter admin password"}
                disabled={loading}
              />
            </div>
            {isRegisterMode && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  disabled={loading}
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isRegisterMode ? 'Creating Account...' : 'Signing in...'}
                </>
              ) : (
                <>
                  {isRegisterMode ? (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </>
              )}
            </Button>
            
            {/* Toggle between login and register */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">
                {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}
              </p>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setUsername('');
                  setPassword('');
                  setConfirmPassword('');
                  setEmail('');
                }}
                disabled={loading}
                className="text-blue-600 hover:text-blue-700"
              >
                {isRegisterMode ? 'Sign In Instead' : 'Create New Account'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}