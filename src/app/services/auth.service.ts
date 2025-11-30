import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface SignupRequest {
  firstname: string;
  lastname: string;
  email: string;
  mobileno: string;
  password: string;
}

export interface SigninRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  status: number;
  message: string;
  user: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    mobileno: string;
    createdDate: string;
    token: string;
  };
}

export interface ApiError {
  message: string;
  status: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Sign up a new user
   */
  signup(userData: SignupRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/users/signup`, userData).pipe(
      tap(response => {
        console.log('Signup response:', response);
        // Store the JWT token and user data with expiration
        if (response && response.user && response.user.token) {
          const expirationTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now
          localStorage.setItem('authToken', response.user.token);
          localStorage.setItem('userData', JSON.stringify({
            user: response.user,
            expiresAt: expirationTime
          }));
        } else {
          console.warn('Signup response missing user.token:', response);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Sign in an existing user
   */
  signin(credentials: SigninRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/users/signin`, credentials).pipe(
      tap(response => {
        console.log('Signin response:', response);
        // Store the JWT token and user data with expiration
        if (response && response.user && response.user.token) {
          const expirationTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now
          localStorage.setItem('authToken', response.user.token);
          localStorage.setItem('userData', JSON.stringify({
            user: response.user,
            expiresAt: expirationTime
          }));
        } else {
          console.warn('Signin response missing user.token:', response);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Sign out the current user
   */
  signout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('user_api_keys');
    localStorage.removeItem('apiKeyTracking');
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('token');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');

    if (!token || !userData) {
      return false;
    }

    try {
      const parsed = JSON.parse(userData);
      // Check if data has expired
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        console.log('isAuthenticated: Token expired, clearing data...');
        this.signout(); // Clear expired data
        return false;
      }
      return true;
    } catch (error) {
      console.error('isAuthenticated: Error parsing user data:', error);
      this.signout(); // Clear corrupted data
      return false;
    }
  }

  /**
   * Get stored user data
   */
  getUserData(): any {
    const userData = localStorage.getItem('userData');

    if (!userData) {
      return null;
    }

    try {
      const parsed = JSON.parse(userData);

      // Check if data has expired
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        this.signout(); // Clear expired data
        return null;
      }

      return parsed.user;
    } catch (error) {
      this.signout(); // Clear corrupted data
      return null;
    }
  }

  /**
   * Get stored auth token
   */
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = error.error.message;
    } else {
      // Backend returned an unsuccessful response code
      if (error.error && typeof error.error === 'object' && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }

    console.error('Auth API Error:', errorMessage);
    return throwError(() => ({ message: errorMessage, status: error.status }));
  }
}