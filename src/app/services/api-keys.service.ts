import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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
}

@Injectable({
  providedIn: 'root'
})
export class ApiKeysService {
  private baseUrl = 'http://localhost:2000/analytics/api-keys'; // Adjust if needed

  constructor(private http: HttpClient) {}

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

  createApiKey(name: string, description: string, limits?: { daily: number; monthly: number }): Observable<ApiKey> {
    const body: any = { name, description };
    if (limits) {
      body.limits = limits;
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
}