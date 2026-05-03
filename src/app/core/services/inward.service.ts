import { Injectable } from '@angular/core';
import { Observable, of, tap, BehaviorSubject } from 'rxjs';
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
  };
  sizes: {
    size: string;
    count: number;
  }[];
}

@Injectable({ providedIn: 'root' })
export class InwardService {
  private editDataSubject = new BehaviorSubject<any>(null);
  editData$ = this.editDataSubject.asObservable();
  private selectionCache = new Map<number, any[]>();

  constructor(private api: ApiService) {}

  setEditData(data: any): void {
    this.editDataSubject.next(data);
  }

  clearEditData(): void {
    this.editDataSubject.next(null);
  }

  saveInward(payload: InwardSavePayload): Observable<any> {
    return this.api.post<any>('inward/save', payload);
  }

  getSizes(companyId: number, colour: string, styleNo: string): Observable<any[]> {
    const params = { companyId, colour, styleNo };
    return this.api.get<any[]>('inward/sizes', params);
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

  updateInward(payload: any): Observable<any> {
    return this.api.put<any>('inward/update', payload);
  }

  clearCache(): void {
    this.selectionCache.clear();
  }
}
