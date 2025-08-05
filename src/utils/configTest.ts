// Configuration test utility
import { API_CONFIG } from '../config/api';

export const testApiConfiguration = (): boolean => {
  try {
    console.log('Testing API Configuration...');
    console.log('BASE_URL:', API_CONFIG.BASE_URL);
    console.log('TIMEOUT:', API_CONFIG.TIMEOUT);
    console.log('RETRY_ATTEMPTS:', API_CONFIG.RETRY_ATTEMPTS);
    console.log('RETRY_DELAY:', API_CONFIG.RETRY_DELAY);
    
    // Basic validation
    if (!API_CONFIG.BASE_URL) {
      console.error('❌ BASE_URL is not configured');
      return false;
    }
    
    if (API_CONFIG.TIMEOUT <= 0) {
      console.error('❌ TIMEOUT must be greater than 0');
      return false;
    }
    
    console.log('✅ API Configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Error testing API configuration:', error);
    return false;
  }
};

// Auto-run test in development
if (import.meta.env.DEV) {
  testApiConfiguration();
}
