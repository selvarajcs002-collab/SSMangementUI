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
    deliveryTo?: string;
    poNo?: string;
    weight?: string;
    noOfBundles?: string;
  };
  sizes?: {
    size: string;
    count: number;
  }[];
  colourBreakdowns?: any[];
}

// NEW: Meter Based Outward Payload - isolated from size-based
export interface MeterOutwardSavePayload {
  outwardId?: number;
  mode?: string;
  entryType: 'M';
  companyId: number;
  colour: string;
  designName: string;
  styleNo: string;
  uploadURL: string;
  createdBy: string;
  status: string;
  remarks: string;
  outwardDate: string;
  deliveryTo?: string;
  poNo?: string;
  weight?: string;
  noOfBundles?: string;
  meterDetails: {
    meterPerBit: number;
    bitsCount: number;
    piecesCount: number;
    totalMeter: number;
  }[];
}

@Injectable({ providedIn: 'root' })
export class OutwardService {
  private editDataSubject = new BehaviorSubject<any>(null);
  editData$ = this.editDataSubject.asObservable();

  constructor(private api: ApiService) { }

  saveOutward(payload: OutwardSaveRequest): Observable<any> {
    return this.api.post<any>('outward/save-outward', payload);
  }

  // NEW: Save Meter Based Outward - does not affect existing saveOutward
  saveMeterOutward(payload: MeterOutwardSavePayload): Observable<any> {
    return this.api.post<any>('outward/save-meter-outward', payload);
  }

  updateOutward(payload: any): Observable<any> {
    return this.api.post<any>('outward/outward-update', payload);
  }

  getOutwardByDcNo(id: number, mode: string): Observable<any> {
    const params = { id, mode };
    return this.api.get<any>('outward/outward_get_by_dcno', params).pipe(
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
