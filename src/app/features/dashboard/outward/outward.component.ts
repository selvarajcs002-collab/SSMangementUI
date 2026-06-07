import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CompanyService, CompanySummary } from '../../../core/services/company.service';
import { InwardService } from '../../../core/services/inward.service';
import { OutwardPreviewService, ChallanData, ChallanItem, ChallanSize } from '../../../core/services/outward-preview.service';
import { OutwardService, MeterOutwardSavePayload } from '../../../core/services/outward.service';
import { Observable, forkJoin, Subject, takeUntil, take } from 'rxjs';
import { SectionHeaderComponent } from '../../../shared/components/section-header/section-header.component';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';
import { SizePickerModalComponent } from '../../../shared/components/size-picker-modal/size-picker-modal.component';
import { MeterPickerModalComponent, AvailableMeter } from '../../../shared/components/meter-picker-modal/meter-picker-modal.component';
import { CustomSelectComponent } from '../../../shared/components/custom-select/custom-select.component';
import { MessageService } from '../../../core/services/message.service';
import { ModalService } from '../../../core/services/modal.service';
import { UpdateModalService } from '../../../core/services/update-modal.service';
import { ValidationErrorService } from '../../../core/services/validation-error.service';
import { AppDatePickerComponent } from '../../../shared/components/app-date-picker/app-date-picker.component';

