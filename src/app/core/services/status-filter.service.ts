import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StatusFilterRequest {
  fromDate: string | null;
  toDate: string | null;
  companyId: number | null;
  styleId: string | null;
  designId: string | null;
  transactionType: string;
  viewType: string;
  pageNumber?: number;
  pageSize?: number;
  sortColumn?: string;
  sortDirection?: string;
}

export interface StatusFilterResponse {
  success: boolean;
  message: string;
  totalRecords: number;
  data: any[];
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
  summary?: any;
}

@Injectable({
  providedIn: 'root'
})
export class StatusFilterService {
  private apiUrl = `${environment.apiUrl}/StatusFilter`;

  constructor(private http: HttpClient) { }

  search(payload: StatusFilterRequest): Observable<StatusFilterResponse> {
    return this.http.post<StatusFilterResponse>(`${this.apiUrl}/search`, payload);
  }
}
