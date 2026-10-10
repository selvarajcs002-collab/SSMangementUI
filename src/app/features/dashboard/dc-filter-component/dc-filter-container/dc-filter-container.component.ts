import { Component, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, OnInit, OnDestroy } from '@angular/core';
import { TableColumn } from '../dc-filter-table/dc-filter-table.component';
import { CommonModule } from '@angular/common';
import { ExcelReportComponent } from '../../../../excel/excel-report.component';
import { DcFilterHeaderComponent } from '../dc-filter-header/dc-filter-header.component';
import { DashboardFilterDialogComponent } from '../../dashboard-filter-dialog/dashboard-filter-dialog.component';
import { DcFilterTableComponent } from '../dc-filter-table/dc-filter-table.component';
import { DynamicToggleComponent, ToggleConfig } from '../../../../shared/components/dynamic-toggle/dynamic-toggle.component';
import { MessageService } from '../../../../core/services/message.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { OutwardService } from '../../../../core/services/outward.service';
import { InwardService } from '../../../../core/services/inward.service';
import { CompanyService, readCompanyGst, readCompanyId } from '../../../../core/services/company.service';
import { OutwardPreviewService, ChallanData, ISSUER_COMPANY_GST } from '../../../../core/services/outward-preview.service';
import { StatusFilterService } from '../../../../core/services/status-filter.service';
import { DashboardFilterStateService } from '../../../../core/services/dashboard-filter-state.service';
import { Subscription, forkJoin } from 'rxjs';

