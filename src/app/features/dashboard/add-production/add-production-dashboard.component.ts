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
  key: keyof ProductionRecord | 'actions';
  label: string;
  visible: boolean;
}

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
  // Active shift toggle: 'Day' (Sun icon) or 'Night' (Moon icon)
  activeShift = signal<'Day' | 'Night'>('Day');

  // Modal State
  showAddModal = signal<boolean>(false);
  editingId = signal<string | number | null>(null);

  // Export State
  isExportCardOpen = signal<boolean>(false);
  exportFromDate = signal<string>('2026-05-01');
  exportToDate = signal<string>(''); // Will be set in ngOnInit
  isExporting = signal<boolean>(false);
  exportValidationError = signal<string | null>(null);

  // Configured Data
  companies = signal<CompanySummary[]>([]);

  // Production Form
  productionForm: FormGroup;

  // Grid Column Customization
  columns = signal<ColumnDefinition[]>([
    { key: 'sNo', label: 'S.No', visible: true },
    { key: 'createdDate', label: 'Date', visible: true },
    { key: 'employeeName', label: 'Employee Name', visible: true },
    { key: 'machineName', label: 'Machine Name', visible: true },
    { key: 'totalProduction', label: 'Total Production', visible: true },
    { key: 'styleName', label: 'Style Name', visible: true },
    { key: 'designName', label: 'Design Name', visible: true },
    { key: 'targetProduction', label: 'Target Production', visible: true },
    { key: 'costPerPiece', label: 'Cost per Piece', visible: true },
    { key: 'productionCost', label: 'Production Cost', visible: true },
    { key: 'shift', label: 'Shift', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'actions', label: 'Action', visible: true }
  ]);

  showColumnDropdown = signal<boolean>(false);

  // Sorting & Pagination
  sortColumn = signal<keyof ProductionRecord>('sNo');
  sortDirection = signal<'asc' | 'desc'>('asc');
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // Master Data Signal
  records = signal<ProductionRecord[]>([]);
  totalRecords = signal<number>(0);
  fullRecords = signal<any[]>([]);

  // Computed Summary Totals
  visibleColumnCount = computed(() => this.columns().filter(col => col.visible).length);

  dayTotalProduction = computed(() => {
    return this.fullRecords()
      .filter(r => this.isDayShift(r.shift))
      .reduce((sum, r) => sum + (Number(r.totalProduction) || 0), 0);
  });

  nightTotalProduction = computed(() => {
    return this.fullRecords()
      .filter(r => this.isNightShift(r.shift))
      .reduce((sum, r) => sum + (Number(r.totalProduction) || 0), 0);
  });

  yesterdayDateLabel = computed(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dp = new DatePipe('en-US');
    return dp.transform(yesterday, 'dd-MMM') || '';
  });

  yesterdayTotalCost = computed(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = this.toLocalDateKey(yesterday);

    return this.fullRecords()
      .filter(r => this.toLocalDateKey(r.createdDate) === yStr)
      .reduce((sum, r) => sum + (Number(r.productionCost) || 0), 0);
  });

  // Filtered & Sorted Grid Data
  filteredRecords = computed(() => {
    return this.records();
  });

  // Paginated View (Server handles pagination, so just return records)
  paginatedRecords = computed(() => {
    return this.records();
  });

  totalPages = computed(() => {
    return Math.ceil(this.totalRecords() / this.pageSize()) || 1;
  });

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private machineProductionService: MachineProductionService,
    private productionExcelService: ProductionExcelService,
    private datePipe: DatePipe
  ) {
    this.productionForm = this.fb.group({
      companyId: [null],
      employeeName: [null],
      machineName: [null],
      totalProduction: [null],
      styleName: [null],
      designName: [null],
      targetProduction: [null],
      costPerPiece: [null],
      shift: ['Day']
    });
  }

  ngOnInit(): void {
    const today = new Date();
    this.exportToDate.set(this.datePipe.transform(today, 'yyyy-MM-dd') || '');
    this.loadCompanies();
    this.loadGridRecords();
    this.loadFullRecordsForKPIs();
  }

  loadCompanies(): void {
    this.companyService.getCompanies().subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          this.companies.set(res);
        }
      },
      error: (err) => console.error('Error fetching companies:', err)
    });
  }

  loadGridRecords(): void {
    const page = this.currentPage();
    const pageSize = this.pageSize();
    const shift = this.activeShift();

    this.machineProductionService.getPaginated(page, pageSize, shift).subscribe({
      next: (res) => {
        const rows = this.unwrapRows(res);
        const mapped = rows.map((r: any, index: number) => this.toRecord(r, (page - 1) * pageSize + index + 1));
        this.records.set(mapped);
        const total = this.field(res, 'totalRecords');
        this.totalRecords.set(total != null ? Number(total) : mapped.length);
      },
      error: (err) => {
        console.error('Error loading production records from DB:', err);
      }
    });
  }

  loadFullRecordsForKPIs(): void {
    const companyId = Number(localStorage.getItem('companyId') || 1);
    this.machineProductionService.getByCompany(companyId).subscribe({
      next: (res) => {
        const rows = this.unwrapRows(res).map((r: any, index: number) => this.toRecord(r, index + 1));
        if (rows.length > 0) {
          this.fullRecords.set(rows);
          return;
        }
        this.loadKpisFromShiftLists();
      },
      error: () => this.loadKpisFromShiftLists()
    });
  }

  private loadKpisFromShiftLists(): void {
    forkJoin([
      this.machineProductionService.getPaginated(1, 5000, 'Day'),
      this.machineProductionService.getPaginated(1, 5000, 'Night')
    ]).subscribe({
      next: ([dayRes, nightRes]) => {
        const rows = [...this.unwrapRows(dayRes), ...this.unwrapRows(nightRes)]
          .map((r: any, index: number) => this.toRecord(r, index + 1));
        this.fullRecords.set(rows);
      },
      error: (err) => {
        console.error('Error loading full production records for KPIs:', err);
      }
    });
  }

  setShift(shift: 'Day' | 'Night'): void {
    this.activeShift.set(shift);
    this.currentPage.set(1);
    this.loadGridRecords();
  }

  toggleColumnDropdown(): void {
    this.showColumnDropdown.update(v => !v);
  }

  toggleColumnVisibility(colKey: string): void {
    this.columns.update(cols =>
      cols.map(c => c.key === colKey ? { ...c, visible: !c.visible } : c)
    );
  }

  sortBy(colKey: keyof ProductionRecord): void {
    if (this.sortColumn() === colKey) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(colKey);
      this.sortDirection.set('asc');
    }
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

  openAddModal(): void {
    this.editingId.set(null);
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
      shift: ''
    });
    this.showAddModal.set(true);
  }

  openEditModal(row: ProductionRecord): void {
    this.editingId.set(row.id);
    this.productionForm.reset({
      companyId: row.companyId,
      employeeName: row.employeeName || '',
      machineName: row.machineName || '',
      totalProduction: row.totalProduction,
      styleName: row.styleName || '',
      designName: row.designName || '',
      targetProduction: row.targetProduction,
      costPerPiece: row.costPerPiece,
      shift: row.shift || ''
    });
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.editingId.set(null);
    this.showAddModal.set(false);
  }

  deleteProduction(row: ProductionRecord): void {
    const label = row.employeeName || row.machineName || 'this record';
    if (!confirm(`Delete production entry for ${label}?`)) {
      return;
    }

    this.machineProductionService.delete(row.id).subscribe({
      next: () => {
        this.loadGridRecords();
        this.loadFullRecordsForKPIs();
      },
      error: (err) => {
        console.error('Error deleting production entry:', err);
        alert('Failed to delete production entry.');
      }
    });
  }

  saveProduction(): void {
    const formVal = this.productionForm.getRawValue();
    const companyId = this.asNumber(formVal.companyId);

    const storedRole = (localStorage.getItem('userRole') || localStorage.getItem('role') || '').toLowerCase();
    const storedEmail = (localStorage.getItem('userEmail') || '').toLowerCase();
    const isAdmin = storedRole.includes('admin') || storedEmail.includes('admin') || !storedRole.includes('emp');
    const status = isAdmin ? 'Accept' : 'Pending';

    const totalProd = this.asNumber(formVal.totalProduction);
    const costPerPiece = this.asNumber(formVal.costPerPiece);
    const calculatedProductionCost = (totalProd != null && costPerPiece != null) ? (totalProd * costPerPiece) : null;

    const payload = {
      employeeName: this.asText(formVal.employeeName),
      machineName: this.asText(formVal.machineName),
      shift: this.asText(formVal.shift),
      styleName: this.asText(formVal.styleName),
      designName: this.asText(formVal.designName),
      totalProduction: totalProd,
      targetProduction: this.asNumber(formVal.targetProduction),
      costPerPiece: costPerPiece,
      productionCost: calculatedProductionCost,
      status: status,
      companyId: companyId
    };

    const editingId = this.editingId();
    const request = editingId != null
      ? this.machineProductionService.update(editingId, payload)
      : this.machineProductionService.add(payload);

    request.subscribe({
      next: () => {
        this.loadGridRecords();
        this.loadFullRecordsForKPIs();
        this.closeAddModal();
      },
      error: (err) => {
        console.error('Error saving production entry:', err);
        alert(editingId != null
          ? 'Failed to update production entry.'
          : 'Failed to save production entry to the database.');
      }
    });
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
    return String(value);
  }

  private asNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }

  private isDayShift(shift: unknown): boolean {
    return String(shift ?? '').trim().toLowerCase().startsWith('day');
  }

  private isNightShift(shift: unknown): boolean {
    return String(shift ?? '').trim().toLowerCase().startsWith('night');
  }

  private toLocalDateKey(value: unknown): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) return '';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadGridRecords();
    }
  }

  // --- Export Excel Methods ---

  toggleExportCard(event: Event): void {
    event.stopPropagation();
    this.isExportCardOpen.update(v => !v);
    if (this.isExportCardOpen()) {
      this.exportValidationError.set(null);
    }
  }

  closeExportCard(): void {
    this.isExportCardOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Do not close if clicking inside the date picker or export popover itself
    if (this.isExportCardOpen() && !target.closest('.export-dropdown-menu') && !target.closest('.date-picker-popup') && !target.closest('.date-picker-container')) {
      this.isExportCardOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: any) {
    if (this.isExportCardOpen()) {
      this.isExportCardOpen.set(false);
    }
  }

  validateDates(): boolean {
    const from = this.exportFromDate();
    const to = this.exportToDate();

    if (!from) {
      this.exportValidationError.set("Please select From Date.");
      return false;
    }
    if (!to) {
      this.exportValidationError.set("Please select To Date.");
      return false;
    }

    const dFrom = new Date(from);
    const dTo = new Date(to);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // end of today

    if (isNaN(dFrom.getTime()) || isNaN(dTo.getTime())) {
      this.exportValidationError.set("Please select a valid date.");
      return false;
    }

    if (dFrom > today) {
      this.exportValidationError.set("From Date cannot be later than today.");
      return false;
    }

    if (dTo > today) {
      this.exportValidationError.set("To Date cannot be a future date.");
      return false;
    }

    if (dFrom > dTo) {
      this.exportValidationError.set("From Date cannot be later than To Date.");
      return false;
    }

    this.exportValidationError.set(null);
    return true;
  }

  exportExcel(): void {
    if (!this.validateDates()) {
      return;
    }

    this.isExporting.set(true);
    
    this.productionExcelService.generateAndDownload(this.exportFromDate(), this.exportToDate()).then(() => {
      this.isExporting.set(false);
      this.closeExportCard();
      this.exportValidationError.set(null);
    }).catch(e => {
      console.error('Error generating excel:', e);
      if (e.status === 401 || e.status === 403) {
         this.exportValidationError.set("You do not have permission to export.");
      } else if (e.status === 0 || e.status === 504) {
         this.exportValidationError.set("Unable to connect to the server. Please check your connection and try again.");
      } else if (e.status === 400 || e.status === 404) {
         this.exportValidationError.set("No production records found or invalid request.");
      } else {
         this.exportValidationError.set("Unable to export production data. Please try again.");
      }
      this.isExporting.set(false);
    });
  }
}
