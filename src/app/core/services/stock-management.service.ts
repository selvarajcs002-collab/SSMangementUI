import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface StockSummary {
  totalInwardQty: number;
  totalInwardPercent: number;
  totalOutwardQty: number;
  totalOutwardPercent: number;
  availableStock: number;
  availableStockPercent: number;
  todaysInward: number;
  todaysInwardPercent: number;
  todaysOutward: number;
  todaysOutwardPercent: number;
  lowStockItems: number;
}

export interface StockBalanceSizeWise {
  size: string;
  totalInward: number;
  totalOutward: number;
  available: number;
  difference: number;
}

export interface LastTransaction {
  id: number;
  date: string;
  type: 'INWARD' | 'OUTWARD';
  dcNo: string;
  companyName: string;
  styleNo: string;
  designName: string;
  color: string;
  inwardQty: number | null;
  outwardQty: number | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class StockManagementService {
  private baseRoute = 'StockManagement';

  constructor(private api: ApiService) { }

  private formatFilters(filters: any) {
    const payload: any = { ...filters };
    if (payload.companyId === 'All') payload.companyId = null;
    if (payload.styleNo === 'All') payload.styleNo = null;
    if (payload.designName === 'All') payload.designName = null;
    if (payload.colour === 'All') payload.colour = null;
    
    // Map Angular state properties to C# API properties
    payload.deliveryChallanBased = payload.isDcBased || false;
    payload.deliveryChallanNumbers = payload.deliveryChallans || [];
    
    return payload;
  }

  getSummary(filters: any): Observable<StockSummary> {
    const payload = this.formatFilters(filters);
    return this.api.post<ApiResponse<StockSummary>>(`${this.baseRoute}/summary`, payload)
      .pipe(map(res => res.data));
  }

  getStockBalance(filters: any): Observable<StockBalanceSizeWise[]> {
    const payload = this.formatFilters(filters);
    return this.api.post<ApiResponse<StockBalanceSizeWise[]>>(`${this.baseRoute}/balance`, payload)
      .pipe(map(res => res.data));
  }

  getLastTransactions(filters: any): Observable<LastTransaction[]> {
    const payload = this.formatFilters(filters);
    return this.api.post<ApiResponse<LastTransaction[]>>(`${this.baseRoute}/transactions`, payload)
      .pipe(map(res => res.data));
  }

  getStyles(companyId: number): Observable<any[]> {
    return this.api.get<ApiResponse<any[]>>(`${this.baseRoute}/styles`, { companyId })
      .pipe(map(res => res.data));
  }

  getDesigns(companyId: number, styleNo: string): Observable<any[]> {
    return this.api.get<ApiResponse<any[]>>(`${this.baseRoute}/designs`, { companyId, styleNo })
      .pipe(map(res => res.data));
  }

  getColours(companyId: number, styleNo: string, designNo: string): Observable<any[]> {
    return this.api.get<ApiResponse<any[]>>(`${this.baseRoute}/colours`, { companyId, styleNo, designNo })
      .pipe(map(res => res.data));
  }

  getDeliveryChallans(companyId: number, styleNo: string, designNo: string, colour: string): Observable<any[]> {
    return this.api.get<ApiResponse<any[]>>(`${this.baseRoute}/deliverychallans`, { companyId, styleNo, designNo, colour })
      .pipe(map(res => res.data));
  }
}

