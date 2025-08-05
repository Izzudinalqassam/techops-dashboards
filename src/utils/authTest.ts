// Authentication system test utility
import { authService } from '../services/authService';
import { apiService } from '../services/apiService';

export const testAuthSystem = (): boolean => {
  try {
    // console.log('Testing Authentication System...');

    // Test 1: Check if authService exists
    if (!authService) {
      // console.error('❌ AuthService not found');
      return false;
    }
    // console.log('✅ AuthService initialized');

    // Test 2: Check if apiService has interceptors
    if (!apiService.interceptors) {
      // console.error('❌ ApiService interceptors not found');
      return false;
    }
    // console.log('✅ ApiService interceptors available');

    // Test 3: Check if interceptors can be added
    try {
      const testInterceptor = (config: any) => {
        // console.log('🔧 Test interceptor called');
        return config;
      };

      apiService.interceptors.request.use(testInterceptor);
      // console.log('✅ Request interceptor added successfully');
    } catch (error) {
      // console.error('❌ Failed to add request interceptor:', error);
      return false;
    }

    // Test 4: Check authService methods
    const requiredMethods = ['login', 'logout', 'getToken', 'setToken', 'isAuthenticated', 'setupInterceptors'];
    for (const method of requiredMethods) {
      if (typeof (authService as any)[method] !== 'function') {
        // console.error(`❌ AuthService.${method} method not found`);
        return false;
      }
    }
    // console.log('✅ All AuthService methods available');

    // Test 5: Test setupInterceptors method
    try {
      authService.setupInterceptors();
      // console.log('✅ setupInterceptors executed without errors');
    } catch (error) {
      // console.error('❌ setupInterceptors failed:', error);
      return false;
    }

    // console.log('🎉 Authentication system test passed!');
    return true;
  } catch (error) {
    // console.error('❌ Authentication system test failed:', error);
    return false;
  }
};

// Test mock authentication
export const testMockAuth = async (): Promise<boolean> => {
  try {
    // console.log('🧪 Testing Mock Authentication...');

    const { mockAuthService } = await import('../services/mockAuthService');

    // Test login
    const loginResult = await mockAuthService.login({
      email: 'admin@dashboard.local',
      password: 'admin123'
    });

    if (!loginResult.user || !loginResult.token) {
      // console.error('❌ Mock login failed');
      return false;
    }

    // console.log('✅ Mock login successful');

    // Test token validation
    if (!mockAuthService.isAuthenticated()) {
      // console.error('❌ Mock authentication check failed');
      return false;
    }

    // console.log('✅ Mock authentication check passed');

    // Test logout
    await mockAuthService.logout();

    if (mockAuthService.isAuthenticated()) {
      // console.error('❌ Mock logout failed');
      return false;
    }

    // console.log('✅ Mock logout successful');
    // console.log('🎉 Mock authentication test passed!');
    return true;
  } catch (error) {
    // console.error('❌ Mock authentication test failed:', error);
    return false;
  }
};

// Auto-run test in development (disabled for production)
// if (import.meta.env.DEV) {
//   // Delay test to ensure all modules are loaded
//   setTimeout(() => {
//     testAuthSystem();

//     // Test mock auth if enabled
//     if (import.meta.env.VITE_USE_MOCK_AUTH === 'true') {
//       setTimeout(() => {
//         testMockAuth();
//       }, 500);
//     }
//   }, 1000);
// }
