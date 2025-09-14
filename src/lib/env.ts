// Environment configuration helper
// Centralizes environment variable access and provides type safety

interface EnvironmentConfig {
  // App metadata
  appName: string;
  appVersion: string;
  appDescription: string;
  
  // Environment flags
  isDevelopment: boolean;
  isProduction: boolean;
  devBypassAuth: boolean;
  debugMode: boolean;
  enableMockData: boolean;
  
  // API configuration
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  
  // Feature flags
  enableChatAssistant: boolean;
  enableAnalytics: boolean;
  enableSocialMedia: boolean;
  enableErrorTracking: boolean;
  enablePerformanceMonitoring: boolean;
  
  // UI configuration
  defaultTheme: string;
  defaultLocale: string;
}

// Helper function to get boolean from string
const getBooleanEnv = (value: string | undefined, defaultValue: boolean = false): boolean => {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
};

// Helper function to get string with fallback
const getStringEnv = (value: string | undefined, defaultValue: string): string => {
  return value || defaultValue;
};

// Create environment configuration object
export const env: EnvironmentConfig = {
  // App metadata
  appName: getStringEnv(import.meta.env.VITE_APP_NAME, 'Hyper Pulse Content'),
  appVersion: getStringEnv(import.meta.env.VITE_APP_VERSION, '1.0.0'),
  appDescription: getStringEnv(
    import.meta.env.VITE_APP_DESCRIPTION, 
    'AI-powered content for modern agents'
  ),
  
  // Environment flags
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  devBypassAuth: getBooleanEnv(import.meta.env.VITE_DEV_BYPASS_AUTH, false),
  debugMode: getBooleanEnv(import.meta.env.VITE_DEBUG_MODE, false),
  enableMockData: getBooleanEnv(import.meta.env.VITE_ENABLE_MOCK_DATA, false),
  
  // API configuration
  apiBaseUrl: getStringEnv(import.meta.env.VITE_API_BASE_URL, 'http://localhost:8080'),
  supabaseUrl: getStringEnv(
    import.meta.env.VITE_SUPABASE_URL, 
    'https://fcayyxezuevsredxzmdj.supabase.co'
  ),
  supabaseAnonKey: getStringEnv(
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjYXl5eGV6dWV2c3JlZHh6bWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4ODI0ODcsImV4cCI6MjA3MDQ1ODQ4N30.km3p0FytDZqPHnBEEPpj-xsIdneseNg8lNyRBHpBKFw'
  ),
  
  // Feature flags
  enableChatAssistant: getBooleanEnv(import.meta.env.VITE_ENABLE_CHAT_ASSISTANT, true),
  enableAnalytics: getBooleanEnv(import.meta.env.VITE_ENABLE_ANALYTICS, true),
  enableSocialMedia: getBooleanEnv(import.meta.env.VITE_ENABLE_SOCIAL_MEDIA, true),
  enableErrorTracking: getBooleanEnv(import.meta.env.VITE_ENABLE_ERROR_TRACKING, true),
  enablePerformanceMonitoring: getBooleanEnv(import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING, true),
  
  // UI configuration
  defaultTheme: getStringEnv(import.meta.env.VITE_DEFAULT_THEME, 'dark'),
  defaultLocale: getStringEnv(import.meta.env.VITE_DEFAULT_LOCALE, 'en-US'),
};

// Development helpers
export const isDev = env.isDevelopment;
export const isProd = env.isProduction;
export const devMode = env.isDevelopment && env.devBypassAuth;

// Debug logging helper
export const debugLog = (...args: any[]) => {
  if (env.debugMode) {
    console.log('[DEBUG]', ...args);
  }
};

// Environment validation
export const validateEnvironment = (): string[] => {
  const errors: string[] = [];
  
  if (!env.supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is required');
  }
  
  if (!env.supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }
  
  return errors;
};

// Log environment info in development
if (env.isDevelopment && env.debugMode) {
  console.log('Environment Configuration:', {
    mode: env.isDevelopment ? 'development' : 'production',
    devBypassAuth: env.devBypassAuth,
    enableMockData: env.enableMockData,
    apiBaseUrl: env.apiBaseUrl,
    features: {
      chatAssistant: env.enableChatAssistant,
      analytics: env.enableAnalytics,
      socialMedia: env.enableSocialMedia,
    }
  });
  
  const envErrors = validateEnvironment();
  if (envErrors.length > 0) {
    console.error('Environment validation errors:', envErrors);
  }
}