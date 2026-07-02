import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { TableColumn } from '../dc-filter-table/dc-filter-table.component';

import { CommonModule } from '@angular/common';
import { ExcelReportComponent } from '../../../../excel/excel-report.component';
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
import { StatusFilterService, StatusFilterRequest } from '../../../../core/services/status-filter.service';

@Component({
  selector: 'app-dc-filter-container',
  standalone: true,
  imports: [CommonModule, DcFilterHeaderComponent, DcFilterComponent, DcFilterTableComponent, DynamicToggleComponent, ExcelReportComponent],
  templateUrl: './dc-filter-container.component.html',
  styleUrl: './dc-filter-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DcFilterContainerComponent implements OnInit {

  activeView: string = 'inward';
  currentViewType: string = 'S';
  isLoading: boolean = false;
  showNoDataModal: boolean = false;

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

  viewTypeToggleConfig: ToggleConfig = {
    type: 'view-switcher',
    options: [
      {
        label: 'Size Based',
        value: 'S',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h.01"/><path d="M17 7h.01"/><path d="M7 17h.01"/><path d="M17 17h.01"/></svg>`
      },
      {
        label: 'Meter Based',
        value: 'M',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/></svg>`
      }
    ]
  };

  tableColumns: TableColumn[] = [];

  tableData: any[] = [];
  totalRecords: number = 0;
  pageNumber: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;

  summaryTotals = { totalBitsCount: 0, totalMeter: 0 };
  currentFilters: any = {};
  Math = Math;

  showFilter: boolean = true;

  constructor(
    private apiService: ApiService,
    private outwardService: OutwardService,
    private inwardService: InwardService,
    private companyService: CompanyService,
    private outwardPreviewService: OutwardPreviewService,
    private statusFilterService: StatusFilterService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.updateColumns();
    this.loadData();
  }

  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  onToggleChange(newMode: string): void {
    this.activeView = newMode;
    this.pageNumber = 1;
    this.loadData();
  }

  onViewTypeChange(newType: string): void {
    this.currentViewType = newType;
    this.pageNumber = 1;
    this.updateColumns();
    this.loadData();
  }

  updateColumns(): void {
    if (this.currentViewType === 'S') {
      this.tableColumns = [
        { key: 'sno', label: 'S.No' },
        { key: 'date', label: 'Date' },
        { key: 'companyName', label: 'Company Name' },
        { key: 'styleNo', label: 'Style No' },
        { key: 'designName', label: 'Design Name' },
        { key: 'colour', label: 'Colour' },
        { key: 'bitsCount', label: 'Bits Count', align: 'right' },
        { key: 'dcNo', label: 'DC No', align: 'right' },
        { key: 'action', label: 'Action', align: 'center' }
      ];
    } else {
      this.tableColumns = [
        { key: 'sno', label: 'S.No' },
        { key: 'date', label: 'Date' },
        { key: 'companyName', label: 'Company Name' },
        { key: 'styleNo', label: 'Style No' },
        { key: 'designName', label: 'Design Name' },
        { key: 'colour', label: 'Colour' },
        { key: 'bitsCount', label: 'Bits Count', align: 'right' },
        { key: 'totalMeter', label: 'Total Meter', align: 'right' },
        { key: 'dcNo', label: 'DC No', align: 'right' },
        { key: 'action', label: 'Action', align: 'center' }
      ];
    }
  }

  excelReportPayload: any = this.buildExcelReportPayload();

  loadData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    
    // Update excel payload whenever we load data (filters/view changes)
    this.excelReportPayload = this.buildExcelReportPayload();

    const payload: any = {
      CompanyId: this.currentFilters.companyId ? Number(this.currentFilters.companyId) : null,
      DesignId: this.currentFilters.designName || null,
      FromDate: this.currentFilters.fromDate || null,
      ToDate: this.currentFilters.toDate || null,
      PageNumber: this.pageNumber,
      PageSize: this.pageSize,
      SortColumn: 'Date',
      SortDirection: 'DESC',
      StyleId: this.currentFilters.styleNo || null,
      TransactionType: this.activeView.toUpperCase(),
      ViewType: this.currentViewType === 'S' ? 'SIZE' : 'METER'
    };

    this.statusFilterService.search(payload).subscribe({
      next: (res: any) => {
        if (res && res.success && res.data && res.data.length > 0) {
          this.handleResponse(res.data);
          this.totalRecords = res.totalRecords || 0;
          this.totalPages = res.totalPages || 0;
          this.summaryTotals = res.summary || { totalBitsCount: 0, totalMeter: 0 };
        } else {
          this.tableData = [];
          this.totalRecords = 0;
          this.totalPages = 0;
          this.summaryTotals = { totalBitsCount: 0, totalMeter: 0 };

          if (res && res.success) {
            // Success but no data
            this.showNoDataModal = true;
          } else if (res && !res.success && res.message) {
            this.messageService.error(res.message);
          }
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        const errorMsg = err.error?.message || err.message || 'Unknown error';
        this.messageService.error(`Error (Status: ${err.status}): ${errorMsg}`);
        console.error('Error loading filter data:', err);
        this.tableData = [];
        this.totalRecords = 0;
        this.totalPages = 0;
        this.summaryTotals = { totalBitsCount: 0, totalMeter: 0 };
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  closeNoDataModal(): void {
    this.showNoDataModal = false;
    this.cdr.markForCheck();
  }

  nextPage(): void {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber++;
      this.loadData();
    }
  }

  prevPage(): void {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.loadData();
    }
  }

  private handleResponse(data: any[]): void {
    this.tableData = data.map((item, index) => {
      const parsedDate = new Date(item.date || item.createdDate);
      const formattedDate = !isNaN(parsedDate.getTime())
        ? `${parsedDate.getDate().toString().padStart(2, '0')}-${(parsedDate.getMonth() + 1).toString().padStart(2, '0')}-${parsedDate.getFullYear()}`
        : (item.date || item.createdDate);

      return {
        sno: index + 1,
        date: formattedDate,
        companyName: item.companyName || item.CompanyName || '-',
        styleNo: item.styleNo,
        designName: item.designName,
        colour: item.colour || '-',
        bitsCount: item.totalBitsCount || 0,
        totalMeter: item.totalMeter || 0,
        dcNo: item.dcNo || '-',
        authorizedBy: item.createdBy || 'Unknown',
        fullData: item
      };
    });
  }

  onSearch(filterPayload: any): void {
    this.currentFilters = filterPayload;
    this.pageNumber = 1;
    this.loadData();
  }

  buildExcelReportPayload(): any {
    const fromDateVal = this.currentFilters.fromDate;
    const toDateVal = this.currentFilters.toDate;

    let formattedFromDate = null;
    if (fromDateVal) {
      const d = new Date(fromDateVal);
      if (!isNaN(d.getTime())) {
        formattedFromDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)).toISOString();
      }
    } else {
      // Default initial fromDate (e.g. 1st of month)
      const d = new Date();
      formattedFromDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1, 0, 0, 0)).toISOString();
    }

    let formattedToDate = null;
    if (toDateVal) {
      const d = new Date(toDateVal);
      if (!isNaN(d.getTime())) {
        formattedToDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)).toISOString();
      }
    } else {
       // Default initial toDate (e.g. today)
      const d = new Date();
      formattedToDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)).toISOString();
    }

    return {
      fromDate: formattedFromDate,
      toDate: formattedToDate,
      mode: this.activeView === 'inward' ? 'Inward' : 'Outward',
      type: this.currentViewType === 'S' ? 'Size' : 'Meter',
      companyId: this.currentFilters.companyId ? Number(this.currentFilters.companyId) : null,
      styleNo: this.currentFilters.styleNo || null,
      designName: this.currentFilters.designName || null
    };
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
      this.openOutwardPreview(rawData, rawData);
      return;
    }

    this.outwardService.getOutwardByDcNo(id, 'OUTWARD').subscribe({
      next: (res) => {
        this.openOutwardPreview(res || rawData, rawData);
      },
      error: (err) => {
        console.error('View fetch error:', err);
        this.openOutwardPreview(rawData, rawData);
      }
    });
  }

  private openOutwardPreview(data: any, rawData?: any): void {
    const companyId = Number(data?.companyId || data?.CompanyId || 0);

    if (companyId) {
      this.companyService.getCompanyById(companyId).subscribe({
        next: (company) => this.navigateToPreview(data, company, rawData),
        error: () => this.navigateToPreview(data, null, rawData)
      });
      return;
    }

    this.navigateToPreview(data, null, rawData);
  }

  private navigateToPreview(data: any, company: any, rawData?: any): void {
    const sizes = this.getSizeRows(data);
    const totalQty = sizes.reduce((sum, item) => sum + item.qty, 0) || Number(data?.count || data?.totalCount || 0);

    let items: any[] = [];
    const colourBreakdowns = data?.colourBreakdowns || data?.ColourBreakdowns;

    if (colourBreakdowns && Array.isArray(colourBreakdowns) && colourBreakdowns.length > 0) {
      items = colourBreakdowns.map((cb: any) => {
        const cbSizes = cb.sizes || cb.Sizes || [];
        const mappedSizes = cbSizes.map((s: any) => ({
          label: s.size || s.label || s.sizeName || '',
          qty: Number(s.count ?? s.qty ?? s.quantity ?? 0)
        })).filter((s: any) => s.label);

        return {
          designName: data?.designName || data?.designRef || '',
          styleNo: data?.styleNo || '',
          colour: cb.colour || cb.Colour || data?.colourName || data?.colour || '',
          sizes: mappedSizes,
          count: mappedSizes.reduce((sum: number, s: any) => sum + s.qty, 0)
        };
      });
    } else {
      items = [{
        designName: data?.designName || data?.designRef || '',
        styleNo: data?.styleNo || '',
        colour: rawData?.colour && rawData?.colour !== 'MULTI' ? rawData.colour : (data?.colourName || data?.colour || ''),
        sizes,
        count: totalQty
      }];
    }

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
      items: items,
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
    if (this.activeView !== 'inward') {
      this.messageService.error('Deletion is only supported for Inward records from this interface.');
      return;
    }

    const id = row.fullData?.id || row.fullData?.Id;
    if (!id) {
      this.messageService.error('Invalid ID for deletion');
      return;
    }

    if (confirm('Are you sure you want to delete this log?')) {
      this.inwardService.deleteInward(id).subscribe({
        next: (res) => {
          if (res && res.status) {
            this.messageService.success(res.message || 'Deleted successfully');
            this.loadData();
          } else {
            this.messageService.error(res?.message || 'Failed to delete record');
          }
        },
        error: (err) => {
          const errMsg = err.error?.message || 'Failed to delete record';
          this.messageService.error(errMsg);
        }
      });
    }
  }
}
