import { Injectable } from '@angular/core';
import { Observable, of, tap, BehaviorSubject, forkJoin } from 'rxjs';
import { ApiService } from './api.service';

export interface InwardSavePayload {
  inward: {
    companyId: number;
    colour: string;
    designName: string;
    styleNo: string;
    inwardDcNo: string;
    uploadURL: string;
    createdBy: number;
    poNo?: string;
  };
  sizes: {
    size: string;
    count: number;
  }[];
}

export interface MeterInwardSavePayload {
  entryType: string;
  companyId: number;
  colour: string;
  designName: string;
  styleNo: string;
  inwardDcNo: string;
  uploadURL: string;
  createdBy: number;
  poNo?: string;
  meterDetails: {
    meterValue: number;
    bitsCount: number;
    totalMeter: number;
  }[];
}

@Injectable({ providedIn: 'root' })
export class InwardService {
  private editDataSubject = new BehaviorSubject<any>(null);
  editData$ = this.editDataSubject.asObservable();
  private selectionCache = new Map<number, any[]>();

  constructor(private api: ApiService) { }

  setEditData(data: any): void {
    this.editDataSubject.next(data);
  }

  clearEditData(): void {
    this.editDataSubject.next(null);
  }

  saveInward(payload: InwardSavePayload): Observable<any> {
    return this.api.post<any>('inward/save', payload);
  }

  saveMeterInward(payload: MeterInwardSavePayload): Observable<any> {
    return this.api.post<any>('inward/save-meter-inward', payload);
  }

  /**
   * Fetch size stock based on company, colour, and style (legacy flow).
   */
  getSizes(companyId: number, colour: string, styleNo: string): Observable<any[]> {
    const params = { companyId, colour, styleNo };
    return this.api.get<any[]>('inward/sizes', params);
  }

  getInwardDetailsByDcs(companyId: number, dcNos: string[], colour?: string): Observable<any> {
    const params: any = { companyId, inwardDcNo: dcNos };
    if (colour) params.colour = colour;
    return this.api.get<any>('DcDetail/inward-details', params);
  }

  getMeters(companyId: number, colour: string, styleNo: string): Observable<any[]> {
    const params = { companyId, colour, styleNo };
    return this.api.get<any[]>('inward/meters', params);
  }

  getInwardDcs(companyId: number, styleNo?: string, designName?: string): Observable<any> {
    const params: any = {};
    if (styleNo) params.styleNo = styleNo;
    if (designName) params.designName = designName;
    return this.api.get<any>(`DcDetail/inward-dcs/${companyId}`, params);
  }

  getDesignStyleColour(companyId: number): Observable<any[]> {
    if (this.selectionCache.has(companyId)) {
      return of(this.selectionCache.get(companyId)!);
    }

    const params = { companyId };
    return this.api.get<any[]>('inward/design-style-colour', params).pipe(
      tap(data => this.selectionCache.set(companyId, data))
    );
  }

  getMasterColours(): Observable<any[]> {
    const CACHE_KEY = 'master_colours_list';
    if (this.selectionCache.has(CACHE_KEY as any)) {
      return of(this.selectionCache.get(CACHE_KEY as any)!);
    }

    return this.api.get<any[]>('Master/list/colour').pipe(
      tap(data => this.selectionCache.set(CACHE_KEY as any, data))
    );
  }

  updateInward(payload: any): Observable<any> {
    return this.api.put<any>('inward/update', payload);
  }

  clearCache(): void {
    this.selectionCache.clear();
  }
}
