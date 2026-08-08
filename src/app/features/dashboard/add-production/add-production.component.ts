import { Component, ChangeDetectionStrategy, signal, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { AppDatePickerComponent } from '../../../shared/components/app-date-picker/app-date-picker.component';
import { EmployeeService, Employee, DashboardSummary, RecentProductionEntry } from '../../../core/services/employee.service';

@Component({
  selector: 'app-add-production',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AppDatePickerComponent],
  templateUrl: './add-production.component.html',
  styleUrls: ['./add-production.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('overlayAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('modalAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) translateY(20px)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 1, 1)', style({ opacity: 0, transform: 'scale(0.95) translateY(20px)' }))
      ])
    ])
  ]
})
export class AddProductionComponent implements OnInit, OnDestroy {
  // Dashboard data — all values populated from API, never hardcoded
  stats = {
    totalProduction: '0',
    productionChange: '0%',
    activeMachines: '0',
    maintenanceUnits: '',
  };

  currentShift = {
    name: 'No Shift',
    type: 'Morning',
    targetMet: 0,
    qcFailures: 0
  };

  isLoadingDashboard = signal(true);

  // Modal state
  showAddModal = signal(false);
  isLoading = signal(false);
  isSubmitting = signal(false);
  employees = signal<Employee[]>([]);
  filteredEmployees = signal<Employee[]>([]);
  showEmployeeSuggestions = signal(false);

  // Add Machine modal state & configuration
  showAddMachineModal = signal(false);
  isMachineSubmitting = signal(false);
  isMachineLoading = signal(false);
  machineForm!: FormGroup;
  machineTouchedFields = signal<Set<string>>(new Set());

  // Dynamic config for Machine Form to support easy expansion
  machineFormFields = [
    { name: 'machineName', label: 'Machine Name', type: 'text', placeholder: 'Enter machine name', required: true, icon: 'settings' },
    { name: 'heads', label: 'Head', type: 'number', placeholder: 'Enter number of heads', required: true, icon: 'dns', min: 1 }
  ];

  // Production form
  productionForm!: FormGroup;

  // Dropdown data signals loaded dynamically
  machineOptions = signal<{ label: string; value: string }[]>([]);
  rawMachines = signal<any[]>([]);
  logs = signal<any[]>([]);
  shiftOptions = signal<{ label: string; value: string }[]>([
    { label: 'Day', value: 'Day' },
    { label: 'Night', value: 'Night' }
  ]);

  // Data grid state
  page = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  searchQuery = signal('');
  filterShift = signal(''); // Default set in ngOnInit
  filterMachine = signal('');
  filterStatus = signal('');
  sortColumn = signal('ProductionDate');
  sortDirection = signal('DESC');
  
  viewRecord = signal<any>(null);
  showViewModal = signal(false);
  editMode = signal(false);
  editProductionId = signal<number | null>(null);

  // Track touched fields for validation display
  touchedFields = signal<Set<string>>(new Set());

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.filterShift.set('Day');
    
