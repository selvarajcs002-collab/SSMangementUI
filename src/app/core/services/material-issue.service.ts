import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { ApiResponse, MaterialIssueDto } from '../models/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class MaterialIssueService {
  get apiUrl(): string {
    return `${this.configService.apiBaseUrl}/MaterialIssue`;
  }

  constructor(private http: HttpClient, private configService: AppConfigService) { }

  getMaterialIssueList(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/list`);
  }

  saveMaterialIssue(data: MaterialIssueDto): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.apiUrl}/save`, data);
  }
}
