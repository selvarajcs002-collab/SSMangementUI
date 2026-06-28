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
    return `${this.configService.apiBaseUrl}/ExcelReport/delivery-challan`;
  }

  constructor(private http: HttpClient, private configService: AppConfigService) {
  }

// duplicate constructor removed

  getDeliveryChallanReport(payload: ReportFilterRequest): Observable<ReportResponse> {
    return this.http.post<ReportResponse>(this.apiUrl, payload);
  }
}
