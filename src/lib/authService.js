const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/`;

export const authService = {
  async login(credentials) {
    console.log('authService.login called with:', credentials);
    try {
      const url = `${BASE_URL}auth/login/`;
      console.log('Making request to:', url);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`Login failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Success response:', data);
      return data;
    } catch (error) {
      console.error('authService error:', error);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check if the backend server is running.');
      }
      throw error;
    }
  },

  async register(userData) {
    console.log('authService.register called with:', userData);
    try {
      const url = `${BASE_URL}auth/register/`;
      console.log('Making request to:', url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`Registration failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Success response:', data);
      return data;
    } catch (error) {
      console.error('authService error:', error);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check if the backend server is running.');
      }
      throw error;
    }
  },
};