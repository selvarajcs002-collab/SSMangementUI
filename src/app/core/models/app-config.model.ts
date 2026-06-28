export interface AppConfig {
  api: {
    baseUrl: string;
  };
  report?: {
    baseUrl: string;
  };
  signalR?: {
    baseUrl: string;
  };
  defaultQuotationSettings?: {
    companyId: number;
    contactPerson: string;
    mobileNo: string;
    emailId: string;
    address: string;
    productType: string;
    quantity: number;
    status: string;
    createdBy: number;
  };
}
