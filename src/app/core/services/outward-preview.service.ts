import { Injectable } from '@angular/core';

export interface ChallanSize {
  label: string;
  qty: number;
}

export interface ChallanItem {
  designName: string;
  styleNo: string;
  colour: string;
  sizes: ChallanSize[];
  count: number;
}

export interface ChallanCompany {
  name: string;
  address: string;
  gst: string;
  logo: string | null;
  phone?: string;
}

export interface ChallanData {
  company: ChallanCompany;
  date: string;
  dcNo: string;
  receiverName: string;
  receiverAddress: string;
  items: ChallanItem[];
  totalQty: number;
  remarks?: string;
  entryType?: 'S' | 'M';
  meterDetails?: {
    meterPerBit: number;
    bitsCount: number;
    piecesCount: number;
    totalMeter: number;
  }[];
  totalMeterSum?: number;
  totalPiecesSum?: number;
  deliveryTo?: string;
  poNo?: string;
  weight?: string;
  noOfBundles?: string;
}

@Injectable({ providedIn: 'root' })
export class OutwardPreviewService {
  private outwardData: ChallanData | null = null;

  setPreviewData(data: ChallanData): void {
    this.outwardData = data;
  }

  getPreviewData(): ChallanData | null {
    return this.outwardData;
  }

  clearPreviewData(): void {
    this.outwardData = null;
  }
}
