import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Get token from localStorage (you might want to use a service for this)
  const token = localStorage.getItem('authToken');

  // Clone the request and add the authorization header if token exists
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Handle the request
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token is invalid or expired - clear all user data
        console.warn('Authentication failed - token invalid or expired');
        // localStorage.removeItem('authToken');
        // localStorage.removeItem('userData');
        // localStorage.removeItem('user_api_keys');
        // localStorage.removeItem('apiKeyTracking');
        // localStorage.removeItem('rememberedEmail');
        // localStorage.removeItem('token');
        // Optionally redirect to login page
        // router.navigate(['/login']);
      } else if (error.status === 403) {
        console.warn('Access forbidden - insufficient permissions');
      } else if (error.status >= 500) {
        console.error('Server error:', error.message);
      }

      // Re-throw the error so components can handle it
      return throwError(() => error);
    })
  );
};