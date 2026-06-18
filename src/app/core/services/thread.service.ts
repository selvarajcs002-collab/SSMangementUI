import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { ApiResponse, ThreadRequestDto } from '../models/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class ThreadService {
  get apiUrl(): string {
    return `${this.configService.apiBaseUrl}/Thread`;
  }

  constructor(private http: HttpClient, private configService: AppConfigService) { }

  getThreads(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/list`);
  }

  getThreadById(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  saveThread(thread: ThreadRequestDto): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.apiUrl}/save`, thread);
  }

  updateThread(thread: ThreadRequestDto): Observable<ApiResponse<number>> {
    return this.http.put<ApiResponse<number>>(`${this.apiUrl}/update`, thread);
  }

  deleteThread(id: number, user: string): Observable<ApiResponse<number>> {
    return this.http.delete<ApiResponse<number>>(`${this.apiUrl}/${id}?user=${encodeURIComponent(user)}`);
  }
}