@Component({
  selector: 'app-dc-filter-container',
  standalone: true,
  imports: [CommonModule, DcFilterHeaderComponent, DashboardFilterDialogComponent, DcFilterTableComponent, DynamicToggleComponent, ExcelReportComponent],
  templateUrl: './dc-filter-container.component.html',
  styleUrl: './dc-filter-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DcFilterContainerComponent implements OnInit, OnDestroy {

  activeView: string = 'inward';
  currentViewType: string = 'S';
  isLoading: boolean = false;
  loadingLabel: string = 'Loading challans…';
  hasLoaded: boolean = false;
  loadFailed: boolean = false;
  isDeleting: boolean = false;
  expandedId: string | number | null = null;
  searchText: string = '';
  sortDirection: 'ASC' | 'DESC' = 'DESC';
  pendingDelete: { id: any; message: string } | null = null;

  private filterSub?: Subscription;
  private companySub?: Subscription;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private requestId = 0;
  private wideKey = '';
  private wideRows: any[] = [];
  private wideLoaded = false;
  private readonly fetchCap = 500;

  wideCapped = false;
  usingClientResults = false;

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

  tableColumns: TableColumn[] = [];
  tableData: any[] = [];
  totalRecords: number = 0;
  pageNumber: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  summaryTotals = { totalBitsCount: 0, totalMeter: 0 };
  currentFilters: any = {};
  showFilter: boolean = false;
  excelReportPayload: any = {};

  private companyNames = new Map<string, string>();

  constructor(
    private outwardService: OutwardService,
    private inwardService: InwardService,
    private companyService: CompanyService,
    private outwardPreviewService: OutwardPreviewService,
    private statusFilterService: StatusFilterService,
    private messageService: MessageService,
    private filterStateService: DashboardFilterStateService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.excelReportPayload = this.buildExcelReportPayload();
    this.companySub = this.companyService.getCompanies().subscribe({
      next: (list) => {
        (list || []).forEach((company) => {
          if (company?.key != null && company.value) {
            this.companyNames.set(String(company.key), company.value);
          }
        });
        this.cdr.markForCheck();
      },
      error: () => { }
    });

    this.filterSub = this.filterStateService.state$.subscribe(state => {
      this.currentFilters = state;
      this.currentViewType = state.mode;
      this.updateColumns();
      this.pageNumber = 1;
      this.loadData();
    });
  }

  ngOnDestroy(): void {
    this.filterSub?.unsubscribe();
    this.companySub?.unsubscribe();
    this.filterStateService.resetState();
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.pendingDelete && !this.isDeleting) {
      this.cancelDelete();
    }
  }

  get activeFilterCount(): number {
    return this.filterChips.length;
  }

  get filterChips(): { key: string; label: string }[] {
    const filters = this.currentFilters || {};
    const chips: { key: string; label: string }[] = [];
    if (filters.companyId) {
      chips.push({ key: 'company', label: `Company: ${this.companyLabel(filters.companyId)}` });
    }
    if (filters.styleNo) {
      chips.push({ key: 'style', label: `Style: ${filters.styleNo}` });
    }
    if (filters.designName) {
      chips.push({ key: 'design', label: `Design: ${filters.designName}` });
    }
    if (filters.colour) {
      chips.push({ key: 'colour', label: `Colour: ${filters.colour}` });
    }
    const challans = Array.isArray(filters.deliveryChallans) ? filters.deliveryChallans : [];
    if (challans.length === 1) {
      chips.push({ key: 'dc', label: `DC ${challans[0]}` });
    } else if (challans.length > 1) {
      chips.push({ key: 'dc', label: `${challans.length} challan numbers` });
    }
    return chips;
  }

  get dateRangeLabel(): string {
    return `${this.formatChipDate(this.currentFilters?.fromDate)} – ${this.formatChipDate(this.currentFilters?.toDate)}`;
  }

  get quantityLabel(): string {
    if (this.currentViewType === 'M') return 'Bits';
    if (this.currentViewType === 'ALL') return 'Pieces / bits';
    return 'Pieces';
  }

  get showMeterCard(): boolean {
    return this.currentViewType !== 'S' || Number(this.summaryTotals.totalMeter) > 0;
  }

  get summaryNote(): string {
    if (this.usingClientResults) {
      return 'Totals follow the search and the challans loaded for these dates.';
    }
    return 'Totals cover every challan in this filter, not only this page.';
  }

  get emptyTitle(): string {
    if (this.loadFailed) return 'The challan list did not load';
    if (this.searchText.trim()) return 'No challan matches that search';
    return 'No challans for this view';
  }

  get emptyHint(): string {
    if (this.loadFailed) return 'Check the connection and try again.';
    const challans = this.currentFilters?.deliveryChallans || [];
    if (this.activeView === 'outward' && challans.length) {
      return 'Those numbers are usually inward receipts. Switch to Inward, or clear the challan-number filter.';
    }
    return 'Change the dates, clear a filter, or create a new inward or outward challan.';
  }

  get rangeStart(): number {
    if (!this.totalRecords) return 0;
    return (this.pageNumber - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.pageNumber * this.pageSize, this.totalRecords);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.pageNumber;
    if (total <= 1) return total === 1 ? [1] : [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (current > 3) pages.push(-1);
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  openFilterDialog(): void {
    this.showFilter = true;
    this.cdr.markForCheck();
  }

  closeFilterDialog(): void {
    this.showFilter = false;
    this.cdr.markForCheck();
  }

  onToggleChange(newMode: string): void {
    this.activeView = newMode;
    this.pageNumber = 1;
    this.expandedId = null;
    this.invalidateWideCache();
    this.loadData();
  }

  setMode(mode: 'S' | 'M' | 'ALL'): void {
    if (this.currentViewType === mode) return;
    this.pageNumber = 1;
    this.filterStateService.updateState({ mode });
  }

  onSearchInput(event: Event): void {
    this.searchText = (event.target as HTMLInputElement).value;
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.pageNumber = 1;
      this.loadData();
    }, 300);
  }

  clearSearch(): void {
    this.searchText = '';
    this.pageNumber = 1;
    this.loadData();
  }

  toggleSort(): void {
    this.sortDirection = this.sortDirection === 'DESC' ? 'ASC' : 'DESC';
    this.pageNumber = 1;
    this.invalidateWideCache();
    this.loadData();
  }

  refresh(): void {
    this.invalidateWideCache();
    this.loadData();
  }

  resetFilters(): void {
    this.searchText = '';
    this.pageNumber = 1;
    this.filterStateService.resetState();
  }

  clearChip(key: string): void {
    this.pageNumber = 1;
    if (key === 'company') {
      this.filterStateService.updateState({
        companyId: null, styleNo: null, designName: null, colour: null, deliveryChallans: [], isDcBased: false
      });
      return;
    }
    if (key === 'style') {
      this.filterStateService.updateState({
        styleNo: null, designName: null, colour: null, deliveryChallans: [], isDcBased: false
      });
      return;
    }
    if (key === 'design') {
      this.filterStateService.updateState({
        designName: null, colour: null, deliveryChallans: [], isDcBased: false
      });
      return;
    }
    if (key === 'colour') {
      this.filterStateService.updateState({ colour: null, deliveryChallans: [], isDcBased: false });
      return;
    }
    if (key === 'dc') {
      this.filterStateService.updateState({ deliveryChallans: [], isDcBased: false });
    }
  }

  goToInward(): void {
    this.router.navigate(['/dashboard/inward'], { queryParams: { from: 'delivery-challan' } });
  }

  goToOutward(): void {
    this.router.navigate(['/dashboard/outward'], { queryParams: { from: 'delivery-challan' } });
  }

  updateColumns(): void {
    const shared: TableColumn[] = [
      { key: 'sno', label: 'S.No' },
      { key: 'date', label: 'Date' },
      { key: 'companyName', label: 'Company' },
      { key: 'styleNo', label: 'Style No' },
      { key: 'designName', label: 'Design' },
      { key: 'colour', label: 'Colour' }
    ];

    if (this.currentViewType === 'S') {
      this.tableColumns = [
        ...shared,
        { key: 'bitsCount', label: 'Pieces', align: 'right' },
        { key: 'dcNo', label: 'DC No' },
        { key: 'action', label: 'Action', align: 'center' }
      ];
      return;
    }

    if (this.currentViewType === 'M') {
      this.tableColumns = [
        ...shared,
        { key: 'bitsCount', label: 'Bits', align: 'right' },
        { key: 'totalMeter', label: 'Total Meter', align: 'right' },
        { key: 'dcNo', label: 'DC No' },
        { key: 'action', label: 'Action', align: 'center' }
      ];
      return;
    }

    this.tableColumns = [
      ...shared,
      { key: 'entryKind', label: 'Type' },
      { key: 'bitsCount', label: 'Qty', align: 'right' },
      { key: 'totalMeter', label: 'Total Meter', align: 'right' },
      { key: 'dcNo', label: 'DC No' },
      { key: 'action', label: 'Action', align: 'center' }
    ];
  }

  loadData(): void {
    this.excelReportPayload = this.buildExcelReportPayload();
    const key = this.buildQueryKey();

    if (this.needsClientQuery) {
      if (this.wideLoaded && this.wideKey === key) {
        this.applyClientSlice();
        this.isLoading = false;
        this.cdr.markForCheck();
        return;
      }
      this.fetchClientQuery(key);
      return;
    }

    this.fetchServerPage();
  }

  onPageSize(event: Event): void {
    const next = Number((event.target as HTMLSelectElement).value);
    this.pageSize = next || 10;
    this.pageNumber = 1;
    if (this.usingClientResults && this.wideLoaded) {
      this.applyClientSlice();
      this.cdr.markForCheck();
      return;
    }
    this.loadData();
  }

  onPageChange(page: number): void {
    if (page < 1 || (this.totalPages && page > this.totalPages) || page === this.pageNumber) return;
    this.pageNumber = page;
    if (this.usingClientResults && this.wideLoaded && this.needsClientQuery) {
      this.applyClientSlice();
      this.cdr.markForCheck();
      return;
    }
    this.loadData();
  }

  nextPage(): void {
    this.onPageChange(this.pageNumber + 1);
  }

  prevPage(): void {
    this.onPageChange(this.pageNumber - 1);
  }

  onExpand(id: string | number | null): void {
    this.expandedId = id;
    this.cdr.markForCheck();
  }

  onView(row: any): void {
    if (this.activeView !== 'outward') {
      const id = row?.fullData?.id ?? row?.fullData?.Id ?? row?.dcNo ?? null;
      this.expandedId = this.expandedId != null && String(this.expandedId) === String(id) ? null : id;
      this.cdr.markForCheck();
      return;
    }

    const rawData = row.fullData || row;
    const id = rawData.id;

    this.loadingLabel = 'Opening the challan…';
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

  onEdit(row: any): void {
    const rawData = row.fullData;
    if (!rawData) return;

    this.loadingLabel = 'Opening the challan…';
    this.isLoading = true;
    this.cdr.markForCheck();

    const mode = this.activeView.toUpperCase();
    const id = rawData.id ?? rawData.Id;

    if (!id) {
      this.messageService.error('This challan has no id, so it cannot be edited.');
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
          this.router.navigate([route, id], {
            queryParams: { from: 'delivery-challan' }
          });
        } else {
          this.messageService.error('Challan details were not found.');
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.error('Could not open this challan for editing.');
        console.error('Edit fetch error:', err);
        this.cdr.markForCheck();
      }
    });
  }

  onDelete(row: any): void {
    const id = row.fullData?.id || row.fullData?.Id;
    if (!id) {
      this.messageService.error('This challan has no id, so it cannot be deleted.');
      return;
    }

    const dcNo = row.dcNo && row.dcNo !== '-' ? row.dcNo : 'this challan';
    const company = row.companyName && row.companyName !== '-' ? row.companyName : 'the client';
    const message = this.activeView === 'outward'
      ? `Delete outward ${dcNo} for ${company}? The inward total stays the same. The quantity returns to the available balance, including the linked DC numbers.`
      : `Delete inward ${dcNo} for ${company}? This removes the receipt from the delivery challan register.`;

    this.pendingDelete = { id, message };
    this.cdr.markForCheck();
  }

  cancelDelete(): void {
    this.pendingDelete = null;
    this.cdr.markForCheck();
  }

  confirmDelete(): void {
    if (!this.pendingDelete || this.isDeleting) return;
    const id = this.pendingDelete.id;
    const isOutward = this.activeView === 'outward';
    this.isDeleting = true;

    const request = isOutward
      ? this.outwardService.deleteOutward(id, localStorage.getItem('userEmail') || 'User', 'Deleted from Delivery Challan')
      : this.inwardService.deleteInward(id);

    request.subscribe({
      next: (res) => {
        this.isDeleting = false;
        if (res && (res.status || res.Status)) {
          this.messageService.success(res.message || res.Message || 'Challan deleted.');
          this.pendingDelete = null;
          this.expandedId = null;
          this.invalidateWideCache();
          this.loadData();
        } else {
          this.messageService.error(res?.message || res?.Message || 'Could not delete this challan.');
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.isDeleting = false;
        const errMsg = err.error?.message || err.error?.Message || 'Could not delete this challan.';
        this.messageService.error(errMsg);
        this.cdr.markForCheck();
      }
    });
  }

  private get needsClientQuery(): boolean {
    const filters = this.currentFilters || {};
    const hasDc = Array.isArray(filters.deliveryChallans) && filters.deliveryChallans.length > 0;
    return this.currentViewType === 'ALL' || !!this.searchText.trim() || !!filters.colour || hasDc;
  }

  private fetchServerPage(): void {
    this.loadingLabel = 'Loading challans…';
    this.isLoading = true;
    this.loadFailed = false;
    this.tableData = [];
    this.cdr.markForCheck();
    const requestId = ++this.requestId;

    this.statusFilterService.search(this.buildPayload(this.pageNumber, this.pageSize)).subscribe({
      next: (res: any) => {
        if (requestId !== this.requestId) return;
        this.usingClientResults = false;
        this.wideCapped = false;
        if (res && res.success && res.data && res.data.length > 0) {
          const kind = this.currentViewType === 'M' ? 'Meter' : 'Size';
          this.tableData = res.data.map((item: any, index: number) => this.mapRow(item, index, kind));
          this.totalRecords = res.totalRecords || 0;
          this.totalPages = res.totalPages || 0;
          this.summaryTotals = this.readSummary(res.summary);
        } else {
          this.tableData = [];
          this.totalRecords = 0;
          this.totalPages = 0;
          this.summaryTotals = { totalBitsCount: 0, totalMeter: 0 };
          if (res && !res.success && res.message) {
            this.messageService.error(res.message);
          }
        }
        this.hasLoaded = true;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: HttpErrorResponse) => this.handleLoadError(err, requestId)
    });
  }

  private fetchClientQuery(key: string): void {
    this.loadingLabel = 'Loading challans…';
    this.isLoading = true;
    this.loadFailed = false;
    this.tableData = [];
    this.cdr.markForCheck();
    const requestId = ++this.requestId;
    const requests = this.currentViewType === 'ALL'
      ? [
          this.statusFilterService.search(this.buildPayload(1, this.fetchCap, 'SIZE')),
          this.statusFilterService.search(this.buildPayload(1, this.fetchCap, 'METER'))
        ]
      : [this.statusFilterService.search(this.buildPayload(1, this.fetchCap))];

    forkJoin(requests).subscribe({
      next: (responses: any[]) => {
        if (requestId !== this.requestId) return;
        const rows: any[] = [];
        let capped = false;
        responses.forEach((res, index) => {
          const data = res?.success && Array.isArray(res.data) ? res.data : [];
          const total = Number(res?.totalRecords || 0);
          if (total > data.length) capped = true;
          const kind = this.currentViewType === 'ALL'
            ? (index === 0 ? 'Size' : 'Meter')
            : (this.currentViewType === 'M' ? 'Meter' : 'Size');
          data.forEach((item: any, itemIndex: number) => rows.push(this.mapRow(item, itemIndex, kind)));
        });
        rows.sort((a, b) => this.compareRows(a, b));
        this.wideKey = key;
        this.wideRows = rows;
        this.wideLoaded = true;
        this.wideCapped = capped;
        this.applyClientSlice();
        this.hasLoaded = true;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: HttpErrorResponse) => this.handleLoadError(err, requestId)
    });
  }

  private applyClientSlice(): void {
    const filtered = this.filterRows(this.wideRows);
    const pages = filtered.length ? Math.ceil(filtered.length / this.pageSize) : 0;
    if (pages > 0 && this.pageNumber > pages) this.pageNumber = pages;
    const start = (this.pageNumber - 1) * this.pageSize;
    this.tableData = filtered.slice(start, start + this.pageSize);
    this.totalRecords = filtered.length;
    this.totalPages = pages;
    this.usingClientResults = true;
    this.summaryTotals = {
      totalBitsCount: filtered.reduce((sum, row) => sum + Number(row.bitsCount || 0), 0),
      totalMeter: filtered.reduce((sum, row) => sum + Number(row.totalMeter || 0), 0)
    };
    this.hasLoaded = true;
  }

  private filterRows(rows: any[]): any[] {
    const query = this.searchText.trim().toLowerCase();
    const colour = String(this.currentFilters?.colour || '').trim().toLowerCase();
    const challans = (Array.isArray(this.currentFilters?.deliveryChallans) ? this.currentFilters.deliveryChallans : [])
      .map((value: any) => String(value).trim().toLowerCase())
      .filter(Boolean);

    return rows.filter((row) => {
      const colourText = String(row.colour || '').toLowerCase();
      const colourParts = colourText.split(',').map((part) => part.trim());
      if (colour && colourText !== colour && !colourParts.includes(colour)) return false;
      if (challans.length && !challans.includes(String(row.dcNo || '').trim().toLowerCase())) return false;
      if (!query) return true;
      const haystack = [row.dcNo, row.companyName, row.styleNo, row.designName, row.colour, row.date, row.entryKind]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }

  private buildPayload(pageNumber: number, pageSize: number, viewType?: string): any {
    const mode = viewType
      || (this.currentViewType === 'S' ? 'SIZE' : (this.currentViewType === 'M' ? 'METER' : 'ALL'));
    return {
      CompanyId: this.currentFilters.companyId ? Number(this.currentFilters.companyId) : null,
      DesignId: this.currentFilters.designName || null,
      Colour: this.currentFilters.colour || null,
      FromDate: this.currentFilters.fromDate || null,
      ToDate: this.currentFilters.toDate || null,
      PageNumber: pageNumber,
      PageSize: pageSize,
      SortColumn: 'Date',
      SortDirection: this.sortDirection,
      StyleId: this.currentFilters.styleNo || null,
      TransactionType: this.activeView.toUpperCase(),
      ViewType: mode
    };
  }

  private buildQueryKey(): string {
    const filters = this.currentFilters || {};
    return JSON.stringify({
      companyId: filters.companyId || null,
      styleNo: filters.styleNo || null,
      designName: filters.designName || null,
      fromDate: filters.fromDate || null,
      toDate: filters.toDate || null,
      view: this.activeView,
      mode: this.currentViewType,
      sort: this.sortDirection
    });
  }

  private mapRow(item: any, index: number, entryKind: string): any {
    const rawDate = item.date || item.Date || item.createdDate;
    const parsedDate = new Date(rawDate);
    const formattedDate = !isNaN(parsedDate.getTime())
      ? `${parsedDate.getDate().toString().padStart(2, '0')}-${(parsedDate.getMonth() + 1).toString().padStart(2, '0')}-${parsedDate.getFullYear()}`
      : (rawDate || '-');

    return {
      sno: index + 1,
      date: formattedDate,
      rawDate: isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime(),
      companyName: item.companyName || item.CompanyName || '-',
      styleNo: item.styleNo || item.StyleNo || '-',
      designName: item.designName || item.DesignName || '-',
      colour: item.colour || item.Colour || '-',
      bitsCount: Number(item.totalBitsCount ?? item.TotalBitsCount ?? 0),
      totalMeter: Number(item.totalMeter ?? item.TotalMeter ?? 0),
      dcNo: item.dcNo || item.DcNo || '-',
      entryKind,
      fullData: item
    };
  }

  private compareRows(a: any, b: any): number {
    const diff = (a.rawDate || 0) - (b.rawDate || 0);
    return this.sortDirection === 'ASC' ? diff : -diff;
  }

  private readSummary(summary: any): { totalBitsCount: number; totalMeter: number } {
    return {
      totalBitsCount: Number(summary?.totalBitsCount ?? summary?.TotalBitsCount ?? 0),
      totalMeter: Number(summary?.totalMeter ?? summary?.TotalMeter ?? 0)
    };
  }

  private handleLoadError(err: HttpErrorResponse, requestId: number): void {
    if (requestId !== this.requestId) return;
    const errorMsg = err.error?.message || err.message || 'Unknown error';
    this.messageService.error(`Could not load challans (${err.status}): ${errorMsg}`);
    console.error('Error loading filter data:', err);
    this.tableData = [];
    this.totalRecords = 0;
    this.totalPages = 0;
    this.summaryTotals = { totalBitsCount: 0, totalMeter: 0 };
    this.loadFailed = true;
    this.hasLoaded = true;
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  private invalidateWideCache(): void {
    this.wideLoaded = false;
    this.wideKey = '';
    this.wideRows = [];
    this.wideCapped = false;
  }

  private companyLabel(id: string | number): string {
    return this.companyNames.get(String(id)) || `Company ${id}`;
  }

  private formatChipDate(value: string | null): string {
    if (!value) return 'Any date';
    const parts = String(value).split('-').map(Number);
    if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) return String(value);
    return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
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
      const d = new Date();
      formattedToDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)).toISOString();
    }

    return {
      fromDate: formattedFromDate,
      toDate: formattedToDate,
      mode: this.activeView === 'inward' ? 'Inward' : 'Outward',
      type: this.currentViewType === 'S' ? 'Size' : (this.currentViewType === 'M' ? 'Meter' : 'All'),
      companyId: this.currentFilters.companyId ? Number(this.currentFilters.companyId) : null,
      styleNo: this.currentFilters.styleNo || null,
      designName: this.currentFilters.designName || null,
      colour: this.currentFilters.colour || null
    };
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

    const entryType = data?.entryType || rawData?.entryType || 'S';
    const companyId = Number(data?.companyId || data?.CompanyId || rawData?.companyId || rawData?.CompanyId || 0);
    const loadedCompanyId = readCompanyId(company);
    const companyGst = companyId > 0 && loadedCompanyId === companyId ? readCompanyGst(company) : '';

    const previewData: ChallanData = {
      company: {
        name: 'SS Embroidery',
        address: 'H.No: 1-2-3/A, Street Name, Area Name,\nCity, State - PIN',
        gst: ISSUER_COMPANY_GST,
        logo: null
      },
      companyId: companyId || loadedCompanyId || undefined,
      date: data?.createdDate || data?.outwardDate || new Date().toISOString(),
      dcNo: data?.dcNo || data?.outwardDcNo || data?.OutwardDcNo || '-',
      receiverName: company?.companyName || company?.CompanyName || data?.companyName || data?.receiverName || 'Company Name',
      receiverAddress: this.buildReceiverAddress(company, data),
      receiverGst: companyGst,
      items: items,
      totalQty,
      entryType: entryType,
      deliveryTo: data?.deliveryTo || rawData?.deliveryTo || '',
      poNo: data?.poNo || rawData?.poNo || '',
      weight: data?.weight || rawData?.weight || '',
      noOfBundles: data?.noOfBundles || rawData?.noOfBundles || '',
      supplierDcNo: data?.selectedDcNos && Array.isArray(data.selectedDcNos) ? data.selectedDcNos.join(', ') : (data?.selectedDcNos || ''),
      remarks: data?.remarks || rawData?.remarks || ''
    };

    if (entryType === 'M') {
      previewData.meterDetails = data?.meterDetails || [];
      previewData.totalMeterSum = previewData.meterDetails!.reduce((sum: number, md: any) => sum + (Number(md.totalMeter) || 0), 0);
      previewData.totalPiecesSum = previewData.meterDetails!.reduce((sum: number, md: any) => sum + (Number(md.piecesCount) || 0), 0);
      if (items.length > 0) {
        items[0].count = previewData.totalMeterSum;
      }
      previewData.totalQty = previewData.totalMeterSum;
    }

    this.outwardPreviewService.setPreviewData(previewData);
    this.isLoading = false;
    this.cdr.markForCheck();
    this.router.navigate(['/dashboard/outward/preview'], {
      queryParams: { from: 'delivery-challan' }
    });
  }

  private getSizeRows(data: any): { label: string; qty: number }[] {
    const rows = data?.sizeCounts || data?.sizes || data?.sizeBreakdown || [];
    if (!Array.isArray(rows)) return [];
    return rows.map((item: any) => ({
      label: item.size || item.label || item.sizeName || '',
      qty: Number(item.count ?? item.qty ?? item.quantity ?? 0)
    })).filter((item) => item.label);
  }

  private buildReceiverAddress(company: any, data: any): string {
    if (data?.receiverAddress) return data.receiverAddress;
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
}
