import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, ThreadRequestDto } from '../models/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class ThreadService {
  private apiUrl = `${environment.apiUrl}/Thread`;

  constructor(private http: HttpClient) {}

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
