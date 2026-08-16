import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

export interface ActivityLogRequest {
  module: string;
  viewType: string;
  fromDate: string | null;
  toDate: string | null;
  companyId: number | null;
  styleNo: string | null;
  designName: string | null;
  pageNumber: number;
  pageSize: number;
  sortColumn: string;
  sortDirection: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityLogService {

  constructor(private apiService: ApiService) { }

  getActivityLogs(payload: ActivityLogRequest): Observable<any> {
    return this.apiService.post<any>('ActivityLog/get-logs', payload);
  }

  advancedFilter(payload: ActivityLogRequest): Observable<any> {
    return this.apiService.post<any>('ActivityLog/advanced-filter', payload);
  }
}
