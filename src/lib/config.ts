// Application configuration
// Centralizes app-wide configuration and feature flags

import { env } from './env';

export const appConfig = {
  // Application metadata
  name: env.appName,
  version: env.appVersion,
  description: env.appDescription,
  
  // Environment information
  environment: env.isDevelopment ? 'development' : 'production',
  isDevelopment: env.isDevelopment,
  isProduction: env.isProduction,
  
  // API configuration
  api: {
    baseUrl: env.apiBaseUrl,
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
  },
  
  // Supabase configuration
  supabase: {
    url: env.supabaseUrl,
    anonKey: env.supabaseAnonKey,
  },
  
  // Feature flags
  features: {
    chatAssistant: env.enableChatAssistant,
    analytics: env.enableAnalytics,
    socialMedia: env.enableSocialMedia,
    errorTracking: env.enableErrorTracking,
    performanceMonitoring: env.enablePerformanceMonitoring,
    mockData: env.enableMockData,
  },
  
  // Development settings
  development: {
    bypassAuth: env.devBypassAuth,
    debugMode: env.debugMode,
    enableMockData: env.enableMockData,
  },
  
  // UI configuration
  ui: {
    defaultTheme: env.defaultTheme,
    defaultLocale: env.defaultLocale,
  },
  
  // Content limits and defaults
  content: {
    maxContentLength: 10000,
    maxImageSize: 10 * 1024 * 1024, // 10MB
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    defaultNeighborhood: 'Carmichael',
    defaultCounty: 'Sacramento County',
    defaultState: 'CA',
  },
  
  // Analytics configuration
  analytics: {
    trackPageViews: env.enableAnalytics,
    trackUserEvents: env.enableAnalytics,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
  },
} as const;

// Export commonly used values for convenience
export const { isDevelopment, isProduction } = appConfig;
export const { features } = appConfig;
export const devMode = appConfig.development.bypassAuth;

// Validation function
export const validateConfig = (): string[] => {
  const errors: string[] = [];
  
  if (!appConfig.supabase.url) {
    errors.push('Supabase URL is not configured');
  }
  
  if (!appConfig.supabase.anonKey) {
    errors.push('Supabase anonymous key is not configured');
  }
  
  if (appConfig.isDevelopment && !appConfig.api.baseUrl) {
    errors.push('API base URL is not configured for development');
  }
  
  return errors;
};

// Log configuration in development
if (appConfig.isDevelopment && appConfig.development.debugMode) {
  console.group('🔧 Application Configuration');
  console.log('Environment:', appConfig.environment);
  console.log('Features:', appConfig.features);
  console.log('Development settings:', appConfig.development);
  
  const configErrors = validateConfig();
  if (configErrors.length > 0) {
    console.error('Configuration errors:', configErrors);
  } else {
    console.log('✅ Configuration is valid');
  }
  console.groupEnd();
}