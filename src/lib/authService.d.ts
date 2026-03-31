declare module '@/lib/authService.js' {
  export const authService: {
    login: (credentials: { email: string; password: string }) => Promise<any>;
    register: (userData: {
      email: string;
      password: string;
      first_name: string;
      last_name: string;
      user_type?: string;
      phone?: string;
      password_confirm: string;
      role: string;
    }) => Promise<any>;
  };
}