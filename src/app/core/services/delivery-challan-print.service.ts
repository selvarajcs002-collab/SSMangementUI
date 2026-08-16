import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { ChallanData } from './outward-preview.service';

export type DcPrintMode = 'Original' | 'Reprint';
export type DcPrintStatus = 'Pending' | 'Printing' | 'Printed' | 'Failed' | 'Archived';

export interface DcPrintRequest extends ChallanData {
  printedBy: string;
  printerName?: string;
  printMode: DcPrintMode;
}

export interface DcPrintResult {
  dcNo: string;
  printerName: string;
  pdfPath: string;
  printStatus: DcPrintStatus;
  reprintCount: number;
  printedDate: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
  statusCode?: number;
}

export interface DcPrintHistory {
  printId: number;
  dcNo: string;
  printedBy: string;
  printedDate: string;
  printerName: string;
  pdfPath: string;
  printStatus: string;
  reprintCount: number;
  errorMessage?: string;
}

@Injectable({ providedIn: 'root' })
export class DeliveryChallanPrintService {
  get baseUrl(): string {
    return `${this.configService.apiBaseUrl}/DeliveryChallan`;
  }

  constructor(private http: HttpClient, private configService: AppConfigService) { }

  generateAndPrint(payload: DcPrintRequest): Observable<ApiResponse<DcPrintResult>> {
    return this.http.post<ApiResponse<DcPrintResult>>(`${this.baseUrl}/SaveAndPrintDC`, payload);
  }

  reprint(payload: DcPrintRequest): Observable<ApiResponse<DcPrintResult>> {
    return this.http.post<ApiResponse<DcPrintResult>>(`${this.baseUrl}/ReprintDC`, payload);
  }

  download(dcNo: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}/DownloadDC/${encodeURIComponent(dcNo)}`, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  generateAndDownload(payload: DcPrintRequest): Observable<HttpResponse<Blob>> {
    return this.http.post(`${this.baseUrl}/GenerateAndDownloadDC`, payload, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  getHistory(dcNo: string): Observable<ApiResponse<DcPrintHistory[]>> {
    return this.http.get<ApiResponse<DcPrintHistory[]>>(`${this.baseUrl}/GetPrintHistory/${encodeURIComponent(dcNo)}`);
  }
}
