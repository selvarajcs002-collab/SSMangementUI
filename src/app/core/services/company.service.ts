import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { CompanyRequest } from '../models/request/company-request.model';
import { CommonResponse } from '../models/response/common-response.model';

export interface CompanySummary {
  key: number;
  value: string;
  description?: string;
}

/** GST belongs to a company only when it is read from that company's record. */
export function readCompanyId(company: any): number {
  const id = Number(company?.companyId ?? company?.CompanyId ?? 0);
  return Number.isFinite(id) ? id : 0;
}

export function readCompanyGst(company: any): string {
  const value = company?.gst_No
    ?? company?.Gst_No
    ?? company?.gstNo
    ?? company?.GstNo
    ?? company?.gst_no
    ?? company?.GSTNumber
    ?? '';
  return String(value ?? '').trim();
}

@Injectable({ providedIn: 'root' })
export class CompanyService {
  constructor(private api: ApiService) { }

  getCompanies(): Observable<CompanySummary[]> {
    return this.api.get<CompanySummary[]>('company/get-company-list');
  }

  searchCompanies(query: string, limit = 25): Observable<CompanySummary[]> {
    return this.api.get<any[]>('company/search', { q: query, limit }).pipe(
      map((rows: any[]) => (rows || []).map(row => ({
        key: Number(row.companyId ?? row.CompanyId ?? row.key),
        value: row.value ?? row.Value ?? row.companyName ?? row.CompanyName ?? '',
        description: row.description ?? row.Description ?? row.gstNo ?? row.GstNo ?? ''
      })))
    );
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
