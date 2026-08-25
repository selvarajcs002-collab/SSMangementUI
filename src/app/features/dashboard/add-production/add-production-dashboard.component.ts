import { Component, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { InwardService } from '../../../core/services/inward.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { CompanyService, CompanySummary } from '../../../core/services/company.service';
import { AppConfigService } from '../../../core/services/app-config.service';
import { CustomSelectComponent } from '../../../shared/components/custom-select/custom-select.component';

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
}

export interface ColumnDefinition {
  key: keyof ProductionRecord | 'actions';
  label: string;
  visible: boolean;
}

@Component({
  selector: 'app-add-production-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CustomSelectComponent],
  templateUrl: './add-production-dashboard.component.html',
  styleUrls: ['./add-production-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddProductionDashboardComponent implements OnInit {
  // Active shift toggle: 'Day' (Sun icon) or 'Night' (Moon icon)
  activeShift = signal<'Day' | 'Night'>('Day');

  // Modal State
  showAddModal = signal<boolean>(false);

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

  // Computed Summary Totals
  dayTotalProduction = computed(() => {
    return this.records()
      .filter(r => r.shift === 'Day')
      .reduce((sum, r) => sum + (Number(r.totalProduction) || 0), 0);
  });

  nightTotalProduction = computed(() => {
    return this.records()
      .filter(r => r.shift === 'Night')
      .reduce((sum, r) => sum + (Number(r.totalProduction) || 0), 0);
  });

  // Filtered & Sorted Grid Data
  filteredRecords = computed(() => {
    const shiftFilter = this.activeShift();
    let data = this.records().filter(r => r.shift === shiftFilter);

    const col = this.sortColumn();
    const dir = this.sortDirection();

    data = [...data].sort((a, b) => {
      const valA = a[col];
      const valB = b[col];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return dir === 'asc' ? valA - valB : valB - valA;
      }
      const strA = String(valA || '').toLowerCase();
      const strB = String(valB || '').toLowerCase();
      return dir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });

    return data;
  });

  // Paginated View
  paginatedRecords = computed(() => {
    const data = this.filteredRecords();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return data.slice(start, start + size);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredRecords().length / this.pageSize()) || 1;
  });

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private inwardService: InwardService,
    private employeeService: EmployeeService,
    private companyService: CompanyService,
    private configService: AppConfigService
  ) {
    this.productionForm = this.fb.group({
      companyId: [null, Validators.required],
      employeeName: ['', [Validators.required, Validators.minLength(2)]],
      machineName: ['', Validators.required],
      totalProduction: [0, [Validators.required, Validators.min(1)]],
      styleName: ['', Validators.required],
      designName: ['', Validators.required],
      targetProduction: [0, [Validators.required, Validators.min(1)]],
      costPerPiece: [0, [Validators.required, Validators.min(0)]],
      shift: ['Day', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCompanies();
    this.loadAppConfig();
    this.loadGridRecords();

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
    const companyId = Number(localStorage.getItem('companyId') || 1);
    this.http.get<any[]>(`${this.configService.apiBaseUrl}/MachineProduction/list/${companyId}`).subscribe({
      next: (res) => {
        if (Array.isArray(res)) {
          const mapped = res.map((r, index) => ({
            sNo: index + 1,
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
            status: r.status as 'Accept' | 'Pending'
          }));
          this.records.set(mapped);
        }
      },
      error: (err) => {
        console.error('Error loading production records from DB:', err);
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

    const totalProd = Number(formVal.totalProduction) || 0;
    const costPerPiece = Number(formVal.costPerPiece) || 0;
    const calculatedProductionCost = totalProd * costPerPiece;

    const payload = {
      employeeName: formVal.employeeName,
      machineName: formVal.machineName,
      shift: formVal.shift,
      styleName: formVal.styleName,
      designName: formVal.designName,
      totalProduction: totalProd,
      targetProduction: Number(formVal.targetProduction),
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
    }
  }
}
