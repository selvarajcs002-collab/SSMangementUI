import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger, state } from '@angular/animations';
import { InputFieldComponent } from '../../shared/components/input-field/input-field.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { SelectFieldComponent } from '../../shared/components/select-field/select-field.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { EmployeeService } from '../../core/services/employee.service';
import { AppDatePickerComponent } from '../../shared/components/app-date-picker/app-date-picker.component';

@Component({
  selector: 'app-add-employee',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputFieldComponent,
    ButtonComponent,
    SelectFieldComponent,
    LoaderComponent,
    RouterModule,
    AppDatePickerComponent
  ],
  templateUrl: './add-employee.component.html',
  styleUrls: ['./add-employee.component.scss'],
  animations: [
    trigger('stepTransition', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('400ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 0, transform: 'translateX(-20px)' }))
      ])
    ]),
    trigger('sidebarAnimation', [
      state('expanded', style({ width: '280px' })),
      state('collapsed', style({ width: '80px' })),
      transition('expanded <=> collapsed', animate('300ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ]),
    trigger('staggerList', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          stagger(50, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.Default
})
export class AddEmployeeComponent implements OnInit {
  employeeForm!: FormGroup;
  currentStep = signal(1);
  totalSteps = 5;
  isSidebarCollapsed = signal(false);
  profilePreview = signal<string | null>(null);
  isLoading = signal(false);

  steps = [
    { id: 1, title: 'Basic Details', icon: 'person' },
    { id: 2, title: 'Bank Details', icon: 'account_balance' },
    { id: 3, title: 'Document Details', icon: 'description' },
    { id: 4, title: 'Address Details', icon: 'home' },
    { id: 5, title: 'Review & Submit', icon: 'fact_check' }
  ];

  menuItems = [
    { label: 'Dashboard', icon: 'grid_view', active: false, route: '/dashboard' },
    { label: 'New Registration', icon: 'person_add', active: true, route: '/dashboard/employee' },
    { label: 'Attendance', icon: 'calendar_today', active: false, route: '/dashboard/employee/attendance' },
    { label: 'Payroll', icon: 'payments', active: false, route: '/dashboard/payroll' },
    { label: 'Shift Management', icon: 'schedule', active: false, route: '/dashboard/shifts' },
    { label: 'Reports', icon: 'bar_chart', active: false, route: '/dashboard/employee/reports' }
  ];

  uploadedDocs = signal<{ [key: string]: boolean }>({});
  genderOptions = signal<any[]>([]);
  designationOptions = signal<any[]>([]);

  constructor(private fb: FormBuilder, private employeeService: EmployeeService) { }

  ngOnInit(): void {
    this.initForm();
    this.generateEmployeeId();
    this.setupSalaryCalculation();
    this.loadMasterData();
  }

  private loadMasterData(): void {
    this.employeeService.getMasterData('Genders').subscribe(data => this.genderOptions.set(data));
    this.employeeService.getMasterData('Designations').subscribe(data => this.designationOptions.set(data));
  }

  private setupSalaryCalculation(): void {
    this.employeeForm.get('basicDetails.monthlySalary')?.valueChanges.subscribe(val => {
      if (val) {
        const daily = (val / 30).toFixed(2);
        this.employeeForm.get('basicDetails.dailySalary')?.setValue(daily, { emitEvent: false });
      }
    });
  }

  private generateEmployeeId(): void {
    const randomId = 'EMP-' + Math.floor(1000 + Math.random() * 9000);
    this.employeeForm.get('basicDetails.employeeId')?.setValue(randomId);
  }

  private initForm(): void {
    this.employeeForm = this.fb.group({
      basicDetails: this.fb.group({
        employeeId: [{ value: '', disabled: true }, Validators.required],
        fullName: ['', Validators.required],
        gender: ['', Validators.required],
        dob: ['', Validators.required],
        mobileNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10,12}$')]],
        designation: ['', Validators.required],
        joiningDate: ['', Validators.required],
        maritalStatus: [''],
        nationality: ['Indian'],
        employeeType: ['Full Time'],
        monthlySalary: ['', [Validators.required, Validators.min(0)]],
        dailySalary: [{ value: '', disabled: true }],
        incentive: [0],
        workLocation: [''],
        aadhaarNumber: ['', [Validators.pattern('^[0-9]{12}$')]],
        panNumber: ['', [Validators.pattern('^[A-Z]{5}[0-9]{4}[A-Z]{1}$')]],
        referralCode: ['']
      }),
      bankDetails: this.fb.group({
        accountHolderName: ['', Validators.required],
        bankName: ['', Validators.required],
        branchName: [''],
        accountNumber: ['', Validators.required],
        confirmAccountNumber: ['', Validators.required],
        ifscCode: ['', [Validators.required, Validators.pattern('^[A-Za-z]{4}0[A-Za-z0-9]{6}$')]],
        upiId: [''],
        accountType: ['Savings']
      }, { validators: this.accountNumberMatcher }),
      documentDetails: this.fb.group({
        aadhaar: [null],
        pan: [null],
        passport: [null],
        resume: [null],
        offerLetter: [null],
        experienceLetter: [null],
        certificates: [null]
      }),
      addressDetails: this.fb.group({
        permanentAddress: ['', Validators.required],
        currentAddress: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        country: ['India', Validators.required],
        pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
      }),
      reviewAndSubmit: this.fb.group({
        confirmInformation: [false, Validators.requiredTrue]
      })
    });
  }

  getStepGroup(step: number): FormGroup | null {
    switch (step) {
      case 1: return this.employeeForm.get('basicDetails') as FormGroup;
      case 2: return this.employeeForm.get('bankDetails') as FormGroup;
      case 3: return this.employeeForm.get('documentDetails') as FormGroup;
      case 4: return this.employeeForm.get('addressDetails') as FormGroup;
      case 5: return this.employeeForm.get('reviewAndSubmit') as FormGroup;
      default: return null;
    }
  }

  nextStep(): void {
    const currentGroup = this.getStepGroup(this.currentStep());
    if (currentGroup && currentGroup.invalid) {
      this.markFormGroupTouched(currentGroup);
      return;
    }

    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  isStepInvalid(): boolean {
    const group = this.getStepGroup(this.currentStep());
    return !!(group && group.invalid && (group.touched || group.dirty));
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToStep(step: number): void {
    if (step < this.currentStep()) {
      this.currentStep.set(step);
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(v => !v);
  }

  onProfileUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.profilePreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeProfileImage(): void {
    this.profilePreview.set(null);
  }

  onDocumentUpload(event: any, docName: string): void {
    const file = event.target.files[0];
    if (file) {
      this.uploadedDocs.update(docs => ({ ...docs, [docName]: true }));
      console.log(`Uploaded ${docName}:`, file.name);
    }
  }

  isDocUploaded(docName: string): boolean {
    return !!this.uploadedDocs()[docName];
  }

  getFieldError(groupName: string, controlName: string): string | null {
    const control = this.employeeForm.get(`${groupName}.${controlName}`);
    if (control && control.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) return `${this.formatLabel(controlName)} is required`;
      if (control.errors?.['pattern']) {
        if (controlName === 'ifscCode') return 'Invalid IFSC (e.g. HDFC0001234)';
        if (controlName === 'mobileNumber') return 'Enter 10-12 digit mobile number';
        if (controlName === 'pincode') return 'Enter 6 digit pincode';
        return `Invalid ${this.formatLabel(controlName)} format`;
      }
      if (control.errors?.['min']) return 'Value must be positive';
      if (control.errors?.['requiredTrue']) return 'Please confirm the information';
    }

    // Check for group level errors (like account mismatch)
    if (groupName === 'bankDetails' && controlName === 'confirmAccountNumber') {
      const group = this.employeeForm.get('bankDetails') as FormGroup;
      if (group.errors?.['mismatch'] && (control?.dirty || control?.touched)) {
        return 'Account numbers do not match';
      }
    }

    return null;
  }

  private formatLabel(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  private accountNumberMatcher(group: FormGroup): any {
    const acc = group.get('accountNumber')?.value;
    const confirm = group.get('confirmAccountNumber')?.value;



    return acc === confirm ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.employeeForm.valid) {
      this.isLoading.set(true);
      const formData = this.employeeForm.getRawValue();
      const employeeData = {
        employeeId: formData.basicDetails.employeeId,
        fullName: formData.basicDetails.fullName,
        gender: formData.basicDetails.gender,
        dob: formData.basicDetails.dob,
        mobileNumber: formData.basicDetails.mobileNumber,
        designation: formData.basicDetails.designation,
        joiningDate: formData.basicDetails.joiningDate,
        monthlySalary: formData.basicDetails.monthlySalary,
        dailySalary: formData.basicDetails.dailySalary,
        incentive: formData.basicDetails.incentive,
        bankName: formData.bankDetails.bankName,
        accountNumber: formData.bankDetails.accountNumber,
        ifscCode: formData.bankDetails.ifscCode
      };

      this.employeeService.manageEmployee(employeeData).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res && res.status) {
            alert(res.message || 'Employee registered successfully!');
            this.employeeForm.reset();
            this.generateEmployeeId();
            this.currentStep.set(1);
          } else {
            alert('Error: ' + (res?.message || 'Unknown error occurred'));
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error('Submission error:', err);
          alert('Failed to register employee. Please check if the backend is running.');
        }
      });
    } else {
      this.markFormGroupTouched(this.employeeForm);
      console.log('Form Invalid:', this.findInvalidControls());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private findInvalidControls() {
    const invalid: any[] = [];
    const recursiveFind = (group: FormGroup | FormArray, path: string = '') => {
      Object.keys(group.controls).forEach(key => {
        const control = (group.controls as any)[key];
        const currentPath = path ? `${path}.${key}` : key;
        if (control instanceof FormGroup || control instanceof FormArray) {
          recursiveFind(control, currentPath);
        } else if (control.invalid) {
          invalid.push({ path: currentPath, errors: control.errors });
        }
      });
    };
    recursiveFind(this.employeeForm);
    return invalid;
  }

  get reviewAndSubmitGroup(): FormGroup {
    return this.employeeForm.get('reviewAndSubmit') as FormGroup;
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.values(formGroup.controls).forEach(control => {
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      } else {
        control.markAsTouched();
      }
    });
  }
}
