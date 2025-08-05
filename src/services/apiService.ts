import { API_CONFIG, ApiError, ApiRequestOptions } from '../config/api';
import { ApiResponse } from '../types';

// Database connectivity error class
export class DatabaseConnectionError extends Error {
  public readonly isDatabaseError = true;
  public readonly status?: number;
  public readonly originalError?: Error;

  constructor(message: string, status?: number, originalError?: Error) {
    super(message);
    this.name = 'DatabaseConnectionError';
    this.status = status;
    this.originalError = originalError;
  }
}

// Helper function to detect database connectivity issues
function isDatabaseConnectivityError(error: any): boolean {
  // Network errors (fetch failed)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  // Connection refused, timeout, etc.
  if (error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('ETIMEDOUT') ||
      error.message?.includes('ENOTFOUND') ||
      error.message?.includes('Network request failed')) {
    return true;
  }

  // 5xx server errors that might indicate database issues
  if (error instanceof ApiError && error.status && error.status >= 500) {
    // Check if error message indicates database issues
    const dbErrorKeywords = [
      'database', 'connection', 'pool', 'timeout',
      'ECONNREFUSED', 'ETIMEDOUT', 'server error'
    ];
    const errorText = (error.message || '').toLowerCase();
    return dbErrorKeywords.some(keyword => errorText.includes(keyword));
  }

  return false;
}

// Interceptor types
type RequestInterceptor = (config: RequestInit & { url?: string }) => RequestInit & { url?: string };
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;
type ErrorInterceptor = (error: any) => any;

class ApiService {
  private baseURL: string;
  private defaultTimeout: number;
  private defaultRetries: number;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  // Interceptors object to mimic axios API
  public interceptors = {
    request: {
      use: (interceptor: RequestInterceptor) => {
        this.requestInterceptors.push(interceptor);
        return this.requestInterceptors.length - 1; // Return index for removal
      },
      eject: (index: number) => {
        this.requestInterceptors.splice(index, 1);
      }
    },
    response: {
      use: (
        responseInterceptor: ResponseInterceptor,
        errorInterceptor?: ErrorInterceptor
      ) => {
        this.responseInterceptors.push(responseInterceptor);
        if (errorInterceptor) {
          this.errorInterceptors.push(errorInterceptor);
        }
        return this.responseInterceptors.length - 1;
      },
      eject: (index: number) => {
        this.responseInterceptors.splice(index, 1);
        this.errorInterceptors.splice(index, 1);
      }
    }
  };

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.defaultTimeout = API_CONFIG.TIMEOUT;
    this.defaultRetries = API_CONFIG.RETRY_ATTEMPTS;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
    } = options;

    const url = `${this.baseURL}${endpoint}`;
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    let requestOptions: RequestInit & { url?: string } = {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      url,
    };

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      try {
        requestOptions = interceptor(requestOptions);
      } catch (error) {
        console.warn('Request interceptor error:', error);
      }
    }

    // Log request for debugging
    if (import.meta.env.DEV) {
      console.log(`API Request: ${method} ${url}`, {
        headers: requestHeaders,
        body: body || null,
      });
    }

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        let response = await this.fetchWithTimeout(url, requestOptions, timeout);

        // Apply response interceptors
        for (const interceptor of this.responseInterceptors) {
          try {
            response = await interceptor(response);
          } catch (error) {
            console.warn('Response interceptor error:', error);
          }
        }

        // Log response for debugging
        if (import.meta.env.DEV) {
          console.log(`API Response: ${response.status} ${response.statusText}`, {
            url,
            status: response.status,
          });
        }

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          let errorDetails: any = null;

          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
            errorDetails = errorData;
          } catch {
            // If response is not JSON, use status text
          }

          const apiError = new ApiError(errorMessage, response.status, undefined, errorDetails);

          // Handle authentication and authorization errors
          if (response.status === 401 || response.status === 403) {
            // Check if we're in a browser environment
            if (typeof window !== 'undefined') {
              // Clear any stored auth data
              localStorage.removeItem('dashboard_auth_token');
              localStorage.removeItem('dashboard_user');
              
              // Only redirect if not already on login page
              if (!window.location.pathname.includes('/login')) {
                console.warn(`Authentication/Authorization failed (${response.status}): ${errorMessage}`);
                window.location.href = '/login';
              }
            }
            // Always throw the error instead of returning empty object
            throw apiError;
          }

          // Apply error interceptors
          for (const errorInterceptor of this.errorInterceptors) {
            try {
              const result = errorInterceptor(apiError);
              if (result) {
                throw result;
              }
            } catch (interceptorError) {
              throw interceptorError;
            }
          }

          throw apiError;
        }

        // Handle 204 No Content responses (common for DELETE operations)
        if (response.status === 204) {
          return {} as T;
        }

        // For other successful responses, parse JSON if there's content
        try {
          const data = await response.json();
          return data;
        } catch (error) {
          // If response cannot be parsed as JSON (e.g., empty body),
          // return an empty object instead of throwing an error
          console.warn('Response could not be parsed as JSON:', error);
          return {} as T;
        }
      } catch (error) {
        lastError = error as Error;

        // Check if this is a database connectivity error
        if (isDatabaseConnectivityError(error)) {
          const dbError = new DatabaseConnectionError(
            'Unable to connect to the database. Please check your connection and try again.',
            error instanceof ApiError ? error.status : undefined,
            error as Error
          );

          // If it's the last attempt, throw the database error
          if (attempt === retries) {
            throw dbError;
          }

          // Continue retrying for database errors
        } else {
          // Don't retry on client errors (4xx) or if it's the last attempt
          if (
            error instanceof ApiError &&
            error.status &&
            error.status >= 400 &&
            error.status < 500
          ) {
            throw error;
          }

          if (attempt === retries) {
            throw error;
          }
        }

        // Wait before retrying with exponential backoff
        const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, attempt);
        await this.sleep(delay);

        if (process.env.NODE_ENV === 'development') {
          console.log(`API Retry attempt ${attempt + 1}/${retries} after ${delay}ms`);
        }
      }
    }

    throw lastError!;
  }

  // Generic CRUD methods
  async get<T>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    body?: any,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T>(
    endpoint: string,
    body?: any,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async patch<T>(
    endpoint: string,
    body?: any,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete<T>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async postFormData<T>(
    endpoint: string,
    formData: FormData,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<T> {
    // For FormData, we need to handle headers differently
    const { headers = {}, ...restOptions } = options || {};
    
    // Don't set Content-Type header for FormData - browser will set it with boundary
    // Remove any Content-Type that might be set
    const { 'Content-Type': _, ...headersWithoutContentType } = headers as Record<string, string>;
    
    return this.makeRequest<T>(endpoint, {
      ...restOptions,
      method: 'POST',
      body: formData,
      headers: headersWithoutContentType
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;