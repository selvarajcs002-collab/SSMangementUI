import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { ApiResponse, FoamRequestDto } from '../models/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class FoamService {
  get apiUrl(): string {
    return `${this.configService.apiBaseUrl}/Foam`;
  }

  constructor(private http: HttpClient, private configService: AppConfigService) { }

  getFoams(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/list`);
  }

  getFoamById(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  saveFoam(foam: FoamRequestDto): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.apiUrl}/save`, foam);
  }

  updateFoam(foam: FoamRequestDto): Observable<ApiResponse<number>> {
    return this.http.put<ApiResponse<number>>(`${this.apiUrl}/update`, foam);
  }

  deleteFoam(id: number, user: string): Observable<ApiResponse<number>> {
    return this.http.delete<ApiResponse<number>>(`${this.apiUrl}/${id}?user=${encodeURIComponent(user)}`);
  }
}
