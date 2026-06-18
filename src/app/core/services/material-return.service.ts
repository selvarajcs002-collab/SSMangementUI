import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { ApiResponse, MaterialReturnDto } from '../models/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class MaterialReturnService {
  get apiUrl(): string {
    return `${this.configService.apiBaseUrl}/MaterialReturn`;
  }

  constructor(private http: HttpClient, private configService: AppConfigService) { }

  saveMaterialReturn(data: MaterialReturnDto): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.apiUrl}/save`, data);
  }
}
