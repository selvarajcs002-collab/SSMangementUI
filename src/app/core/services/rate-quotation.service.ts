import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface RateQuotationModel {
  id: number;
  quotationNo: string;
  quotationDate: string;
  companyId: number;
  companyName: string;
  contactPerson: string;
  mobileNo: string;
  emailId: string;
  address: string;
  styleNo: string;
  designName: string;
  productType: string;
  noOfStitches: number | null;
  chenilleColors: number | null;
  normalEmbColors: number | null;
  ratePerPiece: number | null;
  ratePerMeter: number | null;
  quantity: number;
  totalAmount: number;
  remarks: string;
  status: string;
  isActive: boolean;
  createdBy: number;
  createdDate: string;
  modifiedBy: number | null;
  modifiedDate: string | null;
}

export interface RateQuotationResponse {
  success: boolean;
  message: string;
  data: RateQuotationModel[];
  errors: any;
}

@Injectable({
  providedIn: 'root'
})
export class RateQuotationService {
  constructor(private api: ApiService) { }

  getAllRateQuotations(): Observable<RateQuotationResponse> {
    return this.api.get<RateQuotationResponse>('RateQuotation/getall');
  }

  createRateQuotation(data: any): Observable<any> {
    return this.api.post<any>('RateQuotation/create', data);
  }

  getRateQuotationById(id: number): Observable<any> {
    return this.api.get<any>(`RateQuotation/getbyid/${id}`);
  }

  updateRateQuotation(id: number, data: any): Observable<any> {
    return this.api.put<any>(`RateQuotation/update/${id}`, data);
  }

  uploadImage(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<any>(`RateQuotation/upload-image/${id}`, formData);
  }

  getImageUrl(id: number): string {
    return this.api.getFullUrl(`RateQuotation/image/${id}`);
  }

  deleteImage(id: number): Observable<any> {
    return this.api.delete<any>(`RateQuotation/image/${id}`);
  }

  deleteRateQuotation(id: number): Observable<any> {
    return this.api.delete<any>(`RateQuotation/delete/${id}?modifiedBy=1`);
  }

  generatePdf(id: number): Observable<Blob> {
    return this.api.postBlob(`RateQuotation/download-pdf`, { quotationId: id });
  }
}

