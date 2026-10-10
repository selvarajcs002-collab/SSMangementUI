import { Component, OnInit, ChangeDetectionStrategy, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CompanyService, CompanySummary } from '../../../core/services/company.service';
import { MachineProductionService } from '../../../core/services/machine-production.service';
import { CustomSelectComponent } from '../../../shared/components/custom-select/custom-select.component';
import { DatePipe } from '@angular/common';
import { AppDatePickerComponent } from '../../../shared/components/app-date-picker/app-date-picker.component';
import { ProductionExcelService } from '../../../excel/production-excel.service';
import { MessageService } from '../../../core/services/message.service';

export interface ProductionRecord {
  sNo: number;
  id: string | number;
  companyId: number | null;
  employeeName: string;
  machineName: string;
  totalProduction: number | null;
  styleName: string;
  designName: string;
  targetProduction: number | null;
  costPerPiece: number | null;
  productionCost: number | null;
  shift: string;
  status: string;
  createdDate?: string;
}

export interface ColumnDefinition {
  key: keyof ProductionRecord | 'actions' | 'companyName' | 'achievement';
  label: string;
  visible: boolean;
}

type DateScope = 'today' | 'month' | 'all';

@Component({
  selector: 'app-add-production-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CustomSelectComponent, AppDatePickerComponent],
  templateUrl: './add-production-dashboard.component.html',
  styleUrls: ['./add-production-dashboard.component.scss'],
  providers: [DatePipe, ProductionExcelService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddProductionDashboardComponent implements OnInit {
  activeShift = signal<'Day' | 'Night'>('Day');
  showAddModal = signal<boolean>(false);
  editingId = signal<string | number | null>(null);
  isSaving = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  loadError = signal<string>('');
  pendingDelete = signal<ProductionRecord | null>(null);
  isDeleting = signal<boolean>(false);
  acceptingId = signal<string | number | null>(null);
  fieldErrors = signal<Record<string, string>>({});

  isExportCardOpen = signal<boolean>(false);
  exportFromDate = signal<string>('');
  exportToDate = signal<string>('');
  isExporting = signal<boolean>(false);
  exportValidationError = signal<string | null>(null);

  companies = signal<CompanySummary[]>([]);
  productionForm: FormGroup;

  columns = signal<ColumnDefinition[]>([
    { key: 'sNo', label: 'S.No', visible: true },
    { key: 'createdDate', label: 'Date', visible: true },
    { key: 'companyName', label: 'Client', visible: true },
    { key: 'employeeName', label: 'Employee', visible: true },
    { key: 'machineName', label: 'Machine', visible: true },
    { key: 'totalProduction', label: 'Pieces made', visible: true },
    { key: 'achievement', label: 'Vs target', visible: true },
    { key: 'styleName', label: 'Style', visible: true },
    { key: 'designName', label: 'Design', visible: true },
    { key: 'targetProduction', label: 'Target', visible: false },
    { key: 'costPerPiece', label: 'Cost / piece', visible: true },
    { key: 'productionCost', label: 'Running cost', visible: true },
    { key: 'shift', label: 'Shift', visible: false },
    { key: 'status', label: 'Status', visible: true },
    { key: 'actions', label: 'Action', visible: true }
  ]);

  showColumnDropdown = signal<boolean>(false);
  searchText = signal<string>('');
  dateScope = signal<DateScope>('all');
  sortColumn = signal<string>('createdDate');
  sortDirection = signal<'asc' | 'desc'>('desc');
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  private dayCache = signal<ProductionRecord[]>([]);
  private nightCache = signal<ProductionRecord[]>([]);
  dayServerTotal = signal<number>(0);
  nightServerTotal = signal<number>(0);
  readonly fetchCap = 5000;

  records = computed(() => this.activeShift() === 'Day' ? this.dayCache() : this.nightCache());
  fullRecords = computed(() => [...this.dayCache(), ...this.nightCache()]);
  visibleColumnCount = computed(() => this.columns().filter(col => col.visible).length);

  filteredRecords = computed(() => {
    const query = this.searchText().trim().toLowerCase();
    const scope = this.dateScope();
    const today = this.toLocalDateKey(new Date());
    const month = today.slice(0, 7);
    let rows = this.records();

    if (scope === 'today') {
      rows = rows.filter(row => this.toLocalDateKey(row.createdDate) === today);
    } else if (scope === 'month') {
      rows = rows.filter(row => this.toLocalDateKey(row.createdDate).startsWith(month));
    }

    if (query) {
      rows = rows.filter(row => {
        const client = this.companyName(row.companyId).toLowerCase();
        const haystack = [
          row.employeeName, row.machineName, row.styleName, row.designName,
          row.status, row.shift, client, row.createdDate
        ].join(' ').toLowerCase();
        return haystack.includes(query);
      });
    }

    const column = this.sortColumn();
    const direction = this.sortDirection() === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => this.compareRows(a, b, column) * direction);
  });

  paginatedRecords = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredRecords()
      .slice(start, start + this.pageSize())
      .map((row, index) => ({ ...row, sNo: start + index + 1 }));
  });

  totalRecords = computed(() => this.filteredRecords().length);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalRecords() / this.pageSize())));

  todayDayProduction = computed(() => this.sumToday('Day', 'totalProduction'));
  todayNightProduction = computed(() => this.sumToday('Night', 'totalProduction'));
  todayDayTarget = computed(() => this.sumToday('Day', 'targetProduction'));
  todayNightTarget = computed(() => this.sumToday('Night', 'targetProduction'));
  pendingCount = computed(() => this.fullRecords().filter(row => this.isPending(row.status)).length);

  yesterdayDateLabel = computed(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.datePipe.transform(yesterday, 'dd MMM') || '';
  });

  todayDateLabel = computed(() => this.datePipe.transform(new Date(), 'dd MMM') || 'Today');

  yesterdayTotalCost = computed(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const key = this.toLocalDateKey(yesterday);
    return this.fullRecords()
      .filter(row => this.toLocalDateKey(row.createdDate) === key)
      .reduce((sum, row) => sum + (Number(row.productionCost) || 0), 0);
  });

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private machineProductionService: MachineProductionService,
    private productionExcelService: ProductionExcelService,
    private messageService: MessageService,
    private datePipe: DatePipe
  ) {
    this.productionForm = this.fb.group({
      companyId: [null],
      employeeName: [''],
      machineName: [''],
      totalProduction: [null],
      styleName: [''],
      designName: [''],
      targetProduction: [null],
      costPerPiece: [null],
      shift: ['Day']
    });
  }

  ngOnInit(): void {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    this.exportFromDate.set(this.datePipe.transform(monthStart, 'yyyy-MM-dd') || '');
    this.exportToDate.set(this.datePipe.transform(today, 'yyyy-MM-dd') || '');
    this.loadCompanies();
    this.loadAll();
  }

  loadCompanies(): void {
    this.companyService.getCompanies().subscribe({
      next: (res) => {
        if (res && res.length > 0) this.companies.set(res);
      },
      error: () => this.messageService.error('The client list did not load.')
    });
  }

  loadAll(): void {
    this.isLoading.set(true);
    this.loadError.set('');
    forkJoin([
      this.machineProductionService.getPaginated(1, this.fetchCap, 'Day'),
      this.machineProductionService.getPaginated(1, this.fetchCap, 'Night')
    ]).subscribe({
      next: ([dayRes, nightRes]) => {
        this.dayCache.set(this.unwrapRows(dayRes).map((row, index) => this.toRecord(row, index + 1)));
        this.nightCache.set(this.unwrapRows(nightRes).map((row, index) => this.toRecord(row, index + 1)));
        this.dayServerTotal.set(Number(this.field(dayRes, 'totalRecords') ?? this.dayCache().length));
        this.nightServerTotal.set(Number(this.field(nightRes, 'totalRecords') ?? this.nightCache().length));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.loadError.set('The production list did not load. Check the connection and try again.');
      }
    });
  }

  refresh(): void {
    this.loadAll();
  }

  setShift(shift: 'Day' | 'Night'): void {
    if (this.activeShift() === shift) return;
    this.activeShift.set(shift);
    this.currentPage.set(1);
  }

  setDateScope(scope: DateScope): void {
    this.dateScope.set(scope);
    this.currentPage.set(1);
  }

  onSearch(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  clearSearch(): void {
    this.searchText.set('');
    this.currentPage.set(1);
  }

  toggleColumnDropdown(event: Event): void {
    event.stopPropagation();
    this.showColumnDropdown.update(open => !open);
    this.isExportCardOpen.set(false);
  }

  toggleColumnVisibility(colKey: string): void {
    if (colKey === 'actions' || colKey === 'sNo') return;
    this.columns.update(cols =>
      cols.map(col => col.key === colKey ? { ...col, visible: !col.visible } : col)
    );
  }

  sortBy(colKey: string): void {
    if (this.sortColumn() === colKey) {
      this.sortDirection.update(direction => direction === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(colKey);
      this.sortDirection.set(colKey === 'createdDate' ? 'desc' : 'asc');
    }
    this.currentPage.set(1);
  }

  isColumnVisible(key: string): boolean {
    return this.columns().some(col => col.key === key && col.visible);
  }

  pageStart(): number {
    if (this.totalRecords() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  }

  pageEnd(): number {
    return Math.min(this.currentPage() * this.pageSize(), this.totalRecords());
  }

  onPageSize(event: Event): void {
    this.pageSize.set(Number((event.target as HTMLSelectElement).value) || 10);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  openAddModal(): void {
    this.editingId.set(null);
    this.fieldErrors.set({});
    const storedCompany = localStorage.getItem('companyId');
    this.productionForm.reset({
      companyId: storedCompany ? Number(storedCompany) : null,
      employeeName: '',
      machineName: '',
      totalProduction: null,
      styleName: '',
      designName: '',
      targetProduction: null,
      costPerPiece: null,
      shift: this.activeShift()
    });
    this.showAddModal.set(true);
  }

  openEditModal(row: ProductionRecord): void {
    this.editingId.set(row.id);
    this.fieldErrors.set({});
    this.productionForm.reset({
      companyId: row.companyId,
      employeeName: row.employeeName || '',
      machineName: row.machineName || '',
      totalProduction: row.totalProduction,
      styleName: row.styleName || '',
      designName: row.designName || '',
      targetProduction: row.targetProduction,
      costPerPiece: row.costPerPiece,
      shift: this.normalizeShift(row.shift)
    });
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    if (this.isSaving()) return;
    this.editingId.set(null);
    this.fieldErrors.set({});
    this.showAddModal.set(false);
  }

  setFormShift(shift: 'Day' | 'Night'): void {
    this.productionForm.patchValue({ shift });
    this.fieldErrors.update(errors => {
      const next = { ...errors };
      delete next['shift'];
      return next;
    });
  }

  deleteProduction(row: ProductionRecord): void {
    this.pendingDelete.set(row);
  }

  cancelDelete(): void {
    if (this.isDeleting()) return;
    this.pendingDelete.set(null);
  }

  confirmDelete(): void {
    const row = this.pendingDelete();
    if (!row || this.isDeleting()) return;
    this.isDeleting.set(true);
    this.machineProductionService.delete(row.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.pendingDelete.set(null);
        this.messageService.success('Production entry deleted.');
        this.loadAll();
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.messageService.error(err?.error?.message || 'Could not delete this production entry.');
      }
    });
  }

  acceptProduction(row: ProductionRecord): void {
    if (!this.canApprove() || this.acceptingId()) return;
    this.acceptingId.set(row.id);
    this.machineProductionService.update(row.id, this.payloadFromRow(row, 'Accept')).subscribe({
      next: () => {
        this.acceptingId.set(null);
        this.messageService.success(`Accepted the entry for ${row.employeeName || row.machineName || 'this machine'}.`);
        this.loadAll();
      },
      error: (err) => {
        this.acceptingId.set(null);
        this.messageService.error(err?.error?.message || 'Could not accept this entry.');
      }
    });
  }

  saveProduction(): void {
    const errors = this.validateForm();
    this.fieldErrors.set(errors);
    if (Object.keys(errors).length > 0 || this.isSaving()) return;

    const formVal = this.productionForm.getRawValue();
    const editingId = this.editingId();
    const status = editingId
      ? (this.records().find(row => row.id === editingId)?.status || (this.canApprove() ? 'Accept' : 'Pending'))
      : (this.canApprove() ? 'Accept' : 'Pending');

    const payload = {
      employeeName: this.asText(formVal.employeeName),
      machineName: this.asText(formVal.machineName),
      shift: this.normalizeShift(formVal.shift),
      styleName: this.asText(formVal.styleName),
      designName: this.asText(formVal.designName),
      totalProduction: this.asNumber(formVal.totalProduction),
      targetProduction: this.asNumber(formVal.targetProduction),
      costPerPiece: this.asNumber(formVal.costPerPiece),
      productionCost: this.runningCost(),
      status,
      companyId: this.asNumber(formVal.companyId)
    };

    this.isSaving.set(true);
    const request = editingId != null
      ? this.machineProductionService.update(editingId, payload)
      : this.machineProductionService.add(payload);

    request.subscribe({
      next: () => {
        this.isSaving.set(false);
        const savedShift = this.normalizeShift(formVal.shift);
        this.activeShift.set(savedShift);
        this.currentPage.set(1);
        this.closeAddModal();
        this.messageService.success(status === 'Pending'
          ? 'Saved. A supervisor still needs to accept this entry.'
          : (editingId != null ? 'Production entry updated.' : 'Production entry saved.'));
        this.loadAll();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.messageService.error(err?.error?.message || (editingId != null
          ? 'Could not update this production entry.'
          : 'Could not save this production entry.'));
      }
    });
  }

  runningCost(): number | null {
    const pieces = this.asNumber(this.productionForm.get('totalProduction')?.value);
    const rate = this.asNumber(this.productionForm.get('costPerPiece')?.value);
    if (pieces == null || rate == null) return null;
    return pieces * rate;
  }

  targetSummary(): string {
    const gap = this.targetGap();
    if (gap == null) return 'Add a target to compare';
    if (gap < 0) return `${Math.abs(gap)} pieces short`;
    if (gap > 0) return `${gap} pieces over target`;
    return 'Target met';
  }

  targetGap(): number | null {
    const pieces = this.asNumber(this.productionForm.get('totalProduction')?.value);
    const target = this.asNumber(this.productionForm.get('targetProduction')?.value);
    if (pieces == null || target == null) return null;
    return pieces - target;
  }

  achievementPercent(row: ProductionRecord): number {
    const target = Number(row.targetProduction) || 0;
    if (target <= 0) return 0;
    return Math.min(100, Math.round(((Number(row.totalProduction) || 0) / target) * 100));
  }

  achievementLabel(row: ProductionRecord): string {
    const made = Number(row.totalProduction) || 0;
    const target = Number(row.targetProduction) || 0;
    if (target <= 0) return 'No target';
    const gap = made - target;
    if (gap === 0) return `${made} / ${target} · target met`;
    if (gap > 0) return `${made} / ${target} · ${gap} over`;
    return `${made} / ${target} · ${Math.abs(gap)} short`;
  }

  companyName(id: number | null): string {
    if (!id) return '-';
    const match = this.companies().find(company => Number(company.key) === Number(id));
    return match?.value || `Client ${id}`;
  }

  statusLabel(status: string): string {
    if (this.isPending(status)) return 'Waiting';
    if (String(status || '').toLowerCase().startsWith('accept')) return 'Accepted';
    return status || '-';
  }

  isPending(status: string): boolean {
    return String(status || '').trim().toLowerCase().startsWith('pend');
  }

  canApprove(): boolean {
    const role = (localStorage.getItem('userRole') || localStorage.getItem('role') || '').toLowerCase();
    const email = (localStorage.getItem('userEmail') || '').toLowerCase();
    return role.includes('admin') || email.includes('admin') || !role.includes('emp');
  }

  targetHint(made: number, target: number): string {
    if (!target) return 'No target set';
    const percent = Math.round((made / target) * 100);
    return `${percent}% of ${target} target`;
  }

  shiftIsCapped(): boolean {
    const loaded = this.records().length;
    const total = this.activeShift() === 'Day' ? this.dayServerTotal() : this.nightServerTotal();
    return total > loaded;
  }

  private validateForm(): Record<string, string> {
    const formVal = this.productionForm.getRawValue();
    const errors: Record<string, string> = {};
    if (this.asNumber(formVal.companyId) == null) {
      errors['companyId'] = 'Choose the client this work is for.';
    }
    if (!this.asText(formVal.employeeName) && !this.asText(formVal.machineName)) {
      errors['employeeName'] = 'Enter the employee or the machine.';
    }
    const shift = this.normalizeShift(formVal.shift);
    if (shift !== 'Day' && shift !== 'Night') {
      errors['shift'] = 'Choose day or night.';
    }
    const pieces = this.asNumber(formVal.totalProduction);
    if (pieces == null) {
      errors['totalProduction'] = 'Enter how many pieces were made.';
    } else if (pieces < 0) {
      errors['totalProduction'] = 'Pieces cannot be negative.';
    }
    const target = this.asNumber(formVal.targetProduction);
    if (target != null && target < 0) {
      errors['targetProduction'] = 'Target cannot be negative.';
    }
    const rate = this.asNumber(formVal.costPerPiece);
    if (rate != null && rate < 0) {
      errors['costPerPiece'] = 'Cost cannot be negative.';
    }
    return errors;
  }

  private payloadFromRow(row: ProductionRecord, status: string) {
    return {
      employeeName: row.employeeName || null,
      machineName: row.machineName || null,
      shift: this.normalizeShift(row.shift),
      styleName: row.styleName || null,
      designName: row.designName || null,
      totalProduction: row.totalProduction,
      targetProduction: row.targetProduction,
      costPerPiece: row.costPerPiece,
      productionCost: row.productionCost,
      status,
      companyId: row.companyId
    };
  }

  private sumToday(shift: 'Day' | 'Night', field: 'totalProduction' | 'targetProduction'): number {
    const today = this.toLocalDateKey(new Date());
    return this.fullRecords()
      .filter(row => this.normalizeShift(row.shift) === shift && this.toLocalDateKey(row.createdDate) === today)
      .reduce((sum, row) => sum + (Number(row[field]) || 0), 0);
  }

  private compareRows(a: ProductionRecord, b: ProductionRecord, column: string): number {
    const value = (row: ProductionRecord): string | number => {
      if (column === 'companyName') return this.companyName(row.companyId).toLowerCase();
      if (column === 'achievement') return this.achievementPercent(row);
      if (column === 'createdDate') return this.toLocalDateKey(row.createdDate) || '';
      if (column === 'sNo') return Number(row.id) || 0;
      const raw = (row as any)[column];
      if (typeof raw === 'number') return raw;
      return String(raw ?? '').toLowerCase();
    };
    const left = value(a);
    const right = value(b);
    if (left < right) return -1;
    if (left > right) return 1;
    return (Number(a.id) || 0) - (Number(b.id) || 0);
  }

  private toRecord(row: any, sNo: number): ProductionRecord {
    const totalProduction = this.asNumber(this.field(row, 'totalProduction'));
    const costPerPiece = this.asNumber(this.field(row, 'costPerPiece'));
    const rawCost = this.field(row, 'productionCost');
    const productionCost = rawCost === null || rawCost === undefined || rawCost === ''
      ? (totalProduction != null && costPerPiece != null ? totalProduction * costPerPiece : null)
      : this.asNumber(rawCost);
    const id = this.field(row, 'id');

    return {
      sNo,
      id: id ?? sNo,
      companyId: this.asNumber(this.field(row, 'companyId')),
      employeeName: this.asText(this.field(row, 'employeeName')) || '',
      machineName: this.asText(this.field(row, 'machineName')) || '',
      totalProduction,
      styleName: this.asText(this.field(row, 'styleName')) || '',
      designName: this.asText(this.field(row, 'designName')) || '',
      targetProduction: this.asNumber(this.field(row, 'targetProduction')),
      costPerPiece,
      productionCost,
      shift: this.asText(this.field(row, 'shift')) || '',
      status: this.asText(this.field(row, 'status')) || '',
      createdDate: this.asText(this.field(row, 'createdDate')) || undefined
    };
  }

  private unwrapRows(res: any): any[] {
    if (Array.isArray(res)) return res;
    const candidates = [res?.data, res?.Data, res?.result, res?.Result, res?.items, res?.Items, res?.records, res?.Records];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate;
      if (Array.isArray(candidate?.data)) return candidate.data;
      if (Array.isArray(candidate?.records)) return candidate.records;
      if (Array.isArray(candidate?.items)) return candidate.items;
    }
    return [];
  }

  private field(row: any, name: string): any {
    if (!row || typeof row !== 'object') return null;
    if (row[name] !== undefined) return row[name];
    const pascal = name.charAt(0).toUpperCase() + name.slice(1);
    if (row[pascal] !== undefined) return row[pascal];
    const match = Object.keys(row).find(key => key.toLowerCase() === name.toLowerCase());
    return match ? row[match] : null;
  }

  private asText(value: unknown): string | null {
    if (value === null || value === undefined || value === '') return null;
    return String(value).trim();
  }

  private asNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }

  normalizeShift(shift: unknown): 'Day' | 'Night' {
    return String(shift ?? '').trim().toLowerCase().startsWith('night') ? 'Night' : 'Day';
  }

  private toLocalDateKey(value: unknown): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) return '';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  toggleExportCard(event: Event): void {
    event.stopPropagation();
    this.isExportCardOpen.update(open => !open);
    this.showColumnDropdown.set(false);
    if (this.isExportCardOpen()) this.exportValidationError.set(null);
  }

  closeExportCard(): void {
    this.isExportCardOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.column-select-wrapper')) {
      this.showColumnDropdown.set(false);
    }
    if (this.isExportCardOpen() && !target.closest('.export-dropdown-menu') && !target.closest('.date-picker-popup') && !target.closest('.date-picker-container')) {
      this.isExportCardOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showAddModal() && !this.isSaving()) {
      this.closeAddModal();
      return;
    }
    if (this.pendingDelete() && !this.isDeleting()) {
      this.cancelDelete();
      return;
    }
    this.isExportCardOpen.set(false);
    this.showColumnDropdown.set(false);
  }

  validateDates(): boolean {
    const from = this.exportFromDate();
    const to = this.exportToDate();

    if (!from) {
      this.exportValidationError.set('Please select From Date.');
      return false;
    }
    if (!to) {
      this.exportValidationError.set('Please select To Date.');
      return false;
    }

    const dFrom = new Date(from);
    const dTo = new Date(to);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (isNaN(dFrom.getTime()) || isNaN(dTo.getTime())) {
      this.exportValidationError.set('Please select a valid date.');
      return false;
    }
    if (dFrom > today) {
      this.exportValidationError.set('From Date cannot be later than today.');
      return false;
    }
    if (dTo > today) {
      this.exportValidationError.set('To Date cannot be a future date.');
      return false;
    }
    if (dFrom > dTo) {
      this.exportValidationError.set('From Date cannot be later than To Date.');
      return false;
    }

    this.exportValidationError.set(null);
    return true;
  }

  exportExcel(): void {
    if (!this.validateDates()) return;
    this.isExporting.set(true);
    this.productionExcelService.generateAndDownload(this.exportFromDate(), this.exportToDate()).then(() => {
      this.isExporting.set(false);
      this.closeExportCard();
      this.exportValidationError.set(null);
      this.messageService.success('Production Excel downloaded.');
    }).catch(e => {
      if (e.status === 401 || e.status === 403) {
        this.exportValidationError.set('You do not have permission to export.');
      } else if (e.status === 0 || e.status === 504) {
        this.exportValidationError.set('Unable to connect to the server. Please check your connection and try again.');
      } else if (e.status === 400 || e.status === 404) {
        this.exportValidationError.set('No production records found or invalid request.');
      } else {
        this.exportValidationError.set('Unable to export production data. Please try again.');
      }
      this.isExporting.set(false);
    });
  }
}
