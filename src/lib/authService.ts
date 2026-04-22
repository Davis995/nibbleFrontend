const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/`;

interface LoginCredentials {
  email: string;
  password: string;
}

interface SchoolLoginCredentials {
  school_email: string;
  student_code: string;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  [key: string]: any;
}

export const authService = {
  async login(credentials: LoginCredentials) {
    console.log('authService.login called with:', credentials);
    try {
      const url = `${BASE_URL}auth/login/`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 400 || response.status === 401) {
          throw new Error("Invalid email or password. Please try again.");
        }
        if (response.status === 403) {
          throw new Error("Your account is currently disabled. Please contact support.");
        }
        if (response.status >= 500) {
          throw new Error("Server error. Please try again later.");
        }
        throw new Error("An unexpected error occurred during login.");
      }

      return await response.json();
    } catch (error) {
      console.error('authService error:', error);
      throw error;
    }
  },

  async register(userData: RegisterData) {
    console.log('authService.register called with:', userData);
    try {
      const url = `${BASE_URL}auth/register/`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.email) {
          throw new Error("Email already registered. Try logging in.");
        }
        if (response.status === 400) {
          throw new Error("Invalid registration details. Please check your inputs.");
        }
        if (response.status >= 500) {
          throw new Error("Server error. Please try again later.");
        }
        throw new Error(errorData.error || "An unexpected error occurred during registration.");
      }

      return await response.json();
    } catch (error) {
      console.error('authService error:', error);
      throw error;
    }
  },

  async schoolLogin(credentials: SchoolLoginCredentials) {
    console.log('authService.schoolLogin called with:', credentials);
    try {
      const url = `${BASE_URL}auth/school-login/`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400 || response.status === 401) {
          throw new Error("Invalid school email or student code.");
        }
        if (response.status === 404) {
          throw new Error("School not found or inactive.");
        }
        throw new Error(errorData.error || "Could not complete school login.");
      }

      return await response.json();
    } catch (error) {
      console.error('authService schoolLogin error:', error);
      throw error;
    }
  },
};