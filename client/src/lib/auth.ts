import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export class AuthService {
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    const result = await response.json();
    return result.user;
  }

  async register(credentials: RegisterCredentials): Promise<User> {
    const response = await apiRequest("POST", "/api/auth/register", credentials);
    const result = await response.json();
    return result.user;
  }

  async logout(): Promise<void> {
    await apiRequest("POST", "/api/auth/logout");
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await fetch("/api/auth/me", { 
        credentials: "omit" 
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.user;
      }
      
      return null;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    // Check if auth token exists in cookies
    return document.cookie.includes("auth-token=");
  }

  getAuthHeader(): Record<string, string> {
    // For cookie-based auth, no additional headers needed
    return {};
  }
}

export const authService = new AuthService();
