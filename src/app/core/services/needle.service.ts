import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, NeedleRequestDto } from '../models/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class NeedleService {
  private apiUrl = `${environment.apiUrl}/Needle`;

  constructor(private http: HttpClient) {}

  getNeedles(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/list`);
  }

  getNeedleById(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  saveNeedle(needle: NeedleRequestDto): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.apiUrl}/save`, needle);
  }

  updateNeedle(needle: NeedleRequestDto): Observable<ApiResponse<number>> {
    return this.http.put<ApiResponse<number>>(`${this.apiUrl}/update`, needle);
  }

  deleteNeedle(id: number, user: string): Observable<ApiResponse<number>> {
    return this.http.delete<ApiResponse<number>>(`${this.apiUrl}/${id}?user=${encodeURIComponent(user)}`);
  }
}
