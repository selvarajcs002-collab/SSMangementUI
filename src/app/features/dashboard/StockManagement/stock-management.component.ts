import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { CompanyService } from '../../../core/services/company.service';
import { StockManagementService, StockSummary, StockBalanceSizeWise, LastTransaction } from '../../../core/services/stock-management.service';
import { MessageService } from '../../../core/services/message.service';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { DashboardFilterStateService } from '../../../core/services/dashboard-filter-state.service';
import { DashboardFilterDialogComponent } from '../dashboard-filter-dialog/dashboard-filter-dialog.component';
import { ExcelReportComponent } from '../../../excel/excel-report.component';
import { ExcelReportService } from '../../../excel/excel-report.service';
import { StockManagementExcelService } from '../../../excel/stock-management-excel.service';

@Component({
  selector: 'app-stock-management',
  standalone: true,
  imports: [CommonModule, SafeHtmlPipe, LoaderComponent, DashboardFilterDialogComponent],
  templateUrl: './stock-management.component.html',
  styleUrl: './stock-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockManagementComponent implements OnInit, OnDestroy {
  companyOptions: any[] = [];
  companies$!: Observable<any[]>;
  currentFilters: any = {};
  excelReportPayload: any = {};
  private filterSub!: Subscription;

  // UI State
  loading: boolean = false;
  isExporting: boolean = false;

  // Data State
  summary: StockSummary | null = null;
  stockBalanceData: StockBalanceSizeWise[] = [];
  transactionsData: LastTransaction[] = [];

  // Pagination - Stock Balance (Max 5)
  sbPageNumber: number = 1;
  sbPageSize: number = 5;
  sbTotalPages: number = 1;
  sbPaginatedData: StockBalanceSizeWise[] = [];

  // Pagination - Last Transactions (Max 5)
  ltPageNumber: number = 1;
  ltPageSize: number = 5;
  ltTotalPages: number = 1;
  ltPaginatedData: LastTransaction[] = [];

  // Totals for Last Transactions
  ltTotalInward: number = 0;
  ltTotalOutward: number = 0;
  ltSortDirection: 'asc' | 'desc' = 'desc';

  // Summary calculated from Stock Balance
  sbTotalInward: number = 0;
  sbTotalOutward: number = 0;
  sbTotalAvailable: number = 0;
  sbTotalDifference: number = 0;

  icons = {
    download: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
    upload: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>`,
    boxes: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    calendarOrange: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>`,
    calendarTeal: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>`,
    alertTriangle: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    search: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
    reset: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`,
    arrowUp: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`,
    arrowDown: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
    arrowRight: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
    excel: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/></svg>`,
    eye: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
    eyeOff: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    filter: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,
    refresh: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`
  };

  // Interactive States
  isFilterExpanded: boolean = true; // For legacy inline filter state if needed, mostly deprecated
  isFilterModalOpen: boolean = false;
  isStockBalanceVisible: boolean = false;
  hasStockBalanceLoaded: boolean = false;
  isLastTransactionsExpanded: boolean = true;
  isViewAllModalOpen: boolean = false;

  constructor(
    private companyService: CompanyService,
    private stockService: StockManagementService,
    private messageService: MessageService,
    private filterStateService: DashboardFilterStateService,
    private cdr: ChangeDetectorRef,
    private excelReportService: ExcelReportService,
    private smExcelService: StockManagementExcelService
  ) {
    // Load Companies for Dropdown
    this.companies$ = this.companyService.getCompanies().pipe(
      map((res: any) => {
        if (Array.isArray(res)) {
          this.companyOptions = res.map((c: any) => ({
            key: c.key.toString(),
            value: c.value
          }));
          return this.companyOptions;
        }
        this.companyOptions = [];
        return this.companyOptions;
      })
    );
  }

  ngOnInit(): void {
    this.filterSub = this.filterStateService.state$.subscribe(state => {
      this.currentFilters = state;
      this.loadInitialData();
    });
  }

  ngOnDestroy(): void {
    this.filterStateService.resetState();
    if (this.filterSub) {
      this.filterSub.unsubscribe();
    }
  }
  onSearch(): void {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.loading = true;
    const filters = { ...this.currentFilters };

    // Update excel payload
    this.excelReportPayload = this.buildExcelReportPayload();

    delete filters.mode; // Mode is not used by Stock API

    if (!filters.isDcBased) {
      delete filters.isDcBased;
      delete filters.deliveryChallans;
    }

    this.stockService.getSummary(filters).subscribe(res => {
      this.summary = res;
      this.cdr.markForCheck();
    });

    this.stockService.getLastTransactions(filters).subscribe(res => {
      this.transactionsData = res;
      this.ltPageNumber = 1;
      this.sortTransactions();
      this.updateLTPagination();
      this.calculateLtTotals();
      this.loading = false;
      this.cdr.markForCheck();
    });

    // If stock balance was already loaded, refresh it with new filters
    if (this.hasStockBalanceLoaded) {
      this.fetchStockBalance(filters);
    }
  }

  buildExcelReportPayload(): any {
    const p: any = {
      fromDate: this.currentFilters.fromDate,
      toDate: this.currentFilters.toDate,
      mode: this.currentFilters.mode || 'Inward',
      type: this.currentFilters.type || 'Size',
      companyId: this.currentFilters.companyId,
      styleNo: this.currentFilters.styleNo,
      designName: this.currentFilters.designName,
      colour: this.currentFilters.colour
    };
    if (this.currentFilters.isDcBased) {
      p.isDcBased = true;
      p.deliveryChallans = this.currentFilters.deliveryChallans;
    }
    return p;
  }

  // --- Stock Balance Section ---
  toggleStockBalance(): void {
    this.isStockBalanceVisible = !this.isStockBalanceVisible;
    if (this.isStockBalanceVisible && !this.hasStockBalanceLoaded) {
      const filters = { ...this.currentFilters };
      delete filters.mode;
      if (!filters.isDcBased) {
        delete filters.isDcBased;
        delete filters.deliveryChallans;
      }
      this.fetchStockBalance(filters);
    }
    this.cdr.markForCheck();
  }

  private fetchStockBalance(filters: any): void {
    this.loading = true;
    this.stockService.getStockBalance(filters).subscribe(res => {
      this.stockBalanceData = res;
      this.hasStockBalanceLoaded = true;
      this.calculateSbTotals();

      this.sbPageNumber = 1;
      this.updateSBPagination();

      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  private calculateSbTotals(): void {
    this.sbTotalInward = this.stockBalanceData.reduce((acc, curr) => acc + curr.totalInward, 0);
    this.sbTotalOutward = this.stockBalanceData.reduce((acc, curr) => acc + curr.totalOutward, 0);
    this.sbTotalAvailable = this.stockBalanceData.reduce((acc, curr) => acc + curr.available, 0);
    this.sbTotalDifference = this.stockBalanceData.reduce((acc, curr) => acc + curr.difference, 0);
  }

  private calculateLtTotals(): void {
    this.ltTotalInward = this.transactionsData.reduce((acc, curr) => acc + (curr.inwardQty || 0), 0);
    this.ltTotalOutward = this.transactionsData.reduce((acc, curr) => acc + (curr.outwardQty || 0), 0);
  }

  toggleLtSort(): void {
    this.ltSortDirection = this.ltSortDirection === 'asc' ? 'desc' : 'asc';
    this.sortTransactions();
    this.updateLTPagination();
    this.cdr.markForCheck();
  }

  private sortTransactions(): void {
    if (!this.transactionsData) return;
    this.transactionsData.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return this.ltSortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }

  // Get Dynamic Labels for Display
  getDisplayCompanyName(): string {
    const val = this.currentFilters?.companyId;
    if (!val) return 'All';
    const comp = this.companyOptions?.find(c => c.key.toString() === val.toString());
    return comp ? comp.value : val;
  }

  getDisplayValue(field: string): string {
    const val = this.currentFilters?.[field];
    return (!val) ? 'All' : val;
  }
  updateSBPagination(): void {
    this.sbTotalPages = Math.ceil(this.stockBalanceData.length / this.sbPageSize);
    if (this.sbTotalPages === 0) this.sbTotalPages = 1;
    if (this.sbPageNumber > this.sbTotalPages) this.sbPageNumber = this.sbTotalPages;
    const startIndex = (this.sbPageNumber - 1) * this.sbPageSize;
    this.sbPaginatedData = this.stockBalanceData.slice(startIndex, startIndex + this.sbPageSize);
  }

  sbFirstPage(): void {
    if (this.sbPageNumber !== 1) {
      this.sbPageNumber = 1;
      this.updateSBPagination();
    }
  }

  sbLastPage(): void {
    if (this.sbPageNumber !== this.sbTotalPages) {
      this.sbPageNumber = this.sbTotalPages;
      this.updateSBPagination();
    }
  }

  sbNextPage(): void {
    if (this.sbPageNumber < this.sbTotalPages) {
      this.sbPageNumber++;
      this.updateSBPagination();
    }
  }

  sbPrevPage(): void {
    if (this.sbPageNumber > 1) {
      this.sbPageNumber--;
      this.updateSBPagination();
    }
  }

  changeSbPageSize(event: any): void {
    const val = event.target.value;
    this.sbPageSize = parseInt(val, 10);
    this.sbPageNumber = 1;
    this.updateSBPagination();
  }

  // Last Transactions Pagination
  updateLTPagination(): void {
    this.ltTotalPages = Math.ceil(this.transactionsData.length / this.ltPageSize);
    if (this.ltTotalPages === 0) this.ltTotalPages = 1;
    if (this.ltPageNumber > this.ltTotalPages) this.ltPageNumber = this.ltTotalPages;
    const startIndex = (this.ltPageNumber - 1) * this.ltPageSize;
    this.ltPaginatedData = this.transactionsData.slice(startIndex, startIndex + this.ltPageSize);
  }

  ltFirstPage(): void {
    if (this.ltPageNumber !== 1) {
      this.ltPageNumber = 1;
      this.updateLTPagination();
    }
  }

  ltLastPage(): void {
    if (this.ltPageNumber !== this.ltTotalPages) {
      this.ltPageNumber = this.ltTotalPages;
      this.updateLTPagination();
    }
  }

  ltNextPage(): void {
    if (this.ltPageNumber < this.ltTotalPages) {
      this.ltPageNumber++;
      this.updateLTPagination();
    }
  }

  ltPrevPage(): void {
    if (this.ltPageNumber > 1) {
      this.ltPageNumber--;
      this.updateLTPagination();
    }
  }

  changeLtPageSize(event: any): void {
    const val = event.target.value;
    this.ltPageSize = parseInt(val, 10);
    this.ltPageNumber = 1;
    this.updateLTPagination();
  }

  formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate().toString().padStart(2, '0')}-${months[date.getMonth()]}-${date.getFullYear()}`;
  }

  // --- Toggles & Modals ---
  toggleFilters(): void {
    this.isFilterExpanded = !this.isFilterExpanded;
  }

  toggleLastTransactions(): void {
    this.isLastTransactionsExpanded = !this.isLastTransactionsExpanded;
  }

  // Modal Toggles
  openFilterModal(): void {
    this.isFilterModalOpen = true;
  }

  closeFilterModal(): void {
    this.isFilterModalOpen = false;
  }

  openViewAllModal(): void {
    this.isViewAllModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeViewAllModal(): void {
    this.isViewAllModalOpen = false;
    document.body.style.overflow = '';
  }

  onRefresh(): void {
    this.onSearch();
  }

  exportExcel(): void {
    this.isExporting = true;
    this.cdr.markForCheck();
    
    // We get the latest filters that we used for the current view
    const payload = this.buildExcelReportPayload();
    // But we override mode to All so we get Inwards and Outwards
    payload.mode = 'All';

    this.excelReportService.getStockManagementReport(payload).subscribe({
      next: (res) => {
        // Hydrate with view specific strings
        res.companyName = this.getDisplayCompanyName();
        res.branch = 'Main Branch';
        
        this.smExcelService.generateAndDownload(res).then(() => {
          this.isExporting = false;
          this.messageService.success('Report exported successfully');
          this.cdr.markForCheck();
        }).catch(err => {
          console.error(err);
          this.isExporting = false;
          this.messageService.error('Error generating Excel file');
          this.cdr.markForCheck();
        });
      },
      error: (err) => {
        console.error(err);
        this.isExporting = false;
        this.messageService.error('Error fetching data for export');
        this.cdr.markForCheck();
      }
    });
  }
}
