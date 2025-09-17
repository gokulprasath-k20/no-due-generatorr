// Environment variable validation for production
export const validateEnvironment = () => {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    'VITE_SUPABASE_PROJECT_ID'
  ];

  const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing environment variables:', missingVars);
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  console.log('Environment variables validated successfully');
  return true;
};

// Check if we're in production
export const isProduction = () => import.meta.env.PROD;

// Get environment info for debugging
export const getEnvironmentInfo = () => ({
  mode: import.meta.env.MODE,
  prod: import.meta.env.PROD,
  dev: import.meta.env.DEV,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
  supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'Set' : 'Missing',
  supabaseProjectId: import.meta.env.VITE_SUPABASE_PROJECT_ID ? 'Set' : 'Missing'
});
