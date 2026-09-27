import { Component, OnInit, ChangeDetectionStrategy, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { InwardService } from '../../../core/services/inward.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { CompanyService, CompanySummary } from '../../../core/services/company.service';
import { AppConfigService } from '../../../core/services/app-config.service';
import { CustomSelectComponent } from '../../../shared/components/custom-select/custom-select.component';
import { DatePipe } from '@angular/common';
import { AppDatePickerComponent } from '../../../shared/components/app-date-picker/app-date-picker.component';
import { ProductionExcelService } from '../../../excel/production-excel.service';

export interface ProductionRecord {
  sNo: number;
  id: string;
  employeeName: string;
  machineName: string;
  totalProduction: number;
  styleName: string;
  designName: string;
  targetProduction: number;
  costPerPiece: number;
  productionCost: number;
  shift: 'Day' | 'Night';
  status: 'Accept' | 'Pending';
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

  // Export State
  isExportCardOpen = signal<boolean>(false);
  exportFromDate = signal<string>('2026-05-01');
  exportToDate = signal<string>(''); // Will be set in ngOnInit
  isExporting = signal<boolean>(false);
  exportValidationError = signal<string | null>(null);

  // Configured Data
  companies = signal<CompanySummary[]>([]);
  machineOptions = signal<string[]>([]);

  styleOptions = signal<string[]>([]);
  rawDesignStyleMap = signal<{ styleNo: string; designName: string }[]>([]);
  availableDesigns = signal<string[]>([]);

  styleSelectOptions = computed(() => this.styleOptions().map(s => ({ key: s, value: s })));
  designSelectOptions = computed(() => this.availableDesigns().map(d => ({ key: d, value: d })));

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
    { key: 'status', label: 'Status', visible: true }
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
  dayTotalProduction = computed(() => {
    return this.fullRecords()
      .filter(r => r.shift === 'Day')
      .reduce((sum, r) => sum + (Number(r.totalProduction) || 0), 0);
  });

  nightTotalProduction = computed(() => {
    return this.fullRecords()
      .filter(r => r.shift === 'Night')
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
    const yStr = yesterday.toISOString().split('T')[0];

    return this.fullRecords()
      .filter(r => {
        if (!r.createdDate) return false;
        try {
          const dStr = new Date(r.createdDate).toISOString().split('T')[0];
          return dStr === yStr;
        } catch(e) {
          return false;
        }
      })
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
    private http: HttpClient,
    private inwardService: InwardService,
    private employeeService: EmployeeService,
    private companyService: CompanyService,
    private configService: AppConfigService,
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
    this.loadAppConfig();
    this.loadGridRecords();
    this.loadFullRecordsForKPIs();

    // Listen to companyId changes to fetch styles
    this.productionForm.get('companyId')?.valueChanges.subscribe((selectedCompany: number) => {
      if (selectedCompany) {
        this.loadStyleAndDesignData(selectedCompany);
      } else {
        this.styleOptions.set([]);
        this.availableDesigns.set([]);
        this.productionForm.patchValue({ styleName: '', designName: '' });
      }
    });

    // Listen to styleName changes to cascade designName options
    this.productionForm.get('styleName')?.valueChanges.subscribe((selectedStyle: string) => {
      this.onStyleChange(selectedStyle);
    });
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

  loadAppConfig(): void {
    this.http.get<any>('/assets/appsettings.json').subscribe({
      next: (config) => {
        if (config && Array.isArray(config.machineNames) && config.machineNames.length > 0) {
          this.machineOptions.set(config.machineNames);
        }
      },
      error: (err) => {
        console.warn('Could not load appsettings.json', err);
      }
    });
  }

  loadGridRecords(): void {
    const page = this.currentPage();
    const pageSize = this.pageSize();
    const shift = this.activeShift();

    this.http.get<any>(`${this.configService.apiBaseUrl}/MachineProduction/paginated-list?page=${page}&pageSize=${pageSize}&shift=${shift}`).subscribe({
      next: (res) => {
        if (res && Array.isArray(res.data)) {
          const mapped = res.data.map((r: any, index: number) => ({
            sNo: (page - 1) * pageSize + index + 1,
            id: r.id || `REC-${r.id}`,
            employeeName: r.employeeName,
            machineName: r.machineName,
            totalProduction: r.totalProduction,
            styleName: r.styleName,
            designName: r.designName,
            targetProduction: r.targetProduction,
            costPerPiece: r.costPerPiece,
            productionCost: r.productionCost,
            shift: r.shift as 'Day' | 'Night',
            status: r.status as 'Accept' | 'Pending',
            createdDate: r.createdDate
          }));
          this.records.set(mapped);
          this.totalRecords.set(res.totalRecords || 0);
        }
      },
      error: (err) => {
        console.error('Error loading production records from DB:', err);
      }
    });
  }

  loadFullRecordsForKPIs(): void {
    const companyId = Number(localStorage.getItem('companyId') || 1);
    this.http.get<any[]>(`${this.configService.apiBaseUrl}/MachineProduction/list/${companyId}`).subscribe({
      next: (res) => {
        if (Array.isArray(res)) {
          this.fullRecords.set(res);
        }
      },
      error: (err) => {
        console.error('Error loading full production records for KPIs:', err);
      }
    });
  }

  loadStyleAndDesignData(companyId: number): void {
    this.inwardService.getDesignStyleColour(companyId).subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.rawDesignStyleMap.set(res.map((item: any) => ({
            styleNo: item.styleNo || item.StyleNo,
            designName: item.designName || item.DesignName
          })));

          const styles = [...new Set(res.map((item: any) => item.styleNo || item.StyleNo).filter(Boolean))];
          if (styles.length > 0) {
            this.styleOptions.set(styles as string[]);
          }
        }
      },
      error: (err) => {
        console.error('Error fetching style and design data:', err);
      }
    });
  }

  onStyleChange(selectedStyle: string): void {
    if (!selectedStyle) {
      this.availableDesigns.set([]);
      this.productionForm.patchValue({ designName: '' });
      return;
    }

    const filtered = this.rawDesignStyleMap()
      .filter(item => item.styleNo === selectedStyle)
      .map(item => item.designName);

    const uniqueDesigns = [...new Set(filtered)];

    if (uniqueDesigns.length > 0) {
      this.availableDesigns.set(uniqueDesigns);
      this.productionForm.patchValue({ designName: uniqueDesigns[0] });
    } else {
      this.availableDesigns.set(['Standard Pattern']);
      this.productionForm.patchValue({ designName: 'Standard Pattern' });
    }
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

  openAddModal(): void {
    const defaultCompanyId = Number(localStorage.getItem('companyId') || 1);
    this.productionForm.reset({
      companyId: defaultCompanyId,
      employeeName: '',
      machineName: this.machineOptions().length > 0 ? this.machineOptions()[0] : '',
      totalProduction: 0,
      styleName: '',
      designName: '',
      targetProduction: 1000,
      costPerPiece: 3.0,
      shift: this.activeShift()
    });

    if (defaultCompanyId) {
      this.loadStyleAndDesignData(defaultCompanyId);
    }

    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  saveProduction(): void {
    if (this.productionForm.invalid) {
      this.productionForm.markAllAsTouched();
      return;
    }

    const formVal = this.productionForm.value;
    const companyId = Number(formVal.companyId || localStorage.getItem('companyId') || 1);

    // Automatically detect if logged in user is Admin or Employee
    const storedRole = (localStorage.getItem('userRole') || localStorage.getItem('role') || '').toLowerCase();
    const storedEmail = (localStorage.getItem('userEmail') || '').toLowerCase();
    const isAdmin = storedRole.includes('admin') || storedEmail.includes('admin') || !storedRole.includes('emp');
    const status: 'Accept' | 'Pending' = isAdmin ? 'Accept' : 'Pending';

    const totalProd = formVal.totalProduction != null && formVal.totalProduction !== '' ? Number(formVal.totalProduction) : null;
    const costPerPiece = formVal.costPerPiece != null && formVal.costPerPiece !== '' ? Number(formVal.costPerPiece) : null;
    const calculatedProductionCost = (totalProd != null && costPerPiece != null) ? (totalProd * costPerPiece) : null;

    const payload = {
      employeeName: formVal.employeeName || null,
      machineName: formVal.machineName || null,
      shift: formVal.shift || null,
      styleName: formVal.styleName || null,
      designName: formVal.designName || null,
      totalProduction: totalProd,
      targetProduction: formVal.targetProduction != null && formVal.targetProduction !== '' ? Number(formVal.targetProduction) : null,
      costPerPiece: costPerPiece,
      productionCost: calculatedProductionCost,
      status: status,
      companyId: companyId
    };

    this.http.post(`${this.configService.apiBaseUrl}/MachineProduction/add`, payload).subscribe({
      next: () => {
        this.loadGridRecords();
        this.closeAddModal();
      },
      error: (err) => {
        console.error('Error saving production entry:', err);
        alert('Failed to save production entry to the database.');
      }
    });
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
