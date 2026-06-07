import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, MaterialReturnDto } from '../models/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class MaterialReturnService {
  private apiUrl = `${environment.apiUrl}/MaterialReturn`;

  constructor(private http: HttpClient) {}

  saveMaterialReturn(data: MaterialReturnDto): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.apiUrl}/save`, data);
  }
}
