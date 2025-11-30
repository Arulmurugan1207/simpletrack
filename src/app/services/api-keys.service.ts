import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ApiKey {
  _id?: string;
  apiKey: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  limits?: {
    daily: number;
    monthly: number;
  };
  allowedDomains?: string[];
  userId?: string;
}

export interface ApiKeysResponse {
  apiKeys: ApiKey[];
  summary: {
    totalKeys: number;
    activeKeys: number;
    archivedKeys: number;
    keysCreatedThisMonth: number;
    totalKeysCreated: number;
  };
}

export interface ApiKeyUsage {
  apiKey: string;
  limits: { daily: number; monthly: number };
  usage: {
    daily: number;
    weekly: number;
    monthly: number;
    total: number;
  };
  lastUsed?: Date;
  allowedDomains?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiKeysService {
  private baseUrl = `${environment.apiUrl}/api-keys`; // Use environment variable
  private selectedEnvironment: 'development' | 'production' = 'production';
  private selectedApiKey: string | null = null;

  constructor(private http: HttpClient) {
    // Load selected API key from localStorage on init
    const stored = localStorage.getItem('selectedApiKey');
    this.selectedApiKey = stored || null;
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found. Please log in first.');
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  createApiKey(name: string, description: string, limits?: { daily: number; monthly: number }, allowedDomains?: string[]): Observable<ApiKey> {
    const body: any = { name, description };
    if (limits) {
      body.limits = limits;
    }
    if (allowedDomains && allowedDomains.length > 0) {
      body.allowedDomains = allowedDomains;
    }
    return this.http.post<ApiKey>(this.baseUrl, body, { headers: this.getHeaders() });
  }

  getApiKeys(): Observable<ApiKeysResponse> {
    return this.http.get<ApiKeysResponse>(this.baseUrl, { headers: this.getHeaders() });
  }

  updateApiKey(apiKey: string, updates: Partial<ApiKey>): Observable<ApiKey> {
    return this.http.put<ApiKey>(`${this.baseUrl}/${apiKey}`, updates, { headers: this.getHeaders() });
  }

  archiveApiKey(apiKey: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/${apiKey}/archive`, {}, { headers: this.getHeaders() });
  }

  getApiKeyUsage(apiKey: string): Observable<ApiKeyUsage> {
    return this.http.get<ApiKeyUsage>(`${this.baseUrl}/${apiKey}/usage`, { headers: this.getHeaders() });
  }

  // Environment management methods
  setSelectedEnvironment(environment: 'development' | 'production'): void {
    this.selectedEnvironment = environment;
  }

  getSelectedEnvironment(): 'development' | 'production' {
    return this.selectedEnvironment;
  }

  // API Key selection methods
  setSelectedApiKey(apiKey: string | null): void {
    this.selectedApiKey = apiKey;
    if (apiKey) {
      localStorage.setItem('selectedApiKey', apiKey);
    } else {
      localStorage.removeItem('selectedApiKey');
    }
  }

  getSelectedApiKey(): string | null {
    return this.selectedApiKey;
  }
}