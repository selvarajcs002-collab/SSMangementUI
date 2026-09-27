import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.dev';

export interface GenerateAdvanceChallanRequest {
  advanceId: number;
  name: string;
  date: string;
  amount: number;
  remarks: string;
}

export interface AdvanceAmount {
  id?: number;
  name: string;
  date: string;
  amount: number;
  remarks: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdvanceAmountService {

  private apiUrl = `${environment.apiBaseUrl}/AdvanceAmount`;

  constructor(private http: HttpClient) { }

  getAdvances(): Observable<AdvanceAmount[]> {
    return this.http.get<AdvanceAmount[]>(this.apiUrl);
  }

  addAdvance(advance: Omit<AdvanceAmount, 'id'>): Observable<AdvanceAmount> {
    return this.http.post<AdvanceAmount>(this.apiUrl, advance);
  }

  updateAdvance(advance: AdvanceAmount): Observable<any> {
    return this.http.put(this.apiUrl, advance);
  }

  deleteAdvance(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  exportAdvanceReport(fromDate: string, toDate: string): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/Export`, { fromDate, toDate }, { responseType: 'blob' });
  }

  generateChallan(payload: GenerateAdvanceChallanRequest): Observable<HttpResponse<Blob>> {
    return this.http.post(`${this.apiUrl}/GenerateChallan`, {
      advanceId: payload.advanceId,
      name: payload.name,
      date: payload.date,
      amount: payload.amount,
      remarks: payload.remarks
    }, {
      observe: 'response',
      responseType: 'blob'
    });
  }
}
