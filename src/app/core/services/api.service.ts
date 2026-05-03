import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  private getFullUrl(url: string): string {
    if (url.startsWith('http') || url.startsWith('assets/')) {
      return url;
    }
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return `${environment.apiUrl}/${cleanUrl}`;
  }

  get<T>(url: string, params?: any): Observable<T> {
    return this.http.get<T>(this.getFullUrl(url), { params });
  }

  getWithResponse<T>(url: string, params?: any): Observable<HttpResponse<T>> {
    return this.http.get<T>(this.getFullUrl(url), {
      params,
      observe: 'response'
    });
  }

  post<T>(url: string, data: unknown): Observable<T> {
    return this.http.post<T>(this.getFullUrl(url), data);
  }

  put<T>(url: string, data: unknown): Observable<T> {
    return this.http.put<T>(this.getFullUrl(url), data);
  }
}
