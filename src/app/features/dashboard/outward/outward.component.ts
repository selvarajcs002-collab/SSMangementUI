import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CompanyService, CompanySummary } from '../../../core/services/company.service';
import { InwardService } from '../../../core/services/inward.service';
import { OutwardPreviewService, ChallanData, ChallanItem, ChallanSize } from '../../../core/services/outward-preview.service';
import { OutwardService } from '../../../core/services/outward.service';
import { Observable, forkJoin, Subject, takeUntil, take } from 'rxjs';
import { SectionHeaderComponent } from '../../../shared/components/section-header/section-header.component';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';
import { SizePickerModalComponent } from '../../../shared/components/size-picker-modal/size-picker-modal.component';
import { CustomSelectComponent } from '../../../shared/components/custom-select/custom-select.component';
import { MessageService } from '../../../core/services/message.service';
import { ModalService } from '../../../core/services/modal.service';
import { UpdateModalService } from '../../../core/services/update-modal.service';
import { ValidationErrorService } from '../../../core/services/validation-error.service';

@Component({
  selector: 'app-outward',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SectionHeaderComponent, SafeHtmlPipe, SizePickerModalComponent, CustomSelectComponent],
  templateUrl: './outward.component.html',
  styleUrl: './outward.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OutwardComponent implements OnInit {
  private destroy$ = new Subject<void>();
  private companyLoadSub?: any;
  outwardForm!: FormGroup;
  companies$: Observable<CompanySummary[]>;
  totalQuantity: number = 0;
  isSubmitting: boolean = false; // Used to disable submit button
  isOptionsLoading: boolean = false; // Used for company/options load
  isSizesLoading: boolean = false; // Used for size fetching
  fileName: string | null = null;
  imagePreview: string | null = null;
  isSizePickerOpen: boolean = false;
  isEditMode: boolean = false;
  editId: number | null = null;
  isLoading: boolean = false;

  // Dropdown Lists
  // Dynamic Binding State
  fullData: any[] = [];
  designOptions: string[] = [];
  styleOptions: string[] = [];
  colourOptions: string[] = [];

  selectedCompanyId: number | null = null;
  selectedCompany: any = null;
  selectedDesign: string = '';
  selectedStyle: string = '';
  selectedColour: string = '';
  selectedInwardId: number | null = null;

  isDataLoaded: boolean = false;
  sizeData: any[] = [];
  sizes: string[] = []; // Unified size storage

  // Icons
  icons = {
    company: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`,
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-days"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>`,
    plus: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M12 5v14"/><path d="M12 12H5"/><path d="M19 12h-7"/></svg>`,
    trash: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
    image: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image-plus"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><line x1="16" x2="22" y1="5" y2="5"/><line x1="19" x2="19" y1="2" y2="8"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    x: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
    update: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`
  };

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private companyService: CompanyService,
    private inwardService: InwardService,
    private outwardService: OutwardService,
    private outwardPreviewService: OutwardPreviewService,
    public updateModalService: UpdateModalService,
    private messageService: MessageService,
    private modalService: ModalService,
    private route: ActivatedRoute,
    private validationService: ValidationErrorService
  ) {
    this.companies$ = this.companyService.getCompanies();
  }

  ngOnInit(): void {
    this.initForm();
    this.trackChanges();
    this.checkEditMode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.outwardService.clearEditData();
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
    this.isLoading = true;
    this.cdr.markForCheck();

    // Check shared data first, then fall back to API
    this.outwardService.editData$.pipe(
      take(1) // Get the initial state once
    ).subscribe(data => {
      if (data && data.id === id) {
        this.patchForm(data);
        this.isLoading = false;
        this.cdr.markForCheck();
      } else {
        // Fetch from API if not in shared state
        this.outwardService.getOutwardByDcNo(id, 'OUTWARD').pipe(
          takeUntil(this.destroy$)
        ).subscribe({ // Default to OUTWARD for this route
          next: (res) => {
            if (res) {
              this.patchForm(res);
            }
            this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.messageService.error('Failed to load edit data');
            this.isLoading = false;
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  private patchForm(data: any): void {
    if (!data) return;

    // 1. Initial Company Load
    this.onCompanyChange(data.companyId);

    // 2. We need to wait for onCompanyChange to finish options loading
    // But since it's a stream, we'll patch values that don't depend on options first
    this.outwardForm.patchValue({
      companyId: data.companyId,
      outwardDate: data.createdDate ? new Date(data.createdDate).toISOString().split('T')[0] : null,
      styleNo: data.styleNo,
      colour: data.colour,
      designRef: data.designName,
      remarks: data.remarks || '',
      status: data.status || 'Active'
    });

    // 3. Clear and build size breakdown
    this.sizeBreakdown.clear();
    if (data.sizeCounts && data.sizeCounts.length > 0) {
      data.sizeCounts.forEach((sc: any) => {
        const row = this.fb.group({
          sizeCountId: [sc.sizeCountId], // Store ID for update
          size: [sc.size, Validators.required],
          quantity: [sc.count, [Validators.required, Validators.min(1)]]
        });
        this.sizeBreakdown.push(row);
      });
    }

    this.calculateTotal();
    this.onSelectionChange();
    this.cdr.markForCheck();
  }

  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];
    this.outwardForm = this.fb.group({
      companyId: ['', Validators.required],
      outwardDate: [{ value: today, disabled: true }, Validators.required],
      styleNo: [{ value: '', disabled: true }, Validators.required],
      colour: [{ value: '', disabled: true }, Validators.required],
      designRef: [{ value: '', disabled: true }],
      itemType: [{ value: 'size', disabled: true }, Validators.required],
      outwardImage: [{ value: null, disabled: true }],
      remarks: [{ value: '', disabled: true }],
      isLotCompleted: [false],
      sizeBreakdown: this.fb.array([])
    });
  }

  get sizeBreakdown(): FormArray {
    return this.outwardForm.get('sizeBreakdown') as FormArray;
  }

  // SelectOption converters for CustomSelectComponent
  get styleSelectOptions() { return this.styleOptions.map(s => ({ key: s, value: s })); }
  get colourSelectOptions() { return this.colourOptions.map(c => ({ key: c, value: c })); }
  get designSelectOptions() { return this.designOptions.map(d => ({ key: d, value: d })); }
  readonly itemTypeSelectOptions = [
    { key: 'size', value: 'Size Breakdown' },
    { key: 'roll', value: 'Roll / Bulk' }
  ];

  onCompanyChange(companyId: number) {
    this.resetForm();
    this.selectedCompanyId = companyId;
    this.outwardForm.patchValue({ companyId });

    this.isOptionsLoading = true;

    if (this.companyLoadSub) {
      this.companyLoadSub.unsubscribe();
    }

    this.companyLoadSub = forkJoin({
      options: this.inwardService.getDesignStyleColour(companyId),
      company: this.companyService.getCompanyById(companyId)
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        console.log('Data Loaded for Company:', companyId);
        this.fullData = res.options;
        this.selectedCompany = res.company;
        
        this.designOptions = [...new Set(res.options.map((x: any) => x.designName))];
        this.styleOptions = [...new Set(res.options.map((x: any) => x.styleNo))];
        this.colourOptions = [...new Set(res.options.map((x: any) => x.colour))];
        
        // Enable dependent fields
        const fields = ['outwardDate', 'styleNo', 'colour', 'designRef', 'itemType', 'outwardImage', 'remarks'];
        fields.forEach(f => this.outwardForm.get(f)?.enable());
        
        this.isDataLoaded = true;
        this.isOptionsLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading options:', err);
        this.isOptionsLoading = false;
        this.showAlert('Failed to load design/style/colour options', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  onSelectionChange() {
    // Sync form values to component properties
    const { designRef, styleNo, colour } = this.outwardForm.value;
    this.selectedDesign = designRef;
    this.selectedStyle = styleNo;
    this.selectedColour = colour;

    let filtered = this.fullData;

    if (this.selectedDesign) {
      filtered = filtered.filter(x => x.designName === this.selectedDesign);
    }

    if (this.selectedStyle) {
      filtered = filtered.filter(x => x.styleNo === this.selectedStyle);
    }

    if (this.selectedColour) {
      filtered = filtered.filter(x => x.colour === this.selectedColour);
    }

    this.designOptions = [...new Set(filtered.map(x => x.designName))];
    this.styleOptions = [...new Set(filtered.map(x => x.styleNo))];
    this.colourOptions = [...new Set(filtered.map(x => x.colour))];

    this.selectedInwardId = filtered.length ? filtered[0].inwardId : null;
  }

  selectSizes() {
    if (!this.selectedCompanyId || !this.selectedStyle || !this.selectedColour) {
      this.showAlert('Please select Company, Style, and Colour first.', 'error');
      return;
    }

    this.isSizesLoading = true;
    this.inwardService.getSizes(this.selectedCompanyId, this.selectedColour, this.selectedStyle).subscribe({
      next: (res: any[]) => {
        console.log('Sizes Data Loaded:', res);
        this.sizeData = res;
        if (res && res.length > 0) {
          this.sizes = res.map(x => (x.size || '').toUpperCase());
          this.isSizePickerOpen = true;
        } else {
          this.showAlert('No sizes found for this combination', 'error');
        }
        this.isSizesLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching sizes:', err);
        this.isSizesLoading = false;
        this.showAlert('Failed to fetch sizes', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  isFormValid() {
    return this.selectedCompanyId &&
           this.selectedStyle &&
           this.selectedColour &&
           this.sizeBreakdown.length > 0 &&
           this.outwardForm.valid;
  }

  resetForm() {
    this.fullData = [];
    this.designOptions = [];
    this.styleOptions = [];
    this.colourOptions = [];

    this.selectedDesign = '';
    this.selectedStyle = '';
    this.selectedColour = '';
    this.selectedInwardId = null;

    this.sizeData = [];
    this.isDataLoaded = false;
    
    this.outwardForm.patchValue({
      styleNo: '',
      colour: '',
      designRef: ''
    });

    // Lock fields back down
    const fields = ['outwardDate', 'styleNo', 'colour', 'designRef', 'itemType', 'outwardImage', 'remarks'];
    fields.forEach(f => this.outwardForm.get(f)?.disable());

    this.sizeBreakdown.clear();
  }

  private showAlert(message: string, type: 'success' | 'error'): void {
    if (type === 'success') {
      this.messageService.success(message);
    } else {
      this.messageService.error(message);
    }
  }

  onSizesSelected(selected: string[]): void {
    const currentSizes = this.sizeBreakdown.controls
      .map(c => c.get('size')?.value)
      .filter(s => !!s);

    selected.forEach(size => {
      if (!currentSizes.includes(size)) {
        this.addSizeRow(size);
      }
    });

    this.isSizePickerOpen = false;
  }

  addSizeRow(size?: string): void {
    const row = this.fb.group({
      sizeCountId: [null],
      size: [size || '', Validators.required],
      quantity: [null, [Validators.required, Validators.min(1)]]
    });
    this.sizeBreakdown.push(row);
  }

  removeSizeRow(index: number): void {
    if (this.sizeBreakdown.length > 1) {
      this.sizeBreakdown.removeAt(index);
    } else {
      this.sizeBreakdown.at(0).reset();
    }
    this.calculateTotal();
  }

  private trackChanges(): void {
    this.outwardForm.get('itemType')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      if (value !== 'size') {
        this.sizeBreakdown.clear();
      }
      this.calculateTotal();
    });

    this.sizeBreakdown.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.calculateTotal();
    });
  }

  calculateTotal(): void {
    this.totalQuantity = this.sizeBreakdown.controls.reduce((sum, control) => {
      const qty = control.get('quantity')?.value || 0;
      return sum + Number(qty);
    }, 0);
  }

  onFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.outwardForm.patchValue({ outwardImage: file });
      this.fileName = file.name;
    }
  }

  removeImage(): void {
    this.outwardForm.patchValue({ outwardImage: null });
    this.fileName = null;
  }

  onSubmit(): void {
    if (!this.isFormValid() && !this.isEditMode) {
      this.outwardForm.markAllAsTouched();
      this.showAlert('Please fill all required fields before submitting.', 'error');
      return;
    }

    this.isSubmitting = true;
    const formVal = this.outwardForm.getRawValue();

    if (this.isEditMode) {
      // ── UPDATE FLOW ───────────────────────────────────────────
      const updatePayload = {
        outwardId: this.editId!,
        companyId: this.selectedCompanyId!,
        colour: formVal.colour,
        designName: formVal.designRef || '',
        styleNo: formVal.styleNo,
        uploadURL: "null",
        createdBy: new Date().toLocaleDateString('en-GB').split('/').join('-'),
        status: formVal.status || "Active",
        remarks: formVal.remarks || "",
        sizeCounts: this.sizeBreakdown.getRawValue().map((c: any) => ({
          size: c.size,
          count: Number(c.quantity) || 0
        }))
      };

      this.outwardService.updateOutward(updatePayload).subscribe({
        next: (res) => {
          const isSuccess = res.success || res.Success;
          if (isSuccess) {
            this.handleSubmissionSuccess(res, 'Entry updated successfully!');
          } else {
            this.isSubmitting = false;
            const msg = res.message || res.Message;
            if (msg && (msg.includes('|') || msg.includes('Available'))) {
              this.validationService.show(msg);
            } else {
              this.messageService.error(msg || 'Failed to update entry');
            }
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isSubmitting = false;
          const errMsg = err.error?.message || 'Something went wrong during update';
          if (errMsg.includes('|') || errMsg.includes('Available')) {
            this.validationService.show(errMsg);
          } else {
            this.messageService.error(errMsg);
          }
          console.error('Update error:', err);
          this.cdr.markForCheck();
        }
      });

    } else {
      // ── INSERT FLOW ───────────────────────────────────────────
      const insertPayload = {
        outward: {
          outwardId: 0,
          mode: "INSERT",
          companyId: this.selectedCompanyId!,
          colour: formVal.colour,
          designName: formVal.designRef || '',
          styleNo: formVal.styleNo,
          uploadURL: "null",
          createdBy: new Date().toLocaleDateString('en-GB').split('/').join('-'),
          status: formVal.status || "Active",
          remarks: formVal.remarks || ""
        },
        sizes: this.sizeBreakdown.getRawValue().map((c: any) => ({
          size: c.size,
          count: Number(c.quantity) || 0
        }))
      };

      this.outwardService.saveOutward(insertPayload).subscribe({
        next: (res) => {
          const isSuccess = res.success || res.Success || (res.outwardId > 0) || (res.OutwardId > 0);
          if (isSuccess) {
            this.handleSubmissionSuccess(res, 'Entry saved successfully!');
          } else {
            this.isSubmitting = false;
            const msg = res.message || res.Message;
            if (msg && (msg.includes('|') || msg.includes('Available'))) {
              this.validationService.show(msg);
            } else {
              this.messageService.error(msg || 'Failed to save entry');
            }
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isSubmitting = false;
          const errMsg = err.error?.message || 'Failed to save outward entry. Please try again.';
          if (errMsg.includes('|') || errMsg.includes('Available')) {
            this.validationService.show(errMsg);
          } else {
            this.messageService.error(errMsg);
          }
          console.error('Error saving outward:', err);
          this.cdr.markForCheck();
        }
      });
    }
  }

  private handleSubmissionSuccess(res: any, successMessage: string): void {
    this.isSubmitting = false;
    this.messageService.success(successMessage);
    
    const isLotCompleted = this.outwardForm.get('isLotCompleted')?.value;
    const formVal = this.outwardForm.getRawValue();

    // Construct full preview data with defensive checks
    const previewData: ChallanData = {
      company: {
        name: 'SS Embroidery',
        address: 'H.No: 1-2-3/A, Street Name, Area Name,\nCity, State - PIN',
        gst: '33AABCS1234F1Z1',
        logo: null
      },
      date: formVal.outwardDate || new Date().toISOString().split('T')[0],
      dcNo: res.outwardDcNo || res.OutwardDcNo || `DC-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
      receiverName: this.selectedCompany?.companyName || 'Company Name',
      receiverAddress: `${this.selectedCompany?.door_No || this.selectedCompany?.Door_No || ''} ${this.selectedCompany?.street_Name || this.selectedCompany?.Street_Name || ''}\n${this.selectedCompany?.city || this.selectedCompany?.City || ''} - ${this.selectedCompany?.pincode || this.selectedCompany?.Pincode || ''}`,
      items: [{
        designName: formVal.designRef || '',
        styleNo: formVal.styleNo,
        colour: formVal.colour,
        sizes: this.sizeBreakdown.controls.map(c => ({
          label: c.get('size')?.value,
          qty: Number(c.get('quantity')?.value) || 0
        })),
        count: this.totalQuantity
      }],
      totalQty: this.totalQuantity,
      remarks: formVal.remarks || ""
    };

    this.outwardPreviewService.setPreviewData(previewData);

    if (isLotCompleted) {
      this.modalService.showConfirmation({
        title: 'Confirm Completion',
        message: 'Are you sure wants to confirm the lot has been completed',
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel'
      }).then((confirmed) => {
        if (confirmed) {
          this.router.navigate(['/dashboard/outward/preview']);
        } else {
          // If they cancel confirmation, we still usually go to preview 
          // as the record is saved. Or we could go to list.
          // Matching existing behavior: go to preview.
          this.router.navigate(['/dashboard/outward/preview']);
        }
      });
    } else {
      this.router.navigate(['/dashboard/outward/preview']);
    }
  }

  onCancel(): void {
    this.modalService.showConfirmation({
      title: 'Discard Changes?',
      message: 'Are you sure you want to cancel? All unsaved data will be lost.',
      confirmLabel: 'Yes, Discard',
      cancelLabel: 'No, Keep Editing'
    }).then((confirmed) => {
      if (confirmed) {
        this.resetForm();
        this.outwardForm.reset({
          outwardDate: new Date().toISOString().split('T')[0],
          itemType: 'size'
        });
        this.fileName = null;
      }
    });
  }
}
