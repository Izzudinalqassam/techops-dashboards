// Authentication diagnostic utility (disabled for production)
export const runAuthDiagnostic = async (): Promise<void> => {
  // Diagnostic functionality disabled to reduce console output
  // This utility can be manually enabled for debugging authentication issues

  // Determine authentication mode
  const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === 'true' ||
                     (import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL);

  if (!useMockAuth) {
    // Test backend connectivity silently
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

    try {
      const response = await fetch(`${apiUrl}/health`);
      if (!response.ok) {
        // Backend server issues - could enable logging here if needed
      }
    } catch (error) {
      // Connection issues - could enable logging here if needed
    }
  }
};

// Auto-run diagnostic in development (disabled for production)
// if (import.meta.env.DEV) {
//   setTimeout(() => {
//     runAuthDiagnostic();
//   }, 2000);
// }
