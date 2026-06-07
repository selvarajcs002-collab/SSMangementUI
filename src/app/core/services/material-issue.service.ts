import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, MaterialIssueDto } from '../models/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class MaterialIssueService {
  private apiUrl = `${environment.apiUrl}/MaterialIssue`;

  constructor(private http: HttpClient) {}

  getMaterialIssueList(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/list`);
  }

  saveMaterialIssue(data: MaterialIssueDto): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.apiUrl}/save`, data);
  }
}
