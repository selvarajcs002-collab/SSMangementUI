import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CompanyRequest } from '../models/request/company-request.model';
import { CommonResponse } from '../models/response/common-response.model';

export interface CompanySummary {
  key: number;
  value: string;
}

@Injectable({ providedIn: 'root' })
export class CompanyService {
  constructor(private api: ApiService) { }

  getCompanies(): Observable<CompanySummary[]> {
    return this.api.get<CompanySummary[]>('company/get-company-list');
  }

  getCompanyById(id: number): Observable<any> { // Modified for generic retrieval
    return this.api.get<any>(`company/get-company-by-id/${id}`);
  }

  saveCompany(data: CompanyRequest): Observable<CommonResponse> {
    return this.api.post<CommonResponse>(
      'company/save-company',
      data
    );
  }

  updateCompany(data: CompanyRequest): Observable<CommonResponse> {
    return this.api.put<CommonResponse>(
      'company/update-company',
      data
    );
  }
}
