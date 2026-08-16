import { Component, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EmployeeService, Employee } from '../../core/services/employee.service';
import { InputFieldComponent } from '../../shared/components/input-field/input-field.component';
import { SelectFieldComponent } from '../../shared/components/select-field/select-field.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AppDatePickerComponent } from '../../shared/components/app-date-picker/app-date-picker.component';

@Component({
  selector: 'app-update-employee',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, InputFieldComponent, SelectFieldComponent, ButtonComponent, AppDatePickerComponent],
  templateUrl: './update-employee.component.html',
  styleUrls: ['./update-employee.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdateEmployeeComponent implements OnInit {
  employees = signal<Employee[]>([]);
  searchQuery = signal('');
  isLoading = signal(false);
  isModalOpen = signal(false);
  editForm!: FormGroup;
  selectedEmployeeId = signal<string | null>(null);

  getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  filteredEmployees = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.employees().filter(e => 
      e.fullName.toLowerCase().includes(query) || e.employeeId.toLowerCase().includes(query)
    );
  });

  constructor(
    private employeeService: EmployeeService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  private initForm() {
    this.editForm = this.fb.group({
      id: [0],
      employeeId: [{ value: '', disabled: true }],
      fullName: ['', Validators.required],
      gender: ['', Validators.required],
      dob: ['', Validators.required],
      mobileNumber: ['', Validators.required],
      designation: ['', Validators.required],
      joiningDate: ['', Validators.required],
      monthlySalary: ['', Validators.required],
      bankName: [''],
      accountNumber: [''],
      ifscCode: ['']
    });
  }

  loadEmployees() {
    this.isLoading.set(true);
    this.employeeService.getAllEmployees().subscribe({
      next: (data) => {
        this.employees.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openEditModal(emp: Employee) {
    this.selectedEmployeeId.set(emp.employeeId);
    this.editForm.patchValue(emp);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedEmployeeId.set(null);
  }

  onUpdate() {
    if (this.editForm.valid) {
      this.isLoading.set(true);
      const data = { ...this.editForm.getRawValue(), employeeId: this.selectedEmployeeId() };
      this.employeeService.manageEmployee(data).subscribe({
        next: () => {
          this.loadEmployees();
          this.closeModal();
        },
        error: () => this.isLoading.set(false)
      });
    }
  }

  onDelete(id: string) {
    if (confirm('Are you sure you want to delete this employee?')) {
      this.employeeService.deleteEmployee(id).subscribe(() => this.loadEmployees());
    }
  }
}
