import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, InventoryEntryDto, StockAdjustmentDto } from '../models/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiUrl = `${environment.apiUrl}/Inventory`;
  private adjUrl = `${environment.apiUrl}/StockAdjustment`;

  constructor(private http: HttpClient) {}

  getInventoryList(page: number = 1, pageSize: number = 20, search: string = '', category: string = ''): Observable<ApiResponse<any[]>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('search', search)
      .set('category', category);

    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/list`, { params });
  }

  getInventoryById(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  getLowStockItems(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/low-stock`);
  }

  saveInventory(data: InventoryEntryDto): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.apiUrl}/save`, data);
  }

  updateInventory(data: InventoryEntryDto): Observable<ApiResponse<number>> {
    return this.http.put<ApiResponse<number>>(`${this.apiUrl}/update`, data);
  }

  deleteInventory(id: number, user: string): Observable<ApiResponse<number>> {
    return this.http.delete<ApiResponse<number>>(`${this.apiUrl}/${id}?user=${encodeURIComponent(user)}`);
  }

  saveStockAdjustment(data: StockAdjustmentDto): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.adjUrl}/save`, data);
  }
}
