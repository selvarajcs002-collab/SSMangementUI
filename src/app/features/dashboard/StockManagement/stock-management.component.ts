import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CompanyService } from '../../../core/services/company.service';
import { StockManagementService, StockSummary, StockBalanceSizeWise, LastTransaction } from '../../../core/services/stock-management.service';
import { MessageService } from '../../../core/services/message.service';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { DashboardFilterStateService } from '../../../core/services/dashboard-filter-state.service';
import { DashboardFilterDialogComponent } from '../dashboard-filter-dialog/dashboard-filter-dialog.component';
import { ExcelReportService } from '../../../excel/excel-report.service';
import { StockManagementExcelService } from '../../../excel/stock-management-excel.service';

type SizeStatusFilter = 'all' | 'attention' | 'ok' | 'low' | 'out' | 'negative';
type TxTypeFilter = 'ALL' | 'INWARD' | 'OUTWARD';
type DatePreset = 'today' | '7d' | 'month' | 'lastMonth';
type SummaryCard = 'inward' | 'outward' | 'available' | 'todayIn' | 'todayOut' | 'low';

@Component({
  selector: 'app-stock-management',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeHtmlPipe, LoaderComponent, DashboardFilterDialogComponent],
  templateUrl: './stock-management.component.html',
  styleUrl: './stock-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockManagementComponent implements OnInit, OnDestroy {
  companyOptions: { key: string; value: string }[] = [];
  currentFilters: any = {};
  private filterSub?: Subscription;
  private loadSub?: Subscription;
  private companySub?: Subscription;
  private requestId = 0;

  readonly lowStockThreshold = 10;
  readonly transactionCapHintAt = 50;

  loading = false;
  isExporting = false;
  loadError = '';
  balanceLoaded = false;

  summary: StockSummary | null = null;
  stockBalanceData: StockBalanceSizeWise[] = [];
  transactionsData: LastTransaction[] = [];

  sizeSearch = '';
  sizeStatusFilter: SizeStatusFilter = 'all';
  sbSortKey: 'size' | 'totalInward' | 'totalOutward' | 'available' = 'size';
  sbSortDir: 'asc' | 'desc' = 'asc';
  visibleStockRows: StockBalanceSizeWise[] = [];

  sbPageNumber = 1;
  sbPageSize = 10;
  sbTotalPages = 1;
  sbPaginatedData: StockBalanceSizeWise[] = [];
  sbTotalInward = 0;
  sbTotalOutward = 0;
  sbTotalAvailable = 0;
  overallInward = 0;
  overallOutward = 0;
  overallAvailable = 0;

  txSearch = '';
  txType: TxTypeFilter = 'ALL';
  txTodayOnly = false;
  filteredTransactions: LastTransaction[] = [];
  ltPageNumber = 1;
  ltPageSize = 10;
  ltTotalPages = 1;
  ltPaginatedData: LastTransaction[] = [];
  ltTotalInward = 0;
  ltTotalOutward = 0;
  ltSortDirection: 'asc' | 'desc' = 'desc';

  activeCard: SummaryCard | null = null;
  isFilterModalOpen = false;
  isViewAllModalOpen = false;

  icons = {
    download: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
    upload: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>`,
    boxes: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    calendarOrange: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    calendarTeal: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    alertTriangle: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    arrowUp: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`,
    arrowDown: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
    arrowRight: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
    excel: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    filter: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,
    refresh: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
    search: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`
  };

  constructor(
    private companyService: CompanyService,
    private stockService: StockManagementService,
    private messageService: MessageService,
    private filterStateService: DashboardFilterStateService,
    private cdr: ChangeDetectorRef,
    private excelReportService: ExcelReportService,
    private smExcelService: StockManagementExcelService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.companySub = this.companyService.getCompanies().subscribe({
      next: (res: any) => {
        this.companyOptions = Array.isArray(res)
          ? res.map((c: any) => ({ key: String(c.key), value: c.value }))
          : [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.companyOptions = [];
        this.cdr.markForCheck();
      }
    });

    this.filterSub = this.filterStateService.state$.subscribe(state => {
      this.currentFilters = state;
      this.loadInitialData();
    });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    this.filterStateService.resetState();
    this.filterSub?.unsubscribe();
    this.loadSub?.unsubscribe();
    this.companySub?.unsubscribe();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isViewAllModalOpen) {
      this.closeViewAllModal();
    } else if (this.isFilterModalOpen) {
      this.closeFilterModal();
    }
  }

  get periodLabel(): string {
    const from = this.formatDisplayDate(this.currentFilters?.fromDate);
    const to = this.formatDisplayDate(this.currentFilters?.toDate);
    if (from === '-' && to === '-') return 'All dates';
    return `${from} to ${to}`;
  }

  get activePreset(): DatePreset | '' {
    const from = this.currentFilters?.fromDate;
    const to = this.currentFilters?.toDate;
    const today = new Date();
    if (from === this.toIso(today) && to === this.toIso(today)) return 'today';
    const week = new Date(today);
    week.setDate(today.getDate() - 6);
    if (from === this.toIso(week) && to === this.toIso(today)) return '7d';
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    if (from === this.toIso(monthStart) && to === this.toIso(today)) return 'month';
    const lastStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    if (from === this.toIso(lastStart) && to === this.toIso(lastEnd)) return 'lastMonth';
    return '';
  }

  get hasNarrowingFilters(): boolean {
    const f = this.currentFilters || {};
    return !!(f.companyId || f.styleNo || f.designName || f.colour || (f.isDcBased && f.deliveryChallans?.length));
  }

  get dcSummary(): string {
    const list: string[] = this.currentFilters?.deliveryChallans || [];
    if (!list.length) return '';
    if (list.length <= 2) return list.join(', ');
    return `${list.slice(0, 2).join(', ')} +${list.length - 2} more`;
  }

  get lowStockCount(): number {
    return this.stockBalanceData.filter(row => (row.available ?? 0) <= this.lowStockThreshold).length;
  }

  get outOfStockCount(): number {
    return this.stockBalanceData.filter(row => (row.available ?? 0) === 0).length;
  }

  get negativeStockCount(): number {
    return this.stockBalanceData.filter(row => (row.available ?? 0) < 0).length;
  }

  get healthyStockCount(): number {
    return this.stockBalanceData.filter(row => (row.available ?? 0) > this.lowStockThreshold).length;
  }

  get lowOnlyCount(): number {
    return Math.max(0, this.lowStockCount - this.outOfStockCount - this.negativeStockCount);
  }

  get trendsArePlaceholder(): boolean {
    const s = this.summary;
    if (!s) return true;
    return Number(s.totalInwardPercent) === 15
      && Number(s.totalOutwardPercent) === 10
      && Number(s.availableStockPercent) === 5
      && Number(s.todaysInwardPercent) === 2
      && Number(s.todaysOutwardPercent) === -1.5;
  }

  get stockTotalsLabel(): string {
    return this.sizeSearch.trim() || this.sizeStatusFilter !== 'all' ? 'Filtered total' : 'Total';
  }

  get transactionTotalsLabel(): string {
    return this.txSearch.trim() || this.txType !== 'ALL' || this.txTodayOnly ? 'Filtered total' : 'Total';
  }

  get transactionCapReached(): boolean {
    const count = this.transactionsData.length;
    return count === this.transactionCapHintAt || count >= 500;
  }

  get inwardChipCount(): number {
    return this.transactionsForChips().filter(row => (row.type || '').toUpperCase() === 'INWARD').length;
  }

  get outwardChipCount(): number {
    return this.transactionsForChips().filter(row => (row.type || '').toUpperCase() === 'OUTWARD').length;
  }

  onRefresh(): void {
    this.loadInitialData();
  }

  setPreset(preset: DatePreset): void {
    const today = new Date();
    let from = new Date(today);
    let to = new Date(today);
    if (preset === '7d') {
      from.setDate(today.getDate() - 6);
    } else if (preset === 'month') {
      from = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (preset === 'lastMonth') {
      from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      to = new Date(today.getFullYear(), today.getMonth(), 0);
    }
    this.filterStateService.updateState({ fromDate: this.toIso(from), toDate: this.toIso(to) });
  }

  clearAllFilters(): void {
    this.filterStateService.resetState();
  }

  clearFilter(key: 'company' | 'style' | 'design' | 'colour' | 'dc'): void {
    if (key === 'company') {
      this.filterStateService.updateState({
        companyId: null,
        styleNo: null,
        designName: null,
        colour: null,
        isDcBased: false,
        deliveryChallans: []
      });
      return;
    }
    if (key === 'style') {
      this.filterStateService.updateState({
        styleNo: null,
        designName: null,
        colour: null,
        isDcBased: false,
        deliveryChallans: []
      });
      return;
    }
    if (key === 'design') {
      this.filterStateService.updateState({
        designName: null,
        colour: null,
        isDcBased: false,
        deliveryChallans: []
      });
      return;
    }
    if (key === 'colour') {
      this.filterStateService.updateState({ colour: null, isDcBased: false, deliveryChallans: [] });
      return;
    }
    this.filterStateService.updateState({ isDcBased: false, deliveryChallans: [] });
  }

  onSummaryCard(card: SummaryCard): void {
    if (this.activeCard === card) {
      this.activeCard = null;
      this.sizeStatusFilter = 'all';
      this.txType = 'ALL';
      this.txTodayOnly = false;
      this.applyStockView();
      this.applyTransactionView();
      this.cdr.markForCheck();
      return;
    }

    this.activeCard = card;
    if (card === 'low') {
      this.txType = 'ALL';
      this.txTodayOnly = false;
      this.sizeStatusFilter = 'attention';
      this.sbPageNumber = 1;
      this.applyStockView();
      this.applyTransactionView();
      this.scrollTo('stock-balance');
    } else if (card === 'todayIn' || card === 'todayOut') {
      this.sizeStatusFilter = 'all';
      this.txTodayOnly = true;
      this.txType = card === 'todayIn' ? 'INWARD' : 'OUTWARD';
      this.ltPageNumber = 1;
      this.applyStockView();
      this.applyTransactionView();
      this.scrollTo('transactions');
    } else if (card === 'inward' || card === 'outward') {
      this.sizeStatusFilter = 'all';
      this.txTodayOnly = false;
      this.txType = card === 'inward' ? 'INWARD' : 'OUTWARD';
      this.ltPageNumber = 1;
      this.applyStockView();
      this.applyTransactionView();
      this.scrollTo('transactions');
    } else {
      this.txType = 'ALL';
      this.txTodayOnly = false;
      this.sizeStatusFilter = 'all';
      this.sizeSearch = '';
      this.applyStockView();
      this.applyTransactionView();
      this.scrollTo('stock-balance');
    }
    this.cdr.markForCheck();
  }

  onSizeSearch(value: string): void {
    this.sizeSearch = value;
    this.sbPageNumber = 1;
    this.applyStockView();
  }

  setSizeStatus(filter: SizeStatusFilter): void {
    this.sizeStatusFilter = filter;
    this.activeCard = filter === 'attention' ? 'low' : (this.activeCard === 'low' ? null : this.activeCard);
    this.sbPageNumber = 1;
    this.applyStockView();
  }

  toggleSbSort(key: 'size' | 'totalInward' | 'totalOutward' | 'available'): void {
    if (this.sbSortKey === key) {
      this.sbSortDir = this.sbSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sbSortKey = key;
      this.sbSortDir = key === 'size' ? 'asc' : 'desc';
    }
    this.applyStockView();
  }

  onTxSearch(value: string): void {
    this.txSearch = value;
    this.ltPageNumber = 1;
    this.applyTransactionView();
  }

  setTxType(type: TxTypeFilter): void {
    this.txType = type;
    if (type === 'ALL') {
      this.activeCard = this.activeCard === 'inward' || this.activeCard === 'outward' || this.activeCard === 'todayIn' || this.activeCard === 'todayOut'
        ? null
        : this.activeCard;
    }
    this.ltPageNumber = 1;
    this.applyTransactionView();
  }

  toggleTodayOnly(): void {
    this.txTodayOnly = !this.txTodayOnly;
    if (!this.txTodayOnly && (this.activeCard === 'todayIn' || this.activeCard === 'todayOut')) {
      this.activeCard = null;
    }
    this.ltPageNumber = 1;
    this.applyTransactionView();
  }

  clearTransactionFilters(): void {
    this.txSearch = '';
    this.txType = 'ALL';
    this.txTodayOnly = false;
    if (this.activeCard === 'inward' || this.activeCard === 'outward' || this.activeCard === 'todayIn' || this.activeCard === 'todayOut') {
      this.activeCard = null;
    }
    this.ltPageNumber = 1;
    this.applyTransactionView();
  }

  private loadInitialData(): void {
    const requestId = ++this.requestId;
    this.loading = true;
    this.loadError = '';
    const filters = this.apiFilters();

    this.loadSub?.unsubscribe();
    this.loadSub = forkJoin({
      summary: this.stockService.getSummary(filters).pipe(catchError(() => of(null))),
      transactions: this.stockService.getLastTransactions(filters).pipe(catchError(() => of(null))),
      balance: this.stockService.getStockBalance(filters).pipe(catchError(() => of(null)))
    }).subscribe(result => {
      if (requestId !== this.requestId) return;

      const failed = [result.summary, result.transactions, result.balance].filter(part => part === null).length;
      this.summary = result.summary;
      this.transactionsData = result.transactions || [];
      this.stockBalanceData = result.balance || [];
      this.balanceLoaded = result.balance !== null;

      if (failed === 3) {
        this.loadError = 'Stock data could not be loaded. Check the connection and try again.';
      } else if (failed > 0) {
        this.loadError = 'Some stock figures could not be loaded. Refresh to try those sections again.';
      }

      this.sortTransactions();
      this.applyTransactionView();
      this.sbPageNumber = 1;
      this.applyStockView();
      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  private apiFilters(): any {
    const filters = { ...this.currentFilters };
    delete filters.mode;
    if (!filters.isDcBased) {
      delete filters.isDcBased;
      delete filters.deliveryChallans;
    }
    return filters;
  }

  private applyStockView(): void {
    let rows = [...this.stockBalanceData];
    const query = this.sizeSearch.trim().toLowerCase();
    if (query) {
      rows = rows.filter(row => (row.size || '').toLowerCase().includes(query));
    }
    if (this.sizeStatusFilter === 'attention') {
      rows = rows.filter(row => (row.available ?? 0) <= this.lowStockThreshold);
    } else if (this.sizeStatusFilter === 'negative') {
      rows = rows.filter(row => (row.available ?? 0) < 0);
    } else if (this.sizeStatusFilter === 'out') {
      rows = rows.filter(row => (row.available ?? 0) === 0);
    } else if (this.sizeStatusFilter === 'low') {
      rows = rows.filter(row => {
        const available = row.available ?? 0;
        return available > 0 && available <= this.lowStockThreshold;
      });
    } else if (this.sizeStatusFilter === 'ok') {
      rows = rows.filter(row => (row.available ?? 0) > this.lowStockThreshold);
    }

    rows.sort((a, b) => {
      const dir = this.sbSortDir === 'asc' ? 1 : -1;
      if (this.sbSortKey === 'size') return this.compareSize(a.size, b.size) * dir;
      return ((a[this.sbSortKey] || 0) - (b[this.sbSortKey] || 0)) * dir;
    });

    this.visibleStockRows = rows;
    this.overallInward = this.stockBalanceData.reduce((sum, row) => sum + (row.totalInward || 0), 0);
    this.overallOutward = this.stockBalanceData.reduce((sum, row) => sum + (row.totalOutward || 0), 0);
    this.overallAvailable = this.stockBalanceData.reduce((sum, row) => sum + (row.available || 0), 0);
    this.sbTotalInward = rows.reduce((sum, row) => sum + (row.totalInward || 0), 0);
    this.sbTotalOutward = rows.reduce((sum, row) => sum + (row.totalOutward || 0), 0);
    this.sbTotalAvailable = rows.reduce((sum, row) => sum + (row.available || 0), 0);
    this.updateSBPagination();
    this.cdr.markForCheck();
  }

  private applyTransactionView(): void {
    let rows = this.transactionsForChips();
    if (this.txType !== 'ALL') {
      rows = rows.filter(row => (row.type || '').toUpperCase() === this.txType);
    }
    const query = this.txSearch.trim().toLowerCase();
    if (query) {
      rows = rows.filter(row =>
        [row.dcNo, row.companyName, row.styleNo, row.designName, row.color, row.type]
          .join(' ')
          .toLowerCase()
          .includes(query)
      );
    }
    this.filteredTransactions = rows;
    this.ltTotalInward = rows.reduce((sum, row) => sum + (row.inwardQty || 0), 0);
    this.ltTotalOutward = rows.reduce((sum, row) => sum + (row.outwardQty || 0), 0);
    this.updateLTPagination();
    this.cdr.markForCheck();
  }

  private transactionsForChips(): LastTransaction[] {
    let rows = this.transactionsData || [];
    if (this.txTodayOnly) {
      const today = this.toIso(new Date());
      rows = rows.filter(row => this.dateKey(row.date) === today);
    }
    return rows;
  }

  private sortTransactions(): void {
    this.transactionsData.sort((a, b) => {
      const dateA = this.parseDate(a.date)?.getTime() ?? 0;
      const dateB = this.parseDate(b.date)?.getTime() ?? 0;
      return this.ltSortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }

  toggleLtSort(): void {
    this.ltSortDirection = this.ltSortDirection === 'asc' ? 'desc' : 'asc';
    this.sortTransactions();
    this.applyTransactionView();
  }

  getDisplayCompanyName(): string {
    const val = this.currentFilters?.companyId;
    if (!val) return 'All';
    const company = this.companyOptions.find(option => option.key === String(val));
    return company ? company.value : String(val);
  }

  getDisplayValue(field: string): string {
    const val = this.currentFilters?.[field];
    return val ? String(val) : 'All';
  }

  updateSBPagination(): void {
    this.sbTotalPages = Math.max(1, Math.ceil(this.visibleStockRows.length / this.sbPageSize));
    if (this.sbPageNumber > this.sbTotalPages) this.sbPageNumber = this.sbTotalPages;
    if (this.sbPageNumber < 1) this.sbPageNumber = 1;
    const startIndex = (this.sbPageNumber - 1) * this.sbPageSize;
    this.sbPaginatedData = this.visibleStockRows.slice(startIndex, startIndex + this.sbPageSize);
  }

  sbFirstPage(): void { this.moveSbPage(1); }
  sbLastPage(): void { this.moveSbPage(this.sbTotalPages); }
  sbNextPage(): void { this.moveSbPage(this.sbPageNumber + 1); }
  sbPrevPage(): void { this.moveSbPage(this.sbPageNumber - 1); }

  private moveSbPage(page: number): void {
    const next = Math.min(this.sbTotalPages, Math.max(1, page));
    if (next === this.sbPageNumber) return;
    this.sbPageNumber = next;
    this.updateSBPagination();
  }

  changeSbPageSize(event: Event): void {
    this.sbPageSize = parseInt((event.target as HTMLSelectElement).value, 10) || 10;
    this.sbPageNumber = 1;
    this.updateSBPagination();
  }

  updateLTPagination(): void {
    this.ltTotalPages = Math.max(1, Math.ceil(this.filteredTransactions.length / this.ltPageSize));
    if (this.ltPageNumber > this.ltTotalPages) this.ltPageNumber = this.ltTotalPages;
    if (this.ltPageNumber < 1) this.ltPageNumber = 1;
    const startIndex = (this.ltPageNumber - 1) * this.ltPageSize;
    this.ltPaginatedData = this.filteredTransactions.slice(startIndex, startIndex + this.ltPageSize);
  }

  ltFirstPage(): void { this.moveLtPage(1); }
  ltLastPage(): void { this.moveLtPage(this.ltTotalPages); }
  ltNextPage(): void { this.moveLtPage(this.ltPageNumber + 1); }
  ltPrevPage(): void { this.moveLtPage(this.ltPageNumber - 1); }

  private moveLtPage(page: number): void {
    const next = Math.min(this.ltTotalPages, Math.max(1, page));
    if (next === this.ltPageNumber) return;
    this.ltPageNumber = next;
    this.updateLTPagination();
  }

  changeLtPageSize(event: Event): void {
    this.ltPageSize = parseInt((event.target as HTMLSelectElement).value, 10) || 10;
    this.ltPageNumber = 1;
    this.updateLTPagination();
  }

  formatDisplayDate(dateStr: string | null | undefined): string {
    const date = this.parseDate(dateStr);
    if (!date) return '-';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate().toString().padStart(2, '0')}-${months[date.getMonth()]}-${date.getFullYear()}`;
  }

  formatPercent(value: number): string {
    const rounded = Math.round((Number(value) || 0) * 10) / 10;
    const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
    return `${rounded > 0 ? '+' : ''}${text}%`;
  }

  formatSigned(value: number): string {
    const amount = Number(value) || 0;
    const formatted = Math.abs(amount).toLocaleString();
    if (amount > 0) return `+${formatted}`;
    if (amount < 0) return `-${formatted}`;
    return '0';
  }

  trendClass(percent: number, higherIsGood: boolean): string {
    const value = Number(percent) || 0;
    if (value > 0) return higherIsGood ? 'text-green' : 'text-red';
    if (value < 0) return higherIsGood ? 'text-red' : 'text-green';
    return 'text-muted';
  }

  amountClass(value: number): string {
    const amount = Number(value) || 0;
    if (amount > 0) return 'text-green';
    if (amount < 0) return 'text-red';
    return 'text-muted';
  }

  stockStatus(available: number): 'negative' | 'out' | 'low' | 'ok' {
    const qty = Number(available) || 0;
    if (qty < 0) return 'negative';
    if (qty === 0) return 'out';
    if (qty <= this.lowStockThreshold) return 'low';
    return 'ok';
  }

  stockStatusLabel(available: number): string {
    const status = this.stockStatus(available);
    if (status === 'negative') return 'Negative';
    if (status === 'out') return 'Out';
    if (status === 'low') return 'Low';
    return 'In stock';
  }

  typeClass(type: string | null | undefined): string {
    return (type || '').toLowerCase();
  }

  netQty(item: LastTransaction): number {
    return (item.inwardQty || 0) - (item.outwardQty || 0);
  }

  sortMark(key: string): string {
    if (this.sbSortKey !== key) return '';
    return this.sbSortDir === 'asc' ? '↑' : '↓';
  }

  openTransaction(item: LastTransaction): void {
    if (!item?.id) return;
    const type = (item.type || '').toUpperCase();
    if (type === 'INWARD') {
      this.router.navigate(['/dashboard/inward', item.id]);
    } else if (type === 'OUTWARD') {
      this.router.navigate(['/dashboard/outward', item.id]);
    }
  }

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

  trackBySize(_: number, item: StockBalanceSizeWise): string {
    return item.size;
  }

  trackByTx(_: number, item: LastTransaction): string {
    return `${item.type}-${item.id}-${item.dcNo}`;
  }

  exportExcel(): void {
    this.isExporting = true;
    this.cdr.markForCheck();

    const payload = this.buildExcelReportPayload();
    payload.mode = 'All';

    this.excelReportService.getStockManagementReport(payload).subscribe({
      next: (res) => {
        res.companyName = this.getDisplayCompanyName();
        res.branch = 'Main Branch';
        this.smExcelService.generateAndDownload(res).then(() => {
          this.isExporting = false;
          this.messageService.success('Report exported successfully');
          this.cdr.markForCheck();
        }).catch(() => {
          this.isExporting = false;
          this.messageService.error('Error generating Excel file');
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.isExporting = false;
        this.messageService.error('Error fetching data for export');
        this.cdr.markForCheck();
      }
    });
  }

  private buildExcelReportPayload(): any {
    const payload: any = {
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
      payload.isDcBased = true;
      payload.deliveryChallans = this.currentFilters.deliveryChallans;
    }
    return payload;
  }

  private scrollTo(id: string): void {
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  private compareSize(a: string, b: string): number {
    return (a || '').localeCompare(b || '', undefined, { numeric: true, sensitivity: 'base' });
  }

  private parseDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private dateKey(dateStr: string | null | undefined): string {
    const date = this.parseDate(dateStr);
    return date ? this.toIso(date) : '';
  }

  private toIso(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }
}