@Component({
  selector: 'app-outward',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SectionHeaderComponent,
    SafeHtmlPipe,
    SizePickerModalComponent,
    MeterPickerModalComponent,
    CustomSelectComponent,
    AppDatePickerComponent
  ],
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
  sizes: any[] = []; // Unified size storage (with size and availableQty)
  activeColourName: string = '';

  // â”€â”€ NEW: Meter-Based Properties (isolated from size-based) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  entryType: 'size' | 'meter' = 'size'; // 'size' = existing flow, 'meter' = new flow
  totalMeterQuantity: number = 0;
  totalBitsQuantity: number = 0;
  totalPiecesQuantity: number = 0;
  isMeterPickerOpen: boolean = false;
  availableMeters: AvailableMeter[] = [];
  isMetersLoading: boolean = false;

  // Icons
  icons = {
    company: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`,
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-days"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>`,
    plus: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M12 5v14"/><path d="M12 12H5"/><path d="M19 12h-7"/></svg>`,
    trash: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
    image: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image-plus"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><line x1="16" x2="22" y1="5" y2="5"/><line x1="19" x2="19" y1="2" y2="8"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    x: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
    update: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`,
    chevronUp: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-up"><path d="m18 15-6-6-6 6"/></svg>`
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

    const isMeterBased = data.entryType === 'M' || (data.meterDetails && data.meterDetails.length > 0);
    this.setEntryType(isMeterBased ? 'meter' : 'size');

    if (isMeterBased) {
      this.meterBreakdown.clear();
      if (data.meterDetails && data.meterDetails.length > 0) {
        data.meterDetails.forEach((md: any) => {
          const row = this.fb.group({
            meterPerBit: [md.meterValue || md.meterPerBit, [Validators.required, Validators.min(0.01)]],
            bitsCount: [md.bitsCount, [Validators.required, Validators.min(1), Validators.pattern(/^[0-9]+$/)]],
            piecesCount: [md.piecesCount || null, [Validators.required, Validators.min(1), Validators.pattern(/^[0-9]+$/)]],
            totalMeter: [{ value: md.totalMeter, disabled: true }]
          });

          // Real-time calculation for this row
          row.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
            const meter = Number(row.get('meterPerBit')?.value) || 0;
            const bits = Number(row.get('bitsCount')?.value) || 0;
            const total = parseFloat((meter * bits).toFixed(3));
            row.get('totalMeter')?.setValue(total, { emitEvent: false });
            this.calculateMeterTotals();
            this.cdr.markForCheck();
          });

          this.meterBreakdown.push(row);
        });
      } else {
        this.addMeterRow();
      }
      this.calculateMeterTotals();
    } else {
      // 3. Clear and build colour breakdown
      this.colourBreakdowns.clear();
      
      if (data.colourBreakdowns && data.colourBreakdowns.length > 0) {
        data.colourBreakdowns.forEach((cb: any) => {
          const sizeBreakdownsArray: any = this.fb.array([]);
          
          const sizesList = cb.sizes || cb.sizeBreakdowns;
          if (sizesList && sizesList.length > 0) {
            sizesList.forEach((sb: any) => {
              const sizeGroup = this.fb.group({
                sizeId: [sb.sizeCountId || sb.sizeId || sb.sizeName || sb.size],
                sizeName: [sb.size || sb.sizeName, Validators.required],
                availableQty: [sb.availableQty || 9999],
                quantity: [sb.count || sb.quantity, [Validators.required, Validators.min(1)]]
              });
              
              sizeGroup.get('quantity')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
                this.calculateTotal();
              });
              sizeBreakdownsArray.push(sizeGroup);
            });
          }
          
          const colourGroup = this.fb.group({
            colourId: [cb.colourId || cb.colour || cb.colourName],
            colourName: [cb.colour || cb.colourName],
            colourTotal: [cb.colourTotal || 0],
            sizeBreakdowns: sizeBreakdownsArray
          });
          
          this.colourBreakdowns.push(colourGroup);
        });
      } else if (data.sizeCounts && data.sizeCounts.length > 0) {
        // Fallback for legacy single colour
        const sizeBreakdownsArray: any = this.fb.array([]);
        data.sizeCounts.forEach((sc: any) => {
          const sizeGroup = this.fb.group({
            sizeId: [sc.size],
            sizeName: [sc.size, Validators.required],
            availableQty: [9999],
            quantity: [sc.count, [Validators.required, Validators.min(1)]]
          });
          sizeGroup.get('quantity')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
            this.calculateTotal();
          });
          sizeBreakdownsArray.push(sizeGroup);
        });
        
        const colourName = data.colour || 'UNKNOWN';
        const colourGroup = this.fb.group({
          colourId: [colourName],
          colourName: [colourName],
          colourTotal: [0],
          sizeBreakdowns: sizeBreakdownsArray
        });
        this.colourBreakdowns.push(colourGroup);
      }

      this.calculateTotal();
    }
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
      colourBreakdowns: this.fb.array([]),
      // NEW: Isolated FormArray for meter-based rows
      meterBreakdown: this.fb.array([])
    });
  }

  get colourBreakdowns(): FormArray {
    return this.outwardForm.get('colourBreakdowns') as FormArray;
  }

  isAddColourModalOpen = false;
  availableColoursForModal: any[] = [];
  selectedColoursForModal: string[] = [];
  activeColourIndexForSize: number | null = null;
  totalColours: number = 0;
  totalSizes: number = 0;

  // NEW: Getter for the isolated meter FormArray
  get meterBreakdown(): FormArray {
    return this.outwardForm.get('meterBreakdown') as FormArray;
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
    const { designRef, styleNo, colour } = this.outwardForm.getRawValue();
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

  openAddColourModal() {
    if (!this.selectedCompanyId || !this.selectedStyle) {
      this.showAlert('Please select Company and Style first.', 'error');
      return;
    }
    const existingColours = this.colourBreakdowns.controls.map(c => c.get('colourName')?.value);
    this.availableColoursForModal = this.colourOptions
      .filter(c => !existingColours.includes(c))
      .map(c => ({ key: c, value: c }));
    this.selectedColoursForModal = [];
    this.isAddColourModalOpen = true;
  }

  confirmAddColour() {
    if (!this.selectedColoursForModal || this.selectedColoursForModal.length === 0) return;
    
    this.selectedColoursForModal.forEach(colourName => {
      const colourGroup = this.fb.group({
        colourId: [colourName],
        colourName: [colourName],
        colourTotal: [0],
        sizeBreakdowns: this.fb.array([]) as any
      });
      this.colourBreakdowns.push(colourGroup);
    });
    
    this.isAddColourModalOpen = false;
    this.calculateTotal();
  }

  cancelAddColour() {
    this.isAddColourModalOpen = false;
  }

  removeColourRow(index: number) {
    this.colourBreakdowns.removeAt(index);
    this.calculateTotal();
  }

  openSizeModal(colourIndex: number) {
    this.activeColourIndexForSize = colourIndex;
    const colourName = this.colourBreakdowns.at(colourIndex).get('colourName')?.value;
    
    this.isSizesLoading = true;
    this.inwardService.getSizes(this.selectedCompanyId!, colourName, this.selectedStyle!).subscribe({
      next: (res: any[]) => {
        const existingSizes = this.getSizeBreakdowns(colourIndex).controls.map(c => c.get('sizeName')?.value);
        this.sizeData = res.filter(x => !existingSizes.includes((x.size || '').toUpperCase()));
        
        if (this.sizeData && this.sizeData.length > 0) {
          this.sizes = this.sizeData.map(x => ({
            size: (x.size || '').toUpperCase(),
            availableQty: x.availableQty || x.count || 0
          }));
          this.activeColourName = colourName;
          this.isSizePickerOpen = true;
        } else {
          this.showAlert('No available sizes found for this colour', 'error');
        }
        this.isSizesLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSizesLoading = false;
        this.showAlert('Failed to fetch sizes', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  getSizeBreakdowns(colourIndex: number): FormArray {
    return this.colourBreakdowns.at(colourIndex).get('sizeBreakdowns') as FormArray;
  }

  onSizesSelected(selected: string[]): void {
    if (this.activeColourIndexForSize === null) return;
    const sizeArray = this.getSizeBreakdowns(this.activeColourIndexForSize);
    
    selected.forEach(sizeName => {
      const sizeInfo = this.sizeData.find(x => (x.size || '').toUpperCase() === sizeName);
      const availableQty = sizeInfo ? (sizeInfo.availableQty || sizeInfo.count || 9999) : 9999;
      
      const sizeGroup = this.fb.group({
        sizeId: [sizeName],
        sizeName: [sizeName],
        availableQty: [availableQty],
        quantity: [null, [Validators.required, Validators.min(1), Validators.max(availableQty)]]
      });
      
      sizeGroup.get('quantity')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.calculateTotal();
      });
      
      sizeArray.push(sizeGroup);
    });
    
    this.isSizePickerOpen = false;
    this.activeColourIndexForSize = null;
    this.calculateTotal();
  }

  removeSizeRow(colourIndex: number, sizeIndex: number): void {
    this.getSizeBreakdowns(colourIndex).removeAt(sizeIndex);
    this.calculateTotal();
  }

  clearAllSizes(cIndex: number) {
    this.modalService.showConfirmation({
      title: 'Clear Sizes',
      message: 'Are you sure you want to clear all sizes for this colour?',
      confirmLabel: 'Clear All',
      cancelLabel: 'Cancel'
    }).then(confirmed => {
      if (confirmed) {
        this.getSizeBreakdowns(cIndex).clear();
        this.calculateTotal();
        this.cdr.markForCheck();
      }
    });
  }

  selectMeters() {
    if (!this.selectedCompanyId || !this.selectedStyle || !this.selectedColour) {
      this.showAlert('Please select Company, Style, and Colour first.', 'error');
      return;
    }

    this.isMetersLoading = true;
    this.inwardService.getMeters(this.selectedCompanyId, this.selectedColour, this.selectedStyle).subscribe({
      next: (res: any[]) => {
        if (res && res.length > 0) {
          this.availableMeters = res.map(x => ({
            meterValue: x.meterValue,
            availableBits: x.availableBits,
            availableMeter: x.availableMeter
          }));
          this.isMeterPickerOpen = true;
        } else {
          this.showAlert('No meter stock found for this combination', 'error');
        }
        this.isMetersLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isMetersLoading = false;
        this.showAlert('Failed to fetch meters', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  onMetersSelected(selected: AvailableMeter[]): void {
    const currentMeters = this.meterBreakdown.controls
      .map(c => Number(c.get('meterPerBit')?.value))
      .filter(v => v > 0);

    selected.forEach(m => {
      if (!currentMeters.includes(m.meterValue)) {
        this.addMeterRow(m.meterValue);
      }
    });

    this.isMeterPickerOpen = false;
    this.cdr.markForCheck();
  }

  isFormValid() {
    if (this.entryType === 'meter') {
      return this.selectedCompanyId &&
             this.selectedStyle &&
             this.selectedColour &&
             this.meterBreakdown.length > 0 &&
             this.meterBreakdown.valid &&
             this.outwardForm.get('companyId')?.valid &&
             this.outwardForm.get('outwardDate')?.valid &&
             this.outwardForm.get('styleNo')?.valid &&
             this.outwardForm.get('colour')?.valid;
    }
    return this.selectedCompanyId &&
           this.selectedStyle &&
           this.colourBreakdowns.length > 0 &&
           this.colourBreakdowns.valid &&
           this.outwardForm.get('companyId')?.valid &&
           this.outwardForm.get('outwardDate')?.valid &&
           this.outwardForm.get('styleNo')?.valid;
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

    const fields = ['outwardDate', 'styleNo', 'colour', 'designRef', 'itemType', 'outwardImage', 'remarks'];
    fields.forEach(f => this.outwardForm.get(f)?.disable());

    this.colourBreakdowns.clear();
    this.meterBreakdown.clear();
    this.totalMeterQuantity = 0;
    this.totalBitsQuantity = 0;
    this.totalPiecesQuantity = 0;
    this.totalQuantity = 0;
    this.totalColours = 0;
    this.totalSizes = 0;
  }

  private showAlert(message: string, type: 'success' | 'error'): void {
    if (type === 'success') {
      this.messageService.success(message);
    } else {
      this.messageService.error(message);
    }
  }

  private trackChanges(): void {
    this.outwardForm.get('itemType')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      if (value !== 'size') {
        this.colourBreakdowns.clear();
      }
      this.calculateTotal();
    });
  }

  calculateTotal(): void {
    let grandTotal = 0;
    let totalSizes = 0;
    
    this.colourBreakdowns.controls.forEach(colourCtrl => {
      const sizes = colourCtrl.get('sizeBreakdowns') as FormArray;
      let colourTotal = 0;
      
      sizes.controls.forEach(sizeCtrl => {
        colourTotal += Number(sizeCtrl.get('quantity')?.value || 0);
      });
      
      colourCtrl.get('colourTotal')?.setValue(colourTotal, {emitEvent: false});
      grandTotal += colourTotal;
      totalSizes += sizes.length;
    });
    
    this.totalQuantity = grandTotal;
    this.totalColours = this.colourBreakdowns.length;
    this.totalSizes = totalSizes;
    this.cdr.markForCheck();
  }

  // â”€â”€ NEW: Meter-Based Methods (completely isolated) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /** Toggle between size-based and meter-based entry */
  setEntryType(type: 'size' | 'meter'): void {
    this.entryType = type;
    if (type === 'size') {
      this.meterBreakdown.clear();
      this.totalMeterQuantity = 0;
      this.totalBitsQuantity = 0;
      this.totalPiecesQuantity = 0;
      this.outwardForm.get('colour')?.clearValidators();
    } else {
      this.colourBreakdowns.clear();
      this.totalQuantity = 0;
      this.totalColours = 0;
      this.totalSizes = 0;
      this.outwardForm.get('colour')?.setValidators(Validators.required);
    }
    this.outwardForm.get('colour')?.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  /** Add a new empty meter row */
  addMeterRow(meterValue?: number): void {
    const row = this.fb.group({
      meterPerBit: [meterValue !== undefined ? meterValue : null, [Validators.required, Validators.min(0.01)]],
      bitsCount: [null, [Validators.required, Validators.min(1), Validators.pattern(/^[0-9]+$/)]],
      piecesCount: [null, [Validators.required, Validators.min(1), Validators.pattern(/^[0-9]+$/)]],
      totalMeter: [{ value: 0, disabled: true }]
    });

    // Real-time calculation for this row
    row.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const meter = Number(row.get('meterPerBit')?.value) || 0;
      const bits = Number(row.get('bitsCount')?.value) || 0;
      const total = parseFloat((meter * bits).toFixed(3));
      row.get('totalMeter')?.setValue(total, { emitEvent: false });
      this.calculateMeterTotals();
      this.cdr.markForCheck();
    });

    this.meterBreakdown.push(row);
    this.cdr.markForCheck();
  }

  /** Remove a meter row */
  removeMeterRow(index: number): void {
    if (this.meterBreakdown.length > 1) {
      this.meterBreakdown.removeAt(index);
    } else {
      this.meterBreakdown.at(0).reset({ meterPerBit: null, bitsCount: null, piecesCount: null, totalMeter: 0 });
    }
    this.calculateMeterTotals();
    this.cdr.markForCheck();
  }

  /** Recalculate footer summary totals */
  calculateMeterTotals(): void {
    let totalBits = 0;
    let totalPieces = 0;
    let totalMeter = 0;
    this.meterBreakdown.controls.forEach(ctrl => {
      totalBits += Number(ctrl.get('bitsCount')?.value) || 0;
      totalPieces += Number(ctrl.get('piecesCount')?.value) || 0;
      totalMeter += Number(ctrl.get('totalMeter')?.value) || 0;
    });
    this.totalBitsQuantity = totalBits;
    this.totalPiecesQuantity = totalPieces;
    this.totalMeterQuantity = parseFloat(totalMeter.toFixed(3));
  }

  /** Validate for duplicate meter values */
  private hasDuplicateMeterValues(): boolean {
    const vals = this.meterBreakdown.controls
      .map(c => Number(c.get('meterPerBit')?.value))
      .filter(v => v > 0);
    return new Set(vals).size !== vals.length;
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
    const formVal = this.outwardForm.getRawValue();

    // â”€â”€ NEW METER FLOW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (this.entryType === 'meter') {
      if (!this.isFormValid()) {
        this.outwardForm.markAllAsTouched();
        this.meterBreakdown.controls.forEach(c => c.markAllAsTouched());
        this.showAlert('Please fill all required fields before submitting.', 'error');
        return;
      }
      if (this.hasDuplicateMeterValues()) {
        this.showAlert('Duplicate meter values are not allowed.', 'error');
        return;
      }
      if (this.meterBreakdown.length === 0) {
        this.showAlert('Please add at least one meter row.', 'error');
        return;
      }

      this.isSubmitting = true;
      const meterPayload: MeterOutwardSavePayload = {
        outwardId: this.isEditMode ? this.editId! : 0,
        mode: this.isEditMode ? 'UPDATE' : 'INSERT',
        entryType: 'M',
        companyId: this.selectedCompanyId!,
        colour: formVal.colour,
        designName: formVal.designRef || '',
        styleNo: formVal.styleNo,
        uploadURL: this.fileName || '',
        createdBy: new Date().toLocaleDateString('en-GB').split('/').join('-'),
        status: formVal.status || 'Active',
        remarks: formVal.remarks || '',
        outwardDate: formVal.outwardDate,
        meterDetails: this.meterBreakdown.getRawValue().map((r: any) => ({
          meterPerBit: Number(r.meterPerBit),
          bitsCount: Number(r.bitsCount),
          piecesCount: Number(r.piecesCount),
          totalMeter: Number(r.totalMeter)
        }))
      };

      this.outwardService.saveMeterOutward(meterPayload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          // Construct full preview data for Meter-based flow
          const previewData: ChallanData = {
            company: {
              name: 'S.S.EMBROIDERY',
              address: 'No:12, Discovery Nagar\n2nd Street, Kangarainagaram\nTIRUPUR - 641 666, Tamil Nadu India\nGST: 33AEMFS9121J1ZF',
              gst: '33AEMFS9121J1ZF',
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
              sizes: [],
              count: this.totalMeterQuantity
            }],
            totalQty: this.totalMeterQuantity,
            remarks: formVal.remarks || "",
            entryType: 'M',
            meterDetails: this.meterBreakdown.getRawValue().map((r: any) => ({
              meterPerBit: Number(r.meterPerBit),
              bitsCount: Number(r.bitsCount),
              piecesCount: Number(r.piecesCount),
              totalMeter: Number(r.totalMeter)
            })),
            totalMeterSum: this.totalMeterQuantity,
            totalPiecesSum: this.totalPiecesQuantity
          };

          this.outwardPreviewService.setPreviewData(previewData);

          const isLotCompleted = this.outwardForm.get('isLotCompleted')?.value;
          if (isLotCompleted) {
            this.modalService.showConfirmation({
              title: 'Confirm Completion',
              message: 'Are you sure wants to confirm the lot has been completed',
              confirmLabel: 'Confirm',
              cancelLabel: 'Cancel'
            }).then((confirmed) => {
              this.router.navigate(['/dashboard/outward/preview']);
            });
          } else {
            this.router.navigate(['/dashboard/outward/preview']);
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.messageService.error(err.error?.message || 'Failed to save meter outward entry.');
          this.cdr.markForCheck();
        }
      });
      return; // Stop here â€” do NOT fall through to size-based flow
    }

    // â”€â”€ EXISTING SIZE FLOW (100% unchanged below) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (!this.isFormValid() && !this.isEditMode) {
      this.outwardForm.markAllAsTouched();
      this.showAlert('Please fill all required fields before submitting.', 'error');
      return;
    }

    this.isSubmitting = true;

    if (this.isEditMode) {
      // â”€â”€ UPDATE FLOW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const updatePayload = {
        outwardId: this.editId!,
        companyId: this.selectedCompanyId!,
        colour: formVal.colour || 'MULTI',
        designName: formVal.designRef || '',
        styleNo: formVal.styleNo,
        uploadURL: "null",
        createdBy: new Date().toLocaleDateString('en-GB').split('/').join('-'),
        status: formVal.status || "Active",
        remarks: formVal.remarks || "",
        colourBreakdowns: this.colourBreakdowns.getRawValue().map((c: any) => ({
          colourId: c.colourId,
          colourName: c.colourName,
          colourTotal: c.colourTotal,
          sizeBreakdowns: c.sizeBreakdowns.map((s: any) => ({
            sizeId: s.sizeId,
            sizeName: s.sizeName,
            availableQty: s.availableQty,
            quantity: Number(s.quantity) || 0
          }))
        })),
        sizeCounts: this.colourBreakdowns.getRawValue().reduce((acc: any[], c: any) => {
          return acc.concat(c.sizeBreakdowns.map((s: any) => ({
            sizeId: s.sizeId,
            size: s.sizeName,
            count: Number(s.quantity) || 0
          })));
        }, [])
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
      // â”€â”€ INSERT FLOW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const insertPayload = {
        outward: {
          outwardId: 0,
          mode: "INSERT",
          companyId: this.selectedCompanyId!,
          colour: formVal.colour || 'MULTI',
          designName: formVal.designRef || '',
          styleNo: formVal.styleNo,
          uploadURL: "null",
          createdBy: new Date().toLocaleDateString('en-GB').split('/').join('-'),
          status: formVal.status || "Active",
          remarks: formVal.remarks || ""
        },
        colourBreakdowns: this.colourBreakdowns.getRawValue().map((c: any) => ({
          colourId: c.colourId,
          colourName: c.colourName,
          colourTotal: c.colourTotal,
          sizeBreakdowns: c.sizeBreakdowns.map((s: any) => ({
            sizeId: s.sizeId,
            sizeName: s.sizeName,
            availableQty: s.availableQty,
            quantity: Number(s.quantity) || 0
          }))
        })),
        sizes: this.colourBreakdowns.getRawValue().reduce((acc: any[], c: any) => {
          return acc.concat(c.sizeBreakdowns.map((s: any) => ({
            sizeId: s.sizeId,
            size: s.sizeName,
            count: Number(s.quantity) || 0
          })));
        }, [])
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
      items: this.colourBreakdowns.controls.map((c: any) => ({
        designName: formVal.designRef || '',
        styleNo: formVal.styleNo,
        colour: c.get('colourName')?.value,
        sizes: (c.get('sizeBreakdowns') as FormArray).controls.map(s => ({
          label: String(s.get('sizeName')?.value),
          qty: Number(s.get('quantity')?.value) || 0
        })),
        count: Number(c.get('colourTotal')?.value) || 0
      })),
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
