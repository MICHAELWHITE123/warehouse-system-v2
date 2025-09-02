import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export function Diagnostics() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    const newResults: DiagnosticResult[] = [];

    // Test 1: Environment Variables
    try {
      const envVars = {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
        VITE_API_URL: import.meta.env.VITE_API_URL,
        VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
        NODE_ENV: import.meta.env.NODE_ENV,
        MODE: import.meta.env.MODE
      };

      const hasSupabase = !!(envVars.VITE_SUPABASE_URL && envVars.VITE_SUPABASE_ANON_KEY);
      
      newResults.push({
        name: 'Environment Variables',
        status: hasSupabase ? 'success' : 'error',
        message: hasSupabase ? 'Supabase configuration found' : 'Missing Supabase configuration',
        details: JSON.stringify(envVars, null, 2)
      });
    } catch (error) {
      newResults.push({
        name: 'Environment Variables',
        status: 'error',
        message: `Error checking environment: ${error}`,
      });
    }

    // Test 2: localStorage
    try {
      localStorage.setItem('diagnostic-test', 'test-value');
      const testValue = localStorage.getItem('diagnostic-test');
      localStorage.removeItem('diagnostic-test');
      
      newResults.push({
        name: 'localStorage',
        status: testValue === 'test-value' ? 'success' : 'error',
        message: testValue === 'test-value' ? 'localStorage is working' : 'localStorage test failed',
      });
    } catch (error) {
      newResults.push({
        name: 'localStorage',
        status: 'error',
        message: `localStorage error: ${error}`,
      });
    }

    // Test 3: Database Initialization
    try {
      const { initDatabase } = await import('../database');
      await initDatabase();
      
      newResults.push({
        name: 'Database Initialization',
        status: 'success',
        message: 'Database initialized successfully',
      });
    } catch (error) {
      newResults.push({
        name: 'Database Initialization',
        status: 'error',
        message: `Database initialization failed: ${error}`,
      });
    }

    // Test 4: Supabase Connection
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        
        newResults.push({
          name: 'Supabase Connection',
          status: response.ok ? 'success' : 'warning',
          message: response.ok ? 'Supabase connection successful' : `Supabase connection failed: ${response.status}`,
        });
      } else {
        newResults.push({
          name: 'Supabase Connection',
          status: 'error',
          message: 'Supabase credentials not configured',
        });
      }
    } catch (error) {
      newResults.push({
        name: 'Supabase Connection',
        status: 'error',
        message: `Supabase connection error: ${error}`,
      });
    }

    // Test 5: API Configuration
    try {
      const { getApiUrl, isApiAvailable } = await import('../config/api');
      const apiUrl = getApiUrl('health');
      const isAvailable = isApiAvailable();
      
      newResults.push({
        name: 'API Configuration',
        status: isAvailable ? 'success' : 'warning',
        message: isAvailable ? `API configured: ${apiUrl}` : 'API not available',
        details: `API URL: ${apiUrl}, Available: ${isAvailable}`
      });
    } catch (error) {
      newResults.push({
        name: 'API Configuration',
        status: 'error',
        message: `API configuration error: ${error}`,
      });
    }

    // Test 6: Current Location
    try {
      const location = window.location;
      newResults.push({
        name: 'Application Location',
        status: 'success',
        message: `Running on: ${location.hostname}`,
        details: `URL: ${location.href}, Protocol: ${location.protocol}`
      });
    } catch (error) {
      newResults.push({
        name: 'Application Location',
        status: 'error',
        message: `Location error: ${error}`,
      });
    }

    setResults(newResults);
    setIsLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Diagnostics</CardTitle>
              <CardDescription>
                Check system health and configuration
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={runDiagnostics} 
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    const { syncAdapter } = await import('../database/syncAdapter');
                    syncAdapter.resetSync();
                    toast.success('Sync state reset successfully');
                    runDiagnostics();
                  } catch (error) {
                    toast.error('Failed to reset sync state');
                  }
                }}
                variant="destructive"
                size="sm"
              >
                Reset Sync
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                {getStatusIcon(result.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-medium">{result.name}</h3>
                    <Badge className={getStatusColor(result.status)}>
                      {result.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">
                        Show details
                      </summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                        {result.details}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
