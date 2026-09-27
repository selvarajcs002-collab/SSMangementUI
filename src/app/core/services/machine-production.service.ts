import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface MachineProductionPayload {
  employeeName: string | null;
  machineName: string | null;
  shift: string | null;
  styleName: string | null;
  designName: string | null;
  totalProduction: number | null;
  targetProduction: number | null;
  costPerPiece: number | null;
  productionCost: number | null;
  status: string | null;
  companyId: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class MachineProductionService {
  constructor(private api: ApiService) { }

  getPaginated(page: number, pageSize: number, shift: string): Observable<any> {
    return this.api.get<any>('MachineProduction/paginated-list', { page, pageSize, shift });
  }

  getByCompany(companyId: number): Observable<any> {
    return this.api.get<any>(`MachineProduction/list/${companyId}`);
  }

  add(payload: MachineProductionPayload): Observable<any> {
    return this.api.post<any>('MachineProduction/add', payload);
  }

  update(id: number | string, payload: MachineProductionPayload): Observable<any> {
    return this.api.put<any>(`MachineProduction/update/${id}`, payload);
  }

  delete(id: number | string): Observable<any> {
    return this.api.delete<any>(`MachineProduction/delete/${id}`);
  }
}
