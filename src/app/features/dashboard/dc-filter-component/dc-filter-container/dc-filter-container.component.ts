import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { TableColumn } from '../dc-filter-table/dc-filter-table.component';

import { CommonModule } from '@angular/common';
import { DcFilterHeaderComponent } from '../dc-filter-header/dc-filter-header.component';
import { DcFilterComponent } from '../dc-filter-component.component';
import { DcFilterTableComponent } from '../dc-filter-table/dc-filter-table.component';
import { DynamicToggleComponent, ToggleConfig } from '../../../../shared/components/dynamic-toggle/dynamic-toggle.component';
import { ApiService } from '../../../../core/services/api.service';
import { MessageService } from '../../../../core/services/message.service';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { OutwardService } from '../../../../core/services/outward.service';
import { InwardService } from '../../../../core/services/inward.service';
import { CompanyService } from '../../../../core/services/company.service';
import { OutwardPreviewService, ChallanData } from '../../../../core/services/outward-preview.service';

@Component({
  selector: 'app-dc-filter-container',
  standalone: true,
  imports: [CommonModule, DcFilterHeaderComponent, DcFilterComponent, DcFilterTableComponent, DynamicToggleComponent],
  templateUrl: './dc-filter-container.component.html',
  styleUrl: './dc-filter-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DcFilterContainerComponent implements OnInit {

  activeView: string = 'inward';
  isLoading: boolean = false;

  toggleConfig: ToggleConfig = {
    type: 'view-switcher',
    options: [
      {
        label: 'Inward',
        value: 'inward',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14m7-7-7 7-7-7"/></svg>`
      },
      {
        label: 'Outward',
        value: 'outward',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5m7 7-7-7-7 7"/></svg>`
      }
    ]
  };

  tableColumns: TableColumn[] = [
    { key: 'sno', label: 'S.No' },
    { key: 'date', label: 'Date' },
    { key: 'styleNo', label: 'Style No' },
    { key: 'designName', label: 'Design Name' },
    { key: 'colour', label: 'Colour' },
    { key: 'count', label: 'Count', align: 'right' },
    { key: 'dcNo', label: 'DC No', align: 'right' },
    { key: 'action', label: 'Action', align: 'center' }
  ];

  tableData: any[] = [];
  totalRecords: number = 0;
  pageNumber: number = 1;
  pageSize: number = 10;

  constructor(
    private apiService: ApiService,
    private outwardService: OutwardService,
    private inwardService: InwardService,
    private companyService: CompanyService,
    private outwardPreviewService: OutwardPreviewService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  onToggleChange(newMode: string): void {
    this.activeView = newMode;
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.getData(this.pageNumber, this.pageSize).subscribe({
      next: (response: HttpResponse<any>) => {
        const status = response.status;
        const res = response.body;
        const mode = this.activeView.toUpperCase();

        if (res && res.data) {
          const selectedData = mode === 'INWARD' ? res.data.inward : res.data.outward;
          this.handleResponse(selectedData || []);
          this.messageService.success(`Successfully fetched ${mode} data (Status: ${status})`);
        } else {
          this.tableData = [];
          this.totalRecords = 0;
          this.messageService.success(`Empty response (Status: ${status})`);
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        const errorMsg = err.error?.message || err.message || 'Unknown error';
        this.messageService.error(`Error (Status: ${err.status}): ${errorMsg}`);
        console.error('Error loading DC data:', err);
        this.tableData = [];
        this.totalRecords = 0;
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getData(pageNumber: number, pageSize: number) {
    const mode = this.activeView.toUpperCase();
    return this.apiService.getWithResponse<any>(`get-all`, {
      mode: mode,
      pageNumber: pageNumber,
      pageSize: pageSize
    });
  }

  nextPage(): void {
    this.pageNumber++;
    this.loadData();
  }

  prevPage(): void {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.loadData();
    }
  }

  private handleResponse(data: any[]): void {
    this.tableData = data.map((item, index) => ({
      sno: index + 1, // Reverted to simple index-based numbering
      date: item.createdDate,
      styleNo: item.styleNo,
      designName: item.designName,
      colour: item.colourName || item.colour || '-',
      count: this.getTotalCount(item.sizeCounts),
      dcNo: item.dcNo || '-',
      authorizedBy: item.createdBy,
      fullData: item
    }));
    this.totalRecords = this.tableData.length;
  }

  private getTotalCount(sizeCounts: any[]): number {
    if (!sizeCounts || sizeCounts.length === 0) return 0;
    return sizeCounts.reduce((sum, x) => sum + (Number(x.count) || 0), 0);
  }

  onSearch(filterPayload: any): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const payload = {
      mode: this.activeView.toUpperCase(),
      fromDate: this.formatDate(filterPayload.fromDate),
      toDate: this.formatDate(filterPayload.toDate),
      companyId: filterPayload.companyId || null,
      styleNo: filterPayload.styleNo || null,
      designName: filterPayload.designName || null
    };

    this.apiService.post<any>('get-details', payload).subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const mode = this.activeView.toUpperCase();
          const selectedData = mode === 'INWARD' ? res.data.inward : res.data.outward;
          this.handleResponse(selectedData || []);
          this.showMessage('success', 'Search results loaded successfully');
        } else {
          this.tableData = [];
          this.totalRecords = 0;
          this.showMessage('success', 'No records found for the selected criteria');
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.showMessage('error', 'Failed to fetch search results');
        console.error('Search error:', err);
        this.tableData = [];
        this.totalRecords = 0;
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private formatDate(value: any): string | null {
    if (!value) return null;
    try {
      return new Date(value).toISOString().split('T')[0];
    } catch {
      return null;
    }
  }

  showMessage(type: 'success' | 'error', message: string): void {
    if (type === 'success') {
      this.messageService.success(message);
    } else {
      this.messageService.error(message);
    }
  }

  onPageChange(page: number): void {
    this.pageNumber = page;
    this.loadData();
  }

  onView(row: any): void {
    if (this.activeView !== 'outward') {
      return;
    }

    const rawData = row.fullData || row;
    const id = rawData.id;

    this.isLoading = true;
    this.cdr.markForCheck();

    if (!id) {
      this.openOutwardPreview(rawData);
      return;
    }

    this.outwardService.getOutwardByDcNo(id, 'OUTWARD').subscribe({
      next: (res) => {
        this.openOutwardPreview(res || rawData);
      },
      error: (err) => {
        console.error('View fetch error:', err);
        this.openOutwardPreview(rawData);
      }
    });
  }

  private openOutwardPreview(data: any): void {
    const companyId = Number(data?.companyId || data?.CompanyId || 0);

    if (companyId) {
      this.companyService.getCompanyById(companyId).subscribe({
        next: (company) => this.navigateToPreview(data, company),
        error: () => this.navigateToPreview(data, null)
      });
      return;
    }

    this.navigateToPreview(data, null);
  }

  private navigateToPreview(data: any, company: any): void {
    const sizes = this.getSizeRows(data);
    const totalQty = sizes.reduce((sum, item) => sum + item.qty, 0) || Number(data?.count || data?.totalCount || 0);

    const previewData: ChallanData = {
      company: {
        name: 'SS Embroidery',
        address: 'H.No: 1-2-3/A, Street Name, Area Name,\nCity, State - PIN',
        gst: '33AABCS1234F1Z1',
        logo: null
      },
      date: data?.createdDate || data?.outwardDate || new Date().toISOString(),
      dcNo: data?.dcNo || data?.outwardDcNo || data?.OutwardDcNo || '-',
      receiverName: company?.companyName || company?.CompanyName || data?.companyName || data?.receiverName || 'Company Name',
      receiverAddress: this.buildReceiverAddress(company, data),
      items: [{
        designName: data?.designName || data?.designRef || '',
        styleNo: data?.styleNo || '',
        colour: data?.colourName || data?.colour || '',
        sizes,
        count: totalQty
      }],
      totalQty
    };

    this.outwardPreviewService.setPreviewData(previewData);
    this.isLoading = false;
    this.cdr.markForCheck();
    this.router.navigate(['/dashboard/outward/preview']);
  }

  private getSizeRows(data: any): { label: string; qty: number }[] {
    const rows = data?.sizeCounts || data?.sizes || data?.sizeBreakdown || [];

    if (!Array.isArray(rows)) {
      return [];
    }

    return rows.map((item: any) => ({
      label: item.size || item.label || item.sizeName || '',
      qty: Number(item.count ?? item.qty ?? item.quantity ?? 0)
    })).filter((item) => item.label);
  }

  private buildReceiverAddress(company: any, data: any): string {
    if (data?.receiverAddress) {
      return data.receiverAddress;
    }

    const source = company || data || {};
    const line1 = [
      source.door_No || source.Door_No || source.doorNo || source.DoorNo,
      source.street_Name || source.Street_Name || source.streetName || source.StreetName
    ].filter(Boolean).join(' ');

    const line2 = [
      source.city || source.City,
      source.pincode || source.Pincode ? `- ${source.pincode || source.Pincode}` : ''
    ].filter(Boolean).join(' ');

    return [line1, line2].filter(Boolean).join('\n') || '-';
  }

  onEdit(row: any): void {
    const rawData = row.fullData;
    if (!rawData) return;

    this.isLoading = true;
    this.cdr.markForCheck();

    const mode = this.activeView.toUpperCase();
    const id = rawData.id;

    if (!id) {
      this.messageService.error('Invalid ID for editing');
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    this.outwardService.getOutwardByDcNo(id, mode).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res) {
          const route = mode === 'INWARD' ? '/dashboard/inward' : '/dashboard/outward';
          
          if (mode === 'INWARD') {
            this.inwardService.setEditData(res);
          } else {
            this.outwardService.setEditData(res);
          }
          
          this.router.navigate([route, id]);
        } else {
          this.messageService.error('Record details not found');
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.error('Failed to fetch details for editing');
        console.error('Edit fetch error:', err);
        this.cdr.markForCheck();
      }
    });
  }

  onDelete(row: any): void {
    if (confirm('Are you sure you want to delete this log?')) {
      console.log('Deleted row:', row);
    }
  }
}
