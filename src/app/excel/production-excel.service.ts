import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { saveAs } from 'file-saver';
import { AppConfigService } from '../core/services/app-config.service';

@Injectable({
  providedIn: 'root'
})
export class ProductionExcelService {

  constructor(
    private http: HttpClient,
    private configService: AppConfigService
  ) {}

  public async generateAndDownload(fromDate: string, toDate: string): Promise<void> {
    const url = `${this.configService.apiBaseUrl}/MachineProduction/export`;
    // Format dates to ISO format matching the user's curl request
    let parsedFromDate = new Date(fromDate);
    parsedFromDate.setHours(0, 0, 0, 0);
    
    let parsedToDate = new Date(toDate);
    parsedToDate.setHours(23, 59, 59, 999);

    const payload = {
      fromDate: parsedFromDate.toISOString(),
      toDate: parsedToDate.toISOString()
    };

    return new Promise((resolve, reject) => {
      this.http.post(url, payload, { responseType: 'blob', observe: 'response' }).subscribe({
        next: (response: any) => {
          let fileName = "Production_Log_Report__to_.xlsx";
          
          const contentDisposition = response.headers.get('content-disposition');
          if (contentDisposition) {
            const matches = /filename="([^"]+)"/.exec(contentDisposition);
            if (matches != null && matches[1]) fileName = matches[1];
          }

          const blob = response.body;
          if (blob) {
            saveAs(blob, fileName.replace(/"/g, ''));
            resolve();
          } else {
            reject(new Error('Response body was empty.'));
          }
        },
        error: (err) => {
          console.error('Error generating Excel from backend:', err);
          reject(err);
        }
      });
    });
  }
}
