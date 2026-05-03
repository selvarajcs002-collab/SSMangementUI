export interface CompanyRequest {
  mode: 'INSERT' | 'UPDATE';
  companyId?: number;
  companyName: string;
  gst_No: string;
  phoneNumber: string;
  door_No: string;
  street_Name: string;
  landmark?: string;
  city: string;
  pincode: string;
}
