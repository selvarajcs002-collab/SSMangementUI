import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { CompanyService, CompanySummary } from '../../../core/services/company.service';
import { InwardService } from '../../../core/services/inward.service';
import { Observable, map, startWith } from 'rxjs';
import { SectionHeaderComponent } from '../../../shared/components/section-header/section-header.component';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { CustomSelectComponent } from '../../../shared/components/custom-select/custom-select.component';
import { Router, ActivatedRoute } from '@angular/router';
import { UpdateModalService } from '../../../core/services/update-modal.service';
import { MessageService } from '../../../core/services/message.service';
import { OutwardService } from '../../../core/services/outward.service';
import { Subject, takeUntil, take } from 'rxjs';

@Component({
  selector: 'app-inward',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SectionHeaderComponent, SafeHtmlPipe, AlertComponent, CustomSelectComponent],
  templateUrl: './inward.component.html',
  styleUrl: './inward.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InwardComponent implements OnInit {
  inwardForm!: FormGroup;
  companies$: Observable<CompanySummary[]>;
  totalQuantity: number = 0;
  loading: boolean = false;
  isCompanySelected: boolean = false;
  isEditMode: boolean = false;
  editId: number | null = null;
  
  // Meter-Based Properties
  totalMeterQuantity: number = 0;
  totalBitsQuantity: number = 0;

  private destroy$ = new Subject<void>();

  // Icons (Lucide inspired SVG strings)
  icons = {
    company: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`,
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-days"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>`,
    plus: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M12 5v14"/><path d="M12 12H5"/><path d="M19 12h-7"/></svg>`,
    trash: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    x: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
    image: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image-plus"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><line x1="16" x2="22" y1="5" y2="5"/><line x1="19" x2="19" y1="2" y2="8"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
    palette: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-palette"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.688-1.688h1.938c3.102 0 5.625-2.433 5.625-5.469C22 5.658 17.558 2 12 2Z"/></svg>`,
    update: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`
  };

  imagePreview: string | null = null;
  fileName: string | null = null;

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private inwardService: InwardService,
    private outwardService: OutwardService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService,
    public updateModalService: UpdateModalService
  ) {
    this.companies$ = this.companyService.getCompanies();

    // Reactive listener for pre-fill data changes
    effect(() => {
      const data = this.updateModalService.preFillData();
      if (data) {
        this.applyPreFill(data);
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.trackChanges();
    this.checkEditMode();
    // Also check standard history state as fallback
    if (history.state?.preFill) {
      this.applyPreFill(history.state.preFill);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.inwardService.clearEditData();
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.editId = +id;
      this.loadEditData(this.editId);
    }
  }

  private loadEditData(id: number): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.inwardService.editData$.pipe(take(1)).subscribe(data => {
      if (data && data.id === id) {
        this.patchForm(data);
        this.loading = false;
      } else {
        // Fallback to API via OutwardService's shared method for both modes
        this.outwardService.getOutwardByDcNo(id, 'INWARD').pipe(takeUntil(this.destroy$)).subscribe({
          next: (res) => {
            try {
              if (res) this.patchForm(res);
            } catch (err: any) {
              console.error('Error in patchForm:', err);
              this.messageService.error('Error patching form: ' + err.message);
            } finally {
              this.loading = false;
              this.cdr.markForCheck();
            }
          },
          error: (err: any) => {
            this.messageService.error('Failed to load edit details');
            this.loading = false;
            this.cdr.markForCheck();
          }
        });
      }
      this.cdr.markForCheck();
    });
  }

  private patchForm(data: any): void {
    this.onCompanyChange(data.companyId);
    
    // Check if it's meter based payload based on response shape, default to 'S'
    const isMeterBased = data.entryType === 'M' || (data.meterDetails && data.meterDetails.length > 0);

    this.inwardForm.patchValue({
      entryType: isMeterBased ? 'M' : 'S',
      companyId: data.companyId,
      colour: data.colour,
      designName: data.designName,
      styleNo: data.styleNo,
      inwardDcNo: data.dcNo || data.inwardDcNo,
      uploadURL: data.uploadURL
    }, { emitEvent: false });

    if (isMeterBased) {
      this.meterDetails.clear();
      if (data.meterDetails && data.meterDetails.length > 0) {
        data.meterDetails.forEach((md: any) => {
          const row = this.fb.group({
            meterPerBit: [md.meterValue || md.meterPerBit, [Validators.required, Validators.min(0.01)]],
            bitsCount: [md.bitsCount, [Validators.required, Validators.min(1)]],
            totalMeter: [{ value: md.totalMeter, disabled: true }]
          });
          this.meterDetails.push(row);
        });
      } else {
        this.addEmptyMeterRow();
      }
    } else {
      this.sizes.clear();
      if (data.sizeCounts && data.sizeCounts.length > 0) {
        data.sizeCounts.forEach((sc: any) => {
          const row = this.fb.group({
            size: [sc.size, Validators.required],
            count: [sc.count, [Validators.required, Validators.min(1)]]
          });
          this.sizes.push(row);
        });
      } else {
        this.addSizeRow();
      }
    }

    this.calculateTotal();
    this.calculateMeterTotal();
    this.cdr.markForCheck();
  }

  private applyPreFill(data: any): void {
    console.log('Applying pre-fill data:', data);
    // Use a small timeout to ensure form and child selects are ready for binding
    setTimeout(() => {
      this.onCompanyChange(data.companyId);
      this.inwardForm.patchValue(data);
      this.updateModalService.clearPreFillData();
      this.cdr.markForCheck();
    }, 0);
  }

  private initForm(): void {
    const duplicateMeterValidator = (control: any) => {
      const formArray = control as FormArray;
      const meters = formArray.controls.map(ctrl => Number(ctrl.get('meterPerBit')?.value));
      const validMeters = meters.filter(m => !isNaN(m) && m > 0);
      const uniqueMeters = new Set(validMeters);
      if (uniqueMeters.size !== validMeters.length) {
        return { duplicateMeter: true };
      }
      return null;
    };

    this.inwardForm = this.fb.group({
      entryType: ['S', Validators.required], // 'S' for Size, 'M' for Meter
      companyId: [null, Validators.required],
      colour: [{ value: '', disabled: true }, Validators.required],
      designName: [{ value: '', disabled: true }, Validators.required],
      styleNo: [{ value: '', disabled: true }, Validators.required],
      inwardDcNo: [{ value: '', disabled: true }, Validators.required],
      uploadURL: [{ value: '', disabled: true }],
      sizes: this.fb.array([]),
      meterDetails: this.fb.array([], duplicateMeterValidator)
    });

    this.addSizeRow();
    
    // Switch validation/view logic based on entry type
    this.inwardForm.get('entryType')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(type => {
      if (type === 'S') {
        this.meterDetails.clear();
        if (this.sizes.length === 0) this.addSizeRow();
      } else if (type === 'M') {
        this.sizes.clear();
        if (this.meterDetails.length === 0) this.addEmptyMeterRow();
      }
      // If we switch, clear the totals
      this.calculateTotal();
      this.calculateMeterTotal();
      this.cdr.markForCheck();
    });
  }

  get sizes(): FormArray {
    return this.inwardForm.get('sizes') as FormArray;
  }

  get meterDetails(): FormArray {
    return this.inwardForm.get('meterDetails') as FormArray;
  }

  addSizeRow(): void {
    const row = this.fb.group({
      size: ['', Validators.required],
      count: [null, [Validators.required, Validators.min(1)]]
    });
    this.sizes.push(row);
  }

  removeSizeRow(index: number): void {
    if (this.sizes.length > 1) {
      this.sizes.removeAt(index);
    } else {
      this.sizes.at(0).reset();
    }
  }

  addEmptyMeterRow(): void {
    const row = this.fb.group({
      meterPerBit: [null, [Validators.required, Validators.min(0.01)]],
      bitsCount: [null, [Validators.required, Validators.min(1)]],
      totalMeter: [{ value: 0, disabled: true }]
    });
    this.meterDetails.push(row);
  }

  removeMeterRow(index: number): void {
    if (this.meterDetails.length > 1) {
      this.meterDetails.removeAt(index);
    } else {
      this.meterDetails.at(0).reset();
    }
  }

  private trackChanges(): void {
    // Auto sum counts
    this.sizes.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.calculateTotal();
    });

    this.meterDetails.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((values) => {
      values.forEach((val: any, index: number) => {
        const bits = val.bitsCount || 0;
        const meter = val.meterPerBit || 0;
        const total = bits * meter;
        
        const control = this.meterDetails.at(index).get('totalMeter');
        if (control?.value !== total) {
          control?.setValue(total, { emitEvent: false });
        }
      });
      this.calculateMeterTotal();
    });
  }

  onCompanyChange(companyId: any): void {
    if (companyId) {
      this.isCompanySelected = true;
      // Enable dependent fields
      const fields = ['colour', 'designName', 'styleNo', 'inwardDcNo', 'uploadURL'];
      fields.forEach(f => this.inwardForm.get(f)?.enable());
    } else {
      this.isCompanySelected = false;
      this.resetForm();
    }
    this.cdr.markForCheck();
  }

  calculateTotal(): void {
    this.totalQuantity = this.sizes.controls.reduce((sum, control) => {
      const count = control.get('count')?.value || 0;
      return sum + Number(count);
    }, 0);
  }

  calculateMeterTotal(): void {
    this.totalBitsQuantity = 0;
    this.totalMeterQuantity = 0;
    this.meterDetails.controls.forEach(control => {
      const bits = Number(control.get('bitsCount')?.value) || 0;
      const meter = Number(control.get('meterPerBit')?.value) || 0;
      this.totalBitsQuantity += bits;
      this.totalMeterQuantity += (bits * meter);
    });
  }

  alertMessage: string | null = null;
  alertType: 'success' | 'error' = 'success';

  onSubmit(): void {
    const entryType = this.inwardForm.get('entryType')?.value;
    
    // Additional Validation for Meter Based
    if (entryType === 'M') {
      if (this.meterDetails.length === 0) {
        this.showAlert('Please add at least one meter row.', 'error');
        return;
      }
      
      let valid = true;
      let duplicateMeters = false;
      const meters = new Set();

      this.meterDetails.controls.forEach(ctrl => {
        const meterVal = Number(ctrl.get('meterPerBit')?.value);
        if (meters.has(meterVal)) {
          duplicateMeters = true;
        }
        if (meterVal > 0) {
          meters.add(meterVal);
        }

        if (ctrl.invalid) valid = false;
      });

      if (duplicateMeters) {
        this.showAlert('Duplicate meter entries are not allowed.', 'error');
        return;
      }

      if (!valid) {
        this.inwardForm.markAllAsTouched();
        return;
      }
    }

    if (this.inwardForm.invalid && !this.isEditMode) {
      this.inwardForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const userId = Number(localStorage.getItem('userId')) || 1;
    const formVal = this.inwardForm.getRawValue();

    if (this.isEditMode) {
      const updatePayload = {
        inward_id: this.editId!,
        company_id: Number(formVal.companyId),
        colour: formVal.colour,
        design_name: formVal.designName,
        style_no: formVal.styleNo,
        inward_dc_no: formVal.inwardDcNo,
        updated_by: userId,
        entry_type: entryType,
        sizes: entryType === 'S' ? formVal.sizes : [],
        meter_details: entryType === 'M' ? formVal.meterDetails.map((md: any) => ({
            meterValue: Number(md.meterPerBit),
            bitsCount: Number(md.bitsCount),
            totalMeter: Number(md.meterPerBit) * Number(md.bitsCount)
        })) : []
      };

      this.inwardService.updateInward(updatePayload).subscribe({
        next: (res) => {
          this.loading = false;
          this.messageService.success('Entry updated successfully!');
          this.router.navigate(['/dashboard/delivery-challan']);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.messageService.error('Failed to update entry');
          this.cdr.markForCheck();
        }
      });
    } else {
      if (entryType === 'M') {
        const meterPayload = {
          entryType: 'M',
          companyId: Number(formVal.companyId),
          colour: formVal.colour,
          designName: formVal.designName,
          styleNo: formVal.styleNo,
          inwardDcNo: formVal.inwardDcNo,
          uploadURL: this.fileName || '',
          createdBy: userId,
          meterDetails: formVal.meterDetails.map((md: any) => ({
            meterValue: Number(md.meterPerBit),
            bitsCount: Number(md.bitsCount),
            totalMeter: Number(md.meterPerBit) * Number(md.bitsCount)
          }))
        };
        
        this.inwardService.saveMeterInward(meterPayload).subscribe({
          next: () => {
            this.loading = false;
            this.messageService.success('Saved Successfully');
            this.resetForm();
            this.cdr.markForCheck();
          },
          error: () => {
            this.loading = false;
            this.messageService.error('Something went wrong');
            this.cdr.markForCheck();
          }
        });

      } else {
        const payload = {
          inward: {
            companyId: Number(formVal.companyId),
            colour: formVal.colour,
            designName: formVal.designName,
            styleNo: formVal.styleNo,
            inwardDcNo: formVal.inwardDcNo,
            uploadURL: this.fileName || '',
            createdBy: userId
          },
          sizes: formVal.sizes
        };

        this.inwardService.saveInward(payload).subscribe({
          next: () => {
            this.loading = false;
            this.messageService.success('Saved Successfully');
            this.resetForm();
            this.cdr.markForCheck();
          },
          error: () => {
            this.loading = false;
            this.messageService.error('Something went wrong');
            this.cdr.markForCheck();
          }
        });
      }
    }
  }

  private showAlert(message: string, type: 'success' | 'error'): void {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => {
      this.alertMessage = null;
    }, 5000);
  }

  private resetForm(): void {
    const defaultEntry = this.inwardForm.get('entryType')?.value || 'S';
    this.inwardForm.reset({ entryType: defaultEntry });
    
    // Lock fields back down
    const fields = ['colour', 'designName', 'styleNo', 'inwardDcNo', 'uploadURL'];
    fields.forEach(f => this.inwardForm.get(f)?.disable());
    this.isCompanySelected = false;

    this.sizes.clear();
    this.addSizeRow();
    
    this.meterDetails.clear();
    
    this.fileName = null;
    this.imagePreview = null;
    this.totalQuantity = 0;
    this.totalBitsQuantity = 0;
    this.totalMeterQuantity = 0;
    this.cdr.markForCheck();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.fileName = file.name;
      this.inwardForm.patchValue({ uploadURL: file.name });
      
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.inwardForm.patchValue({ uploadURL: '' });
    this.imagePreview = null;
    this.fileName = null;
  }

  onCancel(): void {
    if (confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
      this.resetForm();
    }
  }
}
