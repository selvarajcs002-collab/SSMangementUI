import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { InputFieldComponent } from '../../../shared/components/input-field/input-field.component';
import { SelectFieldComponent, SelectOption } from '../../../shared/components/select-field/select-field.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { GridLayoutComponent } from '../../../shared/components/grid-layout/grid-layout.component';
import { SectionHeaderComponent } from '../../../shared/components/section-header/section-header.component';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';
import { CompanyService, CompanySummary } from '../../../core/services/company.service';
import { ModalService } from '../../../core/services/modal.service';
import { CompanyRequest } from '../../../core/models/request/company-request.model';
import { CommonResponse } from '../../../core/models/response/common-response.model';
import { gstValidator, phoneValidator, pincodeValidator } from '../../../shared/validators/custom-validators';

@Component({
  selector: 'app-company-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputFieldComponent,
    SelectFieldComponent,
    ButtonComponent,
    AlertComponent,
    GridLayoutComponent,
    SectionHeaderComponent,
    SafeHtmlPipe
  ],
  template: `
    <div class="form-container animate-fade-in">
      <div class="form-card">
        <header class="form-header">
          <div class="title-with-icon">
            <span class="main-icon" [innerHTML]="icons.building | safeHtml"></span>
            <h1 class="form-title">{{ mode === 'add' ? 'Add New Company' : 'Update Company' }}</h1>
          </div>
          <p class="form-subtitle">Fill in the details below to {{ mode === 'add' ? 'create a new' : 'update the' }} company profile.</p>
        </header>

        <app-alert
          *ngIf="alertMessage"
          [message]="alertMessage"
          [type]="alertType"
          (close)="alertMessage = null"
        ></app-alert>

        <form [formGroup]="companyForm" (ngSubmit)="onSubmit()" class="company-form">
          <!-- Basic Details Section -->
          <app-section-header title="Basic Details" [icon]="icons.building"></app-section-header>
          
          <app-grid-layout gap="24px" columns="repeat(auto-fit, minmax(min(100%, 450px), 1fr))">
            <ng-container *ngIf="mode === 'update'; else addNameTemplate">
              <app-select-field
                label="Company Name"
                placeholder="Select company to update"
                formControlName="companyId"
                [options]="companyOptions"
                [required]="true"
                [icon]="icons.building"
                [error]="getErrorMessage('companyId')"
                (change)="onCompanyChange($event)"
              ></app-select-field>
            </ng-container>

            <ng-template #addNameTemplate>
              <app-input-field
                label="Company Name"
                placeholder="Enter company name"
                formControlName="companyName"
                [required]="true"
                [icon]="icons.building"
              ></app-input-field>
              <div *ngIf="companyForm.controls['companyName'].touched && companyForm.controls['companyName'].invalid" class="text-red-500 text-xs mt-1">
                Company Name is required
              </div>
            </ng-template>

            <app-input-field
              label="Phone Number"
              placeholder="10-digit mobile number"
              formControlName="phoneNumber"
              [required]="false"
              [icon]="icons.phone"
            ></app-input-field>

            <app-input-field
              label="GST Number"
              placeholder="e.g. 22AAAAA0000A1Z5"
              formControlName="gst_No"
              [required]="true"
              [icon]="icons.hash"
              [error]="getErrorMessage('gst_No')"
            ></app-input-field>

          <!-- Delivery To Locations (Kendo Chip Style) -->
          <div class="delivery-to-section" style="grid-column: 1 / -1; margin-top: 10px;">
            <label style="font-size: 14px; font-weight: 500; color: var(--text-main); margin-bottom: 8px; display: block;">Delivery To Locations</label>
            
            <div style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 16px;">
              <div style="flex: 1; display: flex; flex-direction: column;">
                <div class="input-wrapper" [class.invalid]="locationInputError" style="height: 48px; display: flex; align-items: center; border: 1px solid var(--border, #e2e8f0); border-radius: 6px; background: #fff; transition: all 0.2s;">
                  <span class="input-icon" [innerHTML]="icons.building | safeHtml" style="margin-left: 14px; color: #94A3B8; display: flex;"></span>
                  <input type="text" [formControl]="newLocationControl" (keyup.enter)="$event.preventDefault(); addLocation()" placeholder="Enter Delivery To location" class="input" style="flex: 1; padding: 0 16px; border: none; outline: none; background: transparent; font-size: 14px; color: var(--text-main, #1e293b); height: 100%;">
                </div>
                <div *ngIf="locationInputError" style="color: var(--error, #ef4444); font-size: 12px; margin-top: 4px; font-weight: 500;">{{ locationInputError }}</div>
              </div>
              <app-button type="button" variant="primary" (btnClick)="addLocation()" style="height: 48px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span [innerHTML]="icons.plus | safeHtml" class="add-btn-icon" style="display: flex; align-items: center; justify-content: center;"></span>
                  <span>Add</span>
                </div>
              </app-button>
            </div>

            <!-- Chips Display -->
            <div class="k-chip-list" style="display: flex; flex-wrap: wrap; gap: 8px;">
              <div *ngFor="let loc of deliveryToLocations; let i = index" class="k-chip" style="display: inline-flex; align-items: center; gap: 6px; background: #f1f5f9; border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 16px; font-size: 13px; color: #334155; font-weight: 500; transition: all 0.2s;">
                <span>{{ loc }}</span>
                <button type="button" (click)="removeLocation(i)" class="chip-remove-btn" title="Remove">
                  <span [innerHTML]="icons.x | safeHtml" style="display: flex; align-items: center; justify-content: center;"></span>
                </button>
              </div>
            </div>
            <div *ngIf="deliveryToLocations.length === 0" style="color: #94a3b8; font-size: 13px; font-style: italic; margin-top: 4px;">
              No delivery locations added yet.
            </div>
          </div>
          </app-grid-layout>

          <!-- Address Information Section -->
          <app-section-header title="Address Information" [icon]="icons.mapPin"></app-section-header>
          
          <app-grid-layout gap="24px" columns="repeat(auto-fit, minmax(min(100%, 450px), 1fr))">
            <app-input-field
              label="Door No"
              placeholder="e.g. 402/A"
              formControlName="door_No"
              [required]="false"
              [icon]="icons.door"
              [error]="getErrorMessage('door_No')"
            ></app-input-field>

            <app-input-field
              label="Street Name / Building"
              placeholder="Enter street or building name"
              formControlName="street_Name"
              [required]="true"
              [icon]="icons.street"
              [error]="getErrorMessage('street_Name')"
            ></app-input-field>
          </app-grid-layout>

          <app-grid-layout gap="24px" columns="repeat(auto-fit, minmax(min(100%, 450px), 1fr))">
            <app-input-field
              label="Nearby / Landmark"
              placeholder="e.g. Near City Center"
              formControlName="landmark"
              [icon]="icons.landmark"
              [error]="getErrorMessage('landmark')"
            ></app-input-field>
          </app-grid-layout>

          <app-grid-layout gap="24px" columns="repeat(auto-fit, minmax(min(100%, 450px), 1fr))">
             <app-input-field
              label="City"
              placeholder="Enter city"
              formControlName="city"
              [required]="true"
              [icon]="icons.city"
              [error]="getErrorMessage('city')"
            ></app-input-field>
            <app-input-field
              label="Pincode"
              placeholder="6 digits"
              formControlName="pincode"
              [required]="true"
              [icon]="icons.hash"
              inputMode="numeric"
              [maxLength]="6"
            ></app-input-field>
            <div *ngIf="companyForm.controls['pincode'].invalid && companyForm.controls['pincode'].touched" class="text-red-500 text-xs mt-1">
              Enter valid 6-digit pincode
            </div>
          </app-grid-layout>

          <footer class="form-actions">
            <app-button
              type="button"
              variant="secondary"
              (click)="onCancel()"
              [disabled]="isLoading"
            >
              Cancel
            </app-button>
            <app-button
              type="submit"
              variant="primary"
              [isLoading]="isLoading"
              [disabled]="companyForm.invalid || isLoading"
            >
              {{ isEdit ? 'Update' : 'Create' }}
            </app-button>
          </footer>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-container {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 40px 20px;
      min-height: 100%;
    }

    .form-card {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-soft);
      padding: 40px;
      width: 100%;
      border: 1px solid var(--border);
    }

    .form-header {
      margin-bottom: 40px;
      text-align: left;
    }

    .title-with-icon {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 4px;
    }

    .main-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary);
    }

    .main-icon ::ng-deep svg {
      width: 32px;
      height: 32px;
    }

    .form-title {
      font-size: 26px;
      font-weight: 600;
      color: var(--text-main);
      margin-bottom: 0px;
      letter-spacing: -0.5px;
    }

    .form-subtitle {
      font-size: 14px;
      color: var(--text-muted);
    }

    .company-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #F1F5F9;
    }

    @media (max-width: 768px) {
      .form-actions {
        flex-direction: column-reverse;
      }
      .form-actions > * {
        width: 100%;
      }
    }

    .add-btn-icon ::ng-deep svg {
      width: 18px;
      height: 18px;
    }

    .chip-remove-btn {
      background: #e2e8f0; 
      border: none; 
      padding: 0; 
      margin: 0; 
      color: #64748b; 
      cursor: pointer; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      width: 20px; 
      height: 20px; 
      border-radius: 50%; 
      transition: all 0.2s;
    }

    .chip-remove-btn:hover {
      color: #ef4444; 
      background: #fee2e2;
    }

    .chip-remove-btn ::ng-deep svg {
      width: 14px;
      height: 14px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyFormComponent implements OnInit {
  @Input() mode: 'add' | 'update' = 'add';
  @Input() companyId: number | null = null;

  companyForm!: FormGroup;
  isLoading = false;
  isEdit = false; // true for update
  editId: number | null = null;
  alertMessage: string | null = null;
  alertType: 'success' | 'error' = 'success';
  companyOptions: SelectOption[] = [];

  icons = {
    building: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M16 18h.01"/></svg>`,
    phone: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-phone"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    hash: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hash"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>`,
    plus: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
    trash: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
    mapPin: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    door: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-door-open"><path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.562v16.156a1 1 0 0 1-1.242.97L5 20V5.562a1 1 0 0 1 1.242-.97L12 6a1 1 0 0 1 1 1z"/></svg>`,
    street: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pinned"><path d="M18 8c0 4.5-6 9-6 9s-6-4.5-6-9a6 6 0 0 1 12 0Z"/><circle cx="12" cy="8" r="2"/><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/></svg>`,
    landmark: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-landmark"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>`,
    city: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-navigation"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`,
    x: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private companyService: CompanyService,
    private modalService: ModalService
  ) {}

  deliveryToLocations: string[] = [];
  locationInputError: string | null = null;
  newLocationControl = new FormControl('');

  addLocation(): void {
    const val = this.newLocationControl.value?.trim();
    if (!val) {
      this.locationInputError = 'Location cannot be empty';
      return;
    }
    
    const exists = this.deliveryToLocations.some(loc => loc.toLowerCase() === val.toLowerCase());
    if (exists) {
      this.locationInputError = 'Location already exists';
      return;
    }

    this.deliveryToLocations.push(val);
    this.newLocationControl.reset();
    this.locationInputError = null;
    this.companyForm.markAsDirty();
  }

  removeLocation(index: number): void {
    this.deliveryToLocations.splice(index, 1);
    this.companyForm.markAsDirty();
  }

  ngOnInit(): void {
    this.initForm();
    this.isEdit = this.mode === 'update';
    if (this.isEdit) {
      this.editId = this.companyId;
      this.loadCompanyList();
      if (this.editId) {
        this.fetchAndPatchCompany(this.editId);
      }
    }
  }

  initForm(): void {
    this.companyForm = this.fb.group({
      companyName: ['', Validators.required],
      gst_No: ['', [Validators.required, gstValidator]],
      phoneNumber: [''],
      door_No: [''],
      street_Name: ['', Validators.required],
      landmark: [''],
      city: ['', Validators.required],
      pincode: ['', [Validators.required, pincodeValidator]]
    });
  }

  loadCompanyList(): void {
    this.companyService.getCompanies().subscribe(companies => {
      this.companyOptions = companies.map(c => ({
        label: c.value,
        value: c.key
      }));
      this.cdr.markForCheck();
    });
  }

  async onCompanyChange(event: any) {
    const newId = Number(event.target.value);
    if (!newId) return;

    if (this.companyForm.dirty) {
      const confirmed = await this.modalService.showConfirmation({
        title: 'Switch Company?',
        message: 'Switching company will reset current data. Do you want to continue?'
      });

      if (!confirmed) {
        this.companyForm.get('companyId')?.setValue(this.companyId, { emitEvent: false });
        return;
      }
    }

    this.fetchAndPatchCompany(newId);
  }

  fetchAndPatchCompany(id: number): void {
    this.isLoading = true;
    this.companyService.getCompanyById(id).subscribe(details => {
      this.isLoading = false;
      if (details) {
        this.editId = details.companyId;
        this.companyForm.patchValue({
          companyId: details.companyId,
          companyName: details.companyName,
          phoneNumber: details.phoneNumber,
          gst_No: details.gst_No,
          door_No: details.door_No,
          street_Name: details.street_Name,
          landmark: details.landmark,
          city: details.city,
          pincode: details.pincode
        });

        // Patch delivery to array
        if (details.deliveryToLocations && Array.isArray(details.deliveryToLocations)) {
           this.deliveryToLocations = [...details.deliveryToLocations];
        } else if (details.deliveryTo) {
           this.deliveryToLocations = [details.deliveryTo];
        } else {
           this.deliveryToLocations = [];
        }

        this.companyForm.markAsPristine();
      }
      this.cdr.markForCheck();
    });
  }

  getErrorMessage(controlName: string): string | null {
    const control = this.companyForm.get(controlName);
    if (!control || !control.touched || !control.errors) return null;

    if (control.errors['required']) return 'This field is required';
    if (control.errors['pattern']) {
       if (controlName === 'gst_No') return 'Enter a valid 15-digit GST number';
       if (controlName === 'pincode') return 'Enter a valid 6-digit pincode';
    }

    return 'Invalid input';
  }

  onSubmit(): void {
    // 1. Validate form
    if (this.companyForm.invalid) {
      this.companyForm.markAllAsTouched();
      return;
    }

    // 2. Prepare payload
    const payload: CompanyRequest = {
      ...this.companyForm.value,
      deliveryToLocations: this.deliveryToLocations,
      mode: this.isEdit ? 'UPDATE' : 'INSERT',
      companyId: this.isEdit ? this.editId ?? undefined : undefined
    } as any;

    this.isLoading = true;

    // 3. Choice API
    const request$ = this.isEdit
      ? this.companyService.updateCompany(payload)
      : this.companyService.saveCompany(payload);

    // 4. Call API
    request$.subscribe({
      next: (res: CommonResponse) => {
        this.isLoading = false;
        if (res.status) {
          console.log('Success:', res);

          // Store response
          localStorage.setItem('companyId', res.id.toString());

          alert(res.message);

          // Reset form after create
          if (!this.isEdit) {
            this.companyForm.reset();
          }

          this.cdr.markForCheck();
          setTimeout(() => this.router.navigate(['/dashboard/company']), 2000);
        } else {
          alert(res.message);
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        alert('Something went wrong');
        this.cdr.markForCheck();
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/company']);
  }

  scrollToFirstError(): void {
    const firstInvalidControl = document.querySelector('.input-wrapper.invalid');
    if (firstInvalidControl) {
      firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = (firstInvalidControl as HTMLElement).querySelector('input');
      if (input) input.focus();
    }
  }
}
