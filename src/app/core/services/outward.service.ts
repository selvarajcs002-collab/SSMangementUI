import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { ApiService } from './api.service';

export interface OutwardSaveRequest {
  outward: {
    outwardId: number;
    mode: string;
    companyId: number;
    colour: string;
    designName: string;
    styleNo: string;
    uploadURL: string;
    createdBy: string;
    status: string;
  };
  sizes: {
    size: string;
    count: number;
  }[];
}

@Injectable({ providedIn: 'root' })
export class OutwardService {
  private editDataSubject = new BehaviorSubject<any>(null);
  editData$ = this.editDataSubject.asObservable();

  constructor(private api: ApiService) { }

  saveOutward(payload: OutwardSaveRequest): Observable<any> {
    return this.api.post<any>('save-outward', payload);
  }

  updateOutward(payload: any): Observable<any> {
    return this.api.post<any>('outward-update', payload);
  }

  getOutwardByDcNo(id: number, mode: string): Observable<any> {
    const params = { id, mode };
    return this.api.get<any>('outward_get_by_dcno', params).pipe(
      tap(data => this.setEditData(data))
    );
  }

  setEditData(data: any): void {
    this.editDataSubject.next(data);
  }

  clearEditData(): void {
    this.editDataSubject.next(null);
  }
}
