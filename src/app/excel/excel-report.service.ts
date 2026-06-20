import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReportFilterRequest, ReportResponse } from './excel-report.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExcelReportService {
  private apiUrl = `${environment.apiUrl}/ExcelReport/delivery-challan`;

  constructor(private http: HttpClient) {}

  getDeliveryChallanReport(payload: ReportFilterRequest): Observable<ReportResponse> {
    return this.http.post<ReportResponse>(this.apiUrl, payload);
  }
}
