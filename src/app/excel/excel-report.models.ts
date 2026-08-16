export interface ReportFilterRequest {
  fromDate?: string | null;
  toDate?: string | null;
  mode?: string;
  type?: string;
  companyId?: number | null;
  styleNo?: string | null;
  designName?: string | null;
}

export interface ReportSummary {
  totalRecords: number;
  totalBitsCount: number;
  totalMeter: number;
}

export interface ReportDataRow {
  sno: number;
  dcNo: string;
  date: string; // e.g., dd-MM-yyyy
  styleNo: string;
  designName: string;
  colour: string;
  totalBits: number;
  totalMeter: number;
  dynamicValues: { [key: string]: number | string };
}

export interface ReportResponse {
  summary: ReportSummary;
  dynamicColumns: string[];
  data: ReportDataRow[];
}

export interface StockManagementReport {
  summary: any;
  stockBalances: any[];
  transactions: any[];
  fromDate: string;
  toDate: string;
  companyName: string;
  branch: string;
}
