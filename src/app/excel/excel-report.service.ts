import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReportFilterRequest, ReportResponse } from './excel-report.models';
import { AppConfigService } from '../core/services/app-config.service';

@Injectable({
  providedIn: 'root'
})
export class ExcelReportService {
  get apiUrl(): string {
    return `${this.configService.apiBaseUrl}/ExcelReport`;
  }

  constructor(private http: HttpClient, private configService: AppConfigService) {
  }

  getDeliveryChallanReport(payload: ReportFilterRequest): Observable<ReportResponse> {
    return this.http.post<ReportResponse>(`${this.apiUrl}/delivery-challan`, payload);
  }

  getStockManagementReport(filters: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/stock-management`, filters);
  }
}