    this.initForm();
    this.initMachineForm();
    this.loadEmployees();
    this.loadMachines();
    this.loadDashboardStats();
    this.loadLogs();
  }

  ngOnDestroy(): void {
    if (this.showAddModal() || this.showAddMachineModal() || this.showViewModal()) {
      document.body.style.overflow = '';
    }
  }

  private initForm(): void {
    this.productionForm = this.fb.group({
      employeeName: ['', Validators.required],
      machine: ['', Validators.required],
      totalProduction: [null, [Validators.required, Validators.min(1)]],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      shift: ['Day', Validators.required],
      targetProduction: [null, [Validators.required, Validators.min(1)]]
    });
  }

  private initMachineForm(): void {
    const group: any = {};
    this.machineFormFields.forEach(field => {
      const validators = [];
      if (field.required) {
        validators.push(Validators.required);
      }
      if (field.min !== undefined) {
        validators.push(Validators.min(field.min));
      }
      group[field.name] = [field.type === 'number' ? null : '', validators];
    });
    this.machineForm = this.fb.group(group);
  }

  private loadEmployees(): void {
    this.employeeService.getAllEmployees().subscribe({
      next: (data) => {
        this.employees.set(data);
        this.filteredEmployees.set(data);
      },
      error: (err) => {
        console.error('Failed to load employees:', err);
        this.employees.set([]);
        this.filteredEmployees.set([]);
      }
    });
  }

  private loadDashboardStats(): void {
    this.isLoadingDashboard.set(true);
    const shift = this.filterShift() || 'Day';
    this.employeeService.getDashboardSummary(shift).subscribe({
      next: (response) => {
        if (response && response.data) {
          const d = response.data;
          this.stats = {
            totalProduction: (d.yesterdayProduction ?? 0).toLocaleString(),
            productionChange: d.productionChangePercent !== 0
              ? `${d.productionChangePercent > 0 ? '+' : ''}${d.productionChangePercent.toFixed(1)}%`
              : '0%',
            activeMachines: d.activeMachines != null && d.activeMachines !== d.totalMachines
              ? `${d.activeMachines} / ${d.totalMachines}`
              : `${d.totalMachines ?? 0}`,
            maintenanceUnits: d.totalMachines != null && d.activeMachines != null && d.totalMachines > d.activeMachines
              ? `${d.totalMachines - d.activeMachines} in maintenance`
              : '',
          };
          this.currentShift = {
            name: d.currentShiftName || (shift === 'Day' ? 'Day Shift' : 'Night Shift'),
            type: d.currentShiftType || (shift === 'Day' ? 'Morning' : 'Night'),
            targetMet: d.targetMetPercent ?? 0,
            qcFailures: d.qcFailurePercent ?? 0
          };
          this.cdr.markForCheck();
        }
        this.isLoadingDashboard.set(false);
      },
      error: (err) => {
        console.error('Failed to load dashboard stats:', err);
        // Error Handling: Keep the previously loaded data until the new request succeeds.
        alert('Failed to load dashboard data. Showing previous data.');
        this.isLoadingDashboard.set(false);
      }
    });
  }

  private loadMachines(): void {
    this.employeeService.getMachines().subscribe({
      next: (data) => {
        this.rawMachines.set(data);
        const mapped = data.map(m => {
          const name = m.MachineName || m.machineName || '';
          return { label: name, value: name };
        }).filter(item => item.value !== '');

        this.machineOptions.set(mapped);
        if (mapped.length > 0 && !this.productionForm.get('machine')?.value) {
          this.productionForm.patchValue({ machine: mapped[0].value });
        }
      },
      error: (err) => {
        console.error('Failed to load machines:', err);
        this.machineOptions.set([]);
      }
    });
  }

  loadLogs(): void {
    const params = {
      page: this.page(),
      pageSize: this.pageSize(),
      search: this.searchQuery(),
      shift: this.filterShift(),
      machineId: this.filterMachine(),
      status: this.filterStatus(),
      sortColumn: this.sortColumn(),
      sortDirection: this.sortDirection()
    };
    this.employeeService.getProductionLogs(params).subscribe({
      next: (response) => {
        if (response) {
          // If the backend returns response.data (like ApiResponse does), use it
          const items = response.data?.items || response.items || [];
          const totalCount = response.data?.totalCount || response.totalCount || 0;
          this.logs.set(items);
          this.totalRecords.set(totalCount);
        } else {
          this.logs.set([]);
          this.totalRecords.set(0);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load recent production logs:', err);
        // Error handling for table: display error, keep data or show empty state if none exists
        alert('Failed to load production records.');
        this.cdr.markForCheck();
      }
    });
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadLogs();
  }

  onSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'ASC' ? 'DESC' : 'ASC');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('ASC');
    }
    this.loadLogs();
  }

  changePage(newPage: number): void {
    this.page.set(newPage);
    this.loadLogs();
  }

  changePageSize(event: any): void {
    this.pageSize.set(Number(event.target.value));
    this.page.set(1);
    this.loadLogs();
  }

  Math = Math;

  // Removed dynamic loadShifts since shifts are hardcoded to Day and Night

  onEmployeeInput(value: string): void {
    const filterValue = value ? value.toLowerCase() : '';
    if (!filterValue) {
      this.filteredEmployees.set(this.employees());
    } else {
      const matches = this.employees().filter(emp =>
        emp.fullName.toLowerCase().includes(filterValue) ||
        emp.employeeId.toLowerCase().includes(filterValue)
      );
      this.filteredEmployees.set(matches);
    }
    this.showEmployeeSuggestions.set(true);
  }

  selectEmployee(emp: Employee): void {
    this.productionForm.patchValue({ employeeName: emp.fullName });
    this.showEmployeeSuggestions.set(false);
  }

  hideEmployeeSuggestionsWithDelay(): void {
    setTimeout(() => {
      this.showEmployeeSuggestions.set(false);
    }, 200);
  }

  // Existing methods
  setShiftType(type: string) {
    const apiShiftValue = type === 'Morning' ? 'Day' : 'Night';
    
    // State Management: The selected shift should remain highlighted
    this.currentShift.type = type;
    this.currentShift.name = type === 'Morning' ? 'Day Shift' : 'Night Shift';
    
    // Update API request parameters
    this.filterShift.set(apiShiftValue);
    
    // Refresh the dashboard and table with the corresponding shift data instantly
    this.loadDashboardStats();
    
    // Reset page to 1 on shift change and reload table
    this.page.set(1);
    this.loadLogs();
  }

  getStatusClass(status: string): string {
    if (!status) return 'completed';
    return status.toLowerCase();
  }

  // Action methods
  openViewModal(record: any): void {
    this.viewRecord.set(record);
    this.showViewModal.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeViewModal(): void {
    this.showViewModal.set(false);
    document.body.style.overflow = '';
  }

  openEditModal(record: any): void {
    this.editMode.set(true);
    this.editProductionId.set(record.productionId || record.productionNo);
    
    // Convert status properly or keep it default
    this.resetForm();
    this.productionForm.patchValue({
      employeeName: record.employeeName,
      machine: record.machineName,
      totalProduction: record.totalProduction,
      date: record.productionDate ? new Date(record.productionDate).toISOString().split('T')[0] : '',
      shift: record.shift,
      targetProduction: record.targetProduction || 0
    });
    
    this.showAddModal.set(true);
    document.body.style.overflow = 'hidden';
  }

  deleteRecord(id: number): void {
    if (confirm('Are you sure you want to delete this production record?')) {
      this.employeeService.deleteProduction(id).subscribe({
        next: (res) => {
          this.loadLogs();
        },
        error: (err) => {
          console.error('Error deleting record', err);
          alert('Failed to delete record');
        }
      });
    }
  }

  // Modal methods
  openAddModal(): void {
    this.editMode.set(false);
    this.editProductionId.set(null);
    this.resetForm();
    this.showAddModal.set(true);
    document.body.style.overflow = 'hidden';

    // Autofocus employee field after render
    setTimeout(() => {
      const el = document.getElementById('prod-employee-name');
      if (el) el.focus();
    }, 350);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
    document.body.style.overflow = '';
    this.touchedFields.set(new Set());
  }

  resetForm(): void {
    this.productionForm.reset({
      employeeName: '',
      machine: this.machineOptions().length > 0 ? this.machineOptions()[0].value : '',
      totalProduction: null,
      date: new Date().toISOString().split('T')[0],
      shift: 'Day',
      targetProduction: null
    });
    this.productionForm.markAsUntouched();
    this.productionForm.markAsPristine();
    this.touchedFields.set(new Set());
  }

  markFieldTouched(fieldName: string): void {
    const current = new Set(this.touchedFields());
    current.add(fieldName);
    this.touchedFields.set(current);
  }

  getFieldError(fieldName: string): string | null {
    const control = this.productionForm.get(fieldName);
    if (!control || (!control.touched && !this.touchedFields().has(fieldName))) return null;

    if (control.hasError('required')) {
      const labels: Record<string, string> = {
        employeeName: 'Employee Name',
        machine: 'Machine',
        totalProduction: 'Total Production',
        date: 'Date',
        shift: 'Shift',
        targetProduction: 'Target Production'
      };
      return `${labels[fieldName] || fieldName} is required`;
    }
    if (control.hasError('min')) {
      return 'Value must be greater than 0';
    }
    return null;
  }

  get isFormValid(): boolean {
    return this.productionForm.valid;
  }

  submitProduction(): void {
    // Mark all fields as touched
    this.productionForm.markAllAsTouched();
    const allFields = new Set(['employeeName', 'machine', 'totalProduction', 'date', 'shift', 'targetProduction']);
    this.touchedFields.set(allFields);

    if (this.productionForm.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.isLoading.set(true);

    const formValue = this.productionForm.value;
    const empRecord = this.employees().find(e => e.fullName === formValue.employeeName);
    const employeeId = empRecord && empRecord.id ? Number(empRecord.id) : 0;

    const selectedMachineName = formValue.machine;
    const machRecord = this.rawMachines().find(m => (m.machineName || m.MachineName) === selectedMachineName);
    if (!machRecord) {
      alert('Invalid machine selected.');
      this.isSubmitting.set(false);
      this.isLoading.set(false);
      return;
    }

    const request = {
      productionId: this.editMode() ? this.editProductionId() : 0,
      productionDate: formValue.date,
      employeeId: employeeId,
      employeeName: formValue.employeeName,
      machineId: Number(machRecord.machineId || machRecord.MachineId),
      shift: formValue.shift,
      totalProduction: formValue.totalProduction ? Number(formValue.totalProduction) : 0,
      remarks: 'Recorded from overview web page',
      companyId: 1,
      branchId: 10,
      status: 'Completed'
    };

    const action = this.editMode() 
      ? this.employeeService.updateProduction(request.productionId!, request)
      : this.employeeService.saveProduction(request);

    action.subscribe({
      next: (response) => {
        if (response.success || response) {
          this.loadLogs();
          this.isLoading.set(false);
          this.isSubmitting.set(false);
          this.closeAddModal();
        } else {
          alert(response.message || 'Error occurred while saving production.');
          this.isLoading.set(false);
          this.isSubmitting.set(false);
        }
      },
      error: (err) => {
        console.error('Failed to save production:', err);
        this.isLoading.set(false);
        this.isSubmitting.set(false);
        const errorMsg = err.error?.message || 'Error occurred while saving production.';
        alert(errorMsg);
      }
    });
  }

  // Add Machine modal methods
  openAddMachineModal(): void {
    this.resetMachineForm();
    this.showAddMachineModal.set(true);
    document.body.style.overflow = 'hidden';

    // Autofocus first machine field
    setTimeout(() => {
      const el = document.getElementById('machine-machineName');
      if (el) el.focus();
    }, 350);
  }

  closeAddMachineModal(): void {
    this.showAddMachineModal.set(false);
    document.body.style.overflow = '';
    this.machineTouchedFields.set(new Set());
  }

  resetMachineForm(): void {
    const defaults: any = {};
    this.machineFormFields.forEach(field => {
      defaults[field.name] = field.type === 'number' ? null : '';
    });
    this.machineForm.reset(defaults);
    this.machineForm.markAsUntouched();
    this.machineForm.markAsPristine();
    this.machineTouchedFields.set(new Set());
  }

  markMachineFieldTouched(fieldName: string): void {
    const current = new Set(this.machineTouchedFields());
    current.add(fieldName);
    this.machineTouchedFields.set(current);
  }

  getMachineFieldError(fieldName: string): string | null {
    const control = this.machineForm.get(fieldName);
    if (!control || (!control.touched && !this.machineTouchedFields().has(fieldName))) return null;

    const fieldConfig = this.machineFormFields.find(f => f.name === fieldName);
    const label = fieldConfig?.label || fieldName;

    if (control.hasError('required')) {
      return `${label} is required`;
    }
    if (control.hasError('min')) {
      return `Value must be greater than or equal to ${fieldConfig?.min}`;
    }
    return null;
  }

  get isMachineFormValid(): boolean {
    return this.machineForm.valid;
  }

  submitMachine(): void {
    this.machineForm.markAllAsTouched();
    const allFields = new Set(this.machineFormFields.map(f => f.name));
    this.machineTouchedFields.set(allFields);

    if (this.machineForm.invalid || this.isMachineSubmitting()) {
      return;
    }

    this.isMachineSubmitting.set(true);
    this.isMachineLoading.set(true);

    const formValue = this.machineForm.value;
    const request = {
      machineName: formValue.machineName,
      head: formValue.heads ? Number(formValue.heads) : 0,
      isActive: true
    };

    this.employeeService.saveMachine(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadMachines();
          this.isMachineLoading.set(false);
          this.isMachineSubmitting.set(false);
          this.closeAddMachineModal();
        } else {
          alert(response.message || 'Error occurred while saving machine.');
          this.isMachineLoading.set(false);
          this.isMachineSubmitting.set(false);
        }
      },
      error: (err) => {
        console.error('Failed to save machine:', err);
        this.isMachineLoading.set(false);
        this.isMachineSubmitting.set(false);
        const errorMsg = err.error?.message || 'Error occurred while saving machine.';
        alert(errorMsg);
      }
    });
  }

  // Keyboard handling
  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    // Add Production modal handles
    if (this.showAddModal()) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closeAddModal();
      }

      if (event.key === 'Enter' && !event.shiftKey) {
        const activeEl = document.activeElement;
        if (activeEl && activeEl.tagName === 'SELECT') return;

        if (this.isFormValid && !this.isSubmitting()) {
          event.preventDefault();
          this.submitProduction();
        }
      }
    }

    // Add Machine modal handles
    if (this.showAddMachineModal()) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closeAddMachineModal();
      }

      if (event.key === 'Enter' && !event.shiftKey) {
        const activeEl = document.activeElement;
        if (activeEl && activeEl.tagName === 'BUTTON') return;

        if (this.isMachineFormValid && !this.isMachineSubmitting()) {
          event.preventDefault();
          this.submitMachine();
        }
      }
    }
  }
}
