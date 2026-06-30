import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { AppConfig } from '../models/app-config.model';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private config: AppConfig | null = null;

  constructor(private http: HttpClient) {}

  public async loadConfig(): Promise<void> {
    try {
      const cacheBuster = `?t=${new Date().getTime()}`;
      this.config = await firstValueFrom(
        this.http.get<AppConfig>(`/assets/appsettings.json${cacheBuster}`).pipe(
          catchError((error: HttpErrorResponse) => {
            console.error('Network or server error while loading appsettings.json', error);
            return throwError(() => new Error(`Failed to load appsettings.json: ${error.message}`));
          })
        )
      );

      if (!this.config) {
        throw new Error('Configuration file is missing or empty.');
      }

      if (!this.config.api || !this.config.api.baseUrl) {
        throw new Error('Configuration file is invalid. Missing required "api.baseUrl" property.');
      }

      console.log('Runtime configuration loaded successfully.');
    } catch (error) {
      console.error('Configuration loading failed. Application cannot start.', error);
      throw error;
    }
  }

  public get apiBaseUrl(): string {
    if (!this.config || !this.config.api) {
      throw new Error('Configuration not loaded or missing "api.baseUrl".');
    }
    return this.config.api.baseUrl;
  }

  public get reportBaseUrl(): string {
    if (!this.config || !this.config.report) {
      console.warn('Configuration missing "report.baseUrl". Using default or empty string.');
      return '';
    }
    return this.config.report.baseUrl;
  }

  public get signalRUrl(): string {
    if (!this.config || !this.config.signalR) {
      console.warn('Configuration missing "signalR.baseUrl". Using default or empty string.');
      return '';
    }
    return this.config.signalR.baseUrl;
  }

  public get defaultQuotationSettings(): any {
    if (!this.config || !this.config.defaultQuotationSettings) {
      console.warn('Configuration missing "defaultQuotationSettings". Using fallback values.');
      return {
        companyId: 123,
        contactPerson: "John Doe",
        mobileNo: "+1234567890",
        emailId: "john.doe@acmecorp.com",
        address: "123 Main St, Springfield",
        productType: "Fabric",
        quantity: 100,
        status: "Draft",
        createdBy: 1
      };
    }
    return this.config.defaultQuotationSettings;
  }
}
