import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
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
import { Subject, takeUntil, take, forkJoin } from 'rxjs';

@Component({
  selector: 'app-inward',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SectionHeaderComponent, SafeHtmlPipe, AlertComponent, CustomSelectComponent],
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

  // Matrix Totals
  grandTotal: number = 0;
  columnTotals: { [key: string]: number } = {};

  // UI Modals State
  isAddColourModalOpen: boolean = false;
  isAddSizeModalOpen: boolean = false;
  tempColourName: string = '';
  tempColours: string[] = [];
  masterColours: string[] = [];
  filteredMasterColours: string[] = [];
  isMasterColoursLoading: boolean = false;

  tempSizeName: string = '';
  tempSizes: string[] = [];
  popularSizes: string[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];
  // tempSizeCode is no longer needed since it's not in the new design, but keep it if anything relies on it.

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
      poNo: data.poNo || '',
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
      this.colourChips.clear();
      this.sizeChips.clear();
      this.matrix.clear();

      if (data.colour) {
        this.addColourChip(data.colour);
      }

      if (data.sizeCounts && data.sizeCounts.length > 0) {
        data.sizeCounts.forEach((sc: any) => {
          this.addSizeChip(sc.size);
        });

        // After adding chips and sizes, set the values
        if (this.matrix.length > 0) {
          const firstRow = this.matrix.at(0);
          const quantitiesGroup = firstRow.get('quantities') as FormGroup;
          data.sizeCounts.forEach((sc: any) => {
            if (quantitiesGroup.contains(sc.size)) {
              quantitiesGroup.get(sc.size)?.setValue(sc.count, { emitEvent: false });
            }
          });
        }
      }
    }

    this.calculateTotals();
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
      colour: [{ value: '', disabled: true }],
      designName: [{ value: '', disabled: true }, Validators.required],
      styleNo: [{ value: '', disabled: true }, Validators.required],
      inwardDcNo: [{ value: '', disabled: true }, Validators.required],
      poNo: [{ value: '', disabled: true }],
      uploadURL: [{ value: '', disabled: true }],
      colourChips: this.fb.array([]),
      sizeChips: this.fb.array([]),
      matrix: this.fb.array([]),
      meterDetails: this.fb.array([], duplicateMeterValidator)
    });

    // Switch validation/view logic based on entry type
    this.inwardForm.get('entryType')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(type => {
      if (type === 'S') {
        this.meterDetails.clear();
      } else if (type === 'M') {
        if (this.meterDetails.length === 0) this.addEmptyMeterRow();
      }
      this.calculateTotals();
      this.calculateMeterTotal();
      this.cdr.markForCheck();
    });
  }

  get colourChips(): FormArray {
    return this.inwardForm.get('colourChips') as FormArray;
  }

  get sizeChips(): FormArray {
    return this.inwardForm.get('sizeChips') as FormArray;
  }

  get matrix(): FormArray {
    return this.inwardForm.get('matrix') as FormArray;
  }

  get meterDetails(): FormArray {
    return this.inwardForm.get('meterDetails') as FormArray;
  }

  // --- Dynamic Chip & Matrix Logic ---

  openAddColourModal(): void {
    if (!this.isCompanySelected) return;
    this.tempColourName = '';
    this.tempColours = [];
    this.isAddColourModalOpen = true;
    this.loadMasterColours();
  }

  loadMasterColours(): void {
    if (this.masterColours.length > 0) {
      this.filteredMasterColours = [...this.masterColours];
      return;
    }

    this.isMasterColoursLoading = true;
    // Assuming backend returns an array of objects like { key: 1, value: "Red" } or array of strings
    this.inwardService.getMasterColours().subscribe({
      next: (res: any[]) => {
        // Map based on the expected /Master/list/type response, usually objects with a name/value property
        // We handle strings directly if it's an array of strings, or extract 'name'/'value'
        const names = res.map(item => typeof item === 'string' ? item : (item.name || item.value || item.colourName || '')).filter(n => !!n);
        this.masterColours = [...new Set(names)];
        this.filteredMasterColours = [...this.masterColours];
        this.isMasterColoursLoading = false;
      },
      error: () => {
        // Fallback or handle error
        this.isMasterColoursLoading = false;
        // Optionally populate some default fallbacks if API fails
        this.masterColours = ['Red', 'Navy', 'Bottle Green', 'Maroon', 'Black', 'White', 'Yellow', 'Brown', 'Orange', 'Green', 'Grey', 'Sky Blue'];
        this.filteredMasterColours = [...this.masterColours];
      }
    });
  }

  onColourSearchChange(): void {
    const query = (this.tempColourName || '').toLowerCase().trim();
    if (!query) {
      this.filteredMasterColours = [...this.masterColours];
      return;
    }
    this.filteredMasterColours = this.masterColours.filter(c => c.toLowerCase().includes(query));
  }

  addTempColour(): void {
    const rawVal = (this.tempColourName || '').trim();
    if (!rawVal) {
      return;
    }

    // Support comma-separated pasting
    const values = rawVal.split(',').map(v => v.trim().toUpperCase()).filter(v => !!v);
    let addedCount = 0;
    let duplicateFound = false;

    for (const val of values) {
      // Case insensitive duplicate check against main grid and temp list
      const existsInMain = this.colourChips.controls.some(c => c.value.toLowerCase() === val.toLowerCase());
      const existsInTemp = this.tempColours.some(c => c.toLowerCase() === val.toLowerCase());

      if (existsInMain || existsInTemp) {
        duplicateFound = true;
      } else {
        this.tempColours.push(val);
        addedCount++;
      }
    }

    if (duplicateFound && addedCount === 0) {
      this.showAlert('Colour(s) already added', 'error');
    }

    this.tempColourName = '';
    this.onColourSearchChange(); // reset filter
  }

  selectMasterColour(colour: string): void {
    this.tempColourName = colour;
    this.addTempColour();
  }

  removeTempColour(index: number): void {
    this.tempColours.splice(index, 1);
  }

  confirmAddMultipleColours(): void {
    if (this.tempColourName.trim()) {
      this.addTempColour();
    }

    this.tempColours.forEach(c => {
      this.addColourChip(c);
    });
    this.isAddColourModalOpen = false;
  }

  addColourChip(colour: string): void {
    this.colourChips.push(this.fb.control(colour));

    const quantitiesGroup = this.fb.group({});
    // Add existing sizes to the new colour row
    this.sizeChips.controls.forEach(sizeCtrl => {
      quantitiesGroup.addControl(sizeCtrl.value, this.fb.control('', [Validators.min(0)]));
    });

    this.matrix.push(this.fb.group({
      colour: [colour],
      quantities: quantitiesGroup
    }));

    this.calculateTotals();
    this.cdr.markForCheck();
  }

  removeColourRow(index: number): void {
    const row = this.matrix.at(index);
    const hasValues = Object.values(row.value.quantities || {}).some(v => v !== null && v !== '' && Number(v) > 0);

    if (hasValues) {
      if (!confirm('This colour contains entered quantities. Continue?')) return;
    } else if (this.colourChips.length === 1) {
      if (!confirm('Are you sure you want to remove the last colour?')) return;
    }

    this.colourChips.removeAt(index);
    this.matrix.removeAt(index);
    this.calculateTotals();
  }

  openAddSizeModal(): void {
    if (!this.isCompanySelected) return;
    this.tempSizeName = '';
    this.tempSizes = [];
    this.isAddSizeModalOpen = true;
  }

  addTempSize(): void {
    const rawVal = (this.tempSizeName || '').trim();
    if (!rawVal) {
      return;
    }

    const values = rawVal.split(',').map(v => v.trim().toUpperCase()).filter(v => !!v);
    let addedCount = 0;
    let duplicateFound = false;

    for (const val of values) {
      const existsInMain = this.sizeChips.controls.some(c => c.value.toLowerCase() === val.toLowerCase());
      const existsInTemp = this.tempSizes.some(c => c.toLowerCase() === val.toLowerCase());

      if (existsInMain || existsInTemp) {
        duplicateFound = true;
      } else {
        this.tempSizes.push(val);
        addedCount++;
      }
    }

    if (duplicateFound && addedCount === 0) {
      this.showAlert('Size(s) already added', 'error');
    }

    this.tempSizeName = '';
  }

  selectPopularSize(size: string): void {
    this.tempSizeName = size;
    this.addTempSize();
  }

  removeTempSize(index: number): void {
    this.tempSizes.splice(index, 1);
  }

  confirmAddMultipleSizes(): void {
    if (this.tempSizeName.trim()) {
      this.addTempSize();
    }

    this.tempSizes.forEach(s => {
      this.addSizeChip(s);
    });
    this.isAddSizeModalOpen = false;
  }

  addSizeChip(size: string): void {
    this.sizeChips.push(this.fb.control(size));

    // Add the new size control to all existing colour rows
    this.matrix.controls.forEach(row => {
      const qGroup = row.get('quantities') as FormGroup;
      qGroup.addControl(size, this.fb.control('', [Validators.min(0)]));
    });

    this.calculateTotals();
    this.cdr.markForCheck();
  }

  removeSizeColumn(sizeIndex: number): void {
    const sizeName = this.sizeChips.at(sizeIndex).value;

    // Check if any row has quantity for this size
    let hasValues = false;
    this.matrix.controls.forEach(row => {
      const qty = row.value.quantities[sizeName];
      if (qty !== null && qty !== '' && Number(qty) > 0) hasValues = true;
    });

    if (hasValues) {
      if (!confirm('This size contains entered quantities. Continue?')) return;
    } else if (this.sizeChips.length === 1) {
      if (!confirm('Are you sure you want to remove the last size?')) return;
    }

    this.sizeChips.removeAt(sizeIndex);
    this.matrix.controls.forEach(row => {
      const qGroup = row.get('quantities') as FormGroup;
      qGroup.removeControl(sizeName);
    });

    this.calculateTotals();
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
    this.matrix.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.calculateTotals();
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
      const fields = ['colour', 'designName', 'styleNo', 'inwardDcNo', 'uploadURL', 'poNo'];
      fields.forEach(f => this.inwardForm.get(f)?.enable());
    } else {
      this.isCompanySelected = false;
      this.resetForm();
    }
    this.cdr.markForCheck();
  }

  calculateTotals(): void {
    this.grandTotal = 0;
    this.columnTotals = {};

    this.sizeChips.controls.forEach(s => {
      this.columnTotals[s.value] = 0;
    });

    this.matrix.controls.forEach(row => {
      const qGroup = row.get('quantities') as FormGroup;
      let rowTot = 0;
      this.sizeChips.controls.forEach(s => {
        const val = Number(qGroup.get(s.value)?.value) || 0;
        rowTot += val;
        this.columnTotals[s.value] += val;
      });
      this.grandTotal += rowTot;
    });
  }

  getRowTotal(rowIndex: number): number {
    let tot = 0;
    const qGroup = this.matrix.at(rowIndex).get('quantities') as FormGroup;
    if (qGroup) {
      this.sizeChips.controls.forEach(s => {
        tot += Number(qGroup.get(s.value)?.value) || 0;
      });
    }
    return tot;
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
    } else {
      // Validate Size Based Matrix
      if (this.colourChips.length === 0) {
        this.showAlert('Please add at least one colour.', 'error');
        return;
      }
      if (this.sizeChips.length === 0) {
        this.showAlert('Please add at least one size.', 'error');
        return;
      }

      let hasAnyQuantity = false;
      this.matrix.controls.forEach(row => {
        const qGroup = row.get('quantities') as FormGroup;
        this.sizeChips.controls.forEach(s => {
          const val = Number(qGroup.get(s.value)?.value) || 0;
          if (val > 0) hasAnyQuantity = true;
        });
      });

      if (!hasAnyQuantity) {
        this.showAlert('Please enter at least one quantity greater than zero.', 'error');
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
      if (entryType === 'M') {
        const updatePayload = {
          inward_id: this.editId!,
          company_id: Number(formVal.companyId),
          colour: formVal.colour,
          design_name: formVal.designName,
          style_no: formVal.styleNo,
          inward_dc_no: formVal.inwardDcNo,
          po_no: formVal.poNo,
          updated_by: userId,
          entry_type: 'M',
          sizes: [],
          meter_details: formVal.meterDetails.map((md: any) => ({
            meterValue: Number(md.meterPerBit),
            bitsCount: Number(md.bitsCount),
            totalMeter: Number(md.meterPerBit) * Number(md.bitsCount)
          }))
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
        // Edit Mode: Size Based
        const requests: Observable<any>[] = [];

        formVal.matrix.forEach((row: any, index: number) => {
          const sizesToSave: any[] = [];
          this.sizeChips.controls.forEach(s => {
            const qty = Number(row.quantities[s.value]);
            if (qty > 0) {
              sizesToSave.push({ size: s.value, count: qty });
            }
          });

          if (sizesToSave.length > 0) {
            if (index === 0) {
              // Update the original entry
              const updatePayload = {
                inward_id: this.editId!,
                company_id: Number(formVal.companyId),
                colour: row.colour,
                design_name: formVal.designName,
                style_no: formVal.styleNo,
                inward_dc_no: formVal.inwardDcNo,
                po_no: formVal.poNo,
                updated_by: userId,
                entry_type: 'S',
                sizes: sizesToSave,
                meter_details: []
              };
              requests.push(this.inwardService.updateInward(updatePayload));
            } else {
              // Any additional colours added during edit should be created
              const savePayload = {
                inward: {
                  companyId: Number(formVal.companyId),
                  colour: row.colour,
                  designName: formVal.designName,
                  styleNo: formVal.styleNo,
                  inwardDcNo: formVal.inwardDcNo,
                  poNo: formVal.poNo,
                  uploadURL: this.fileName || '',
                  createdBy: userId
                },
                sizes: sizesToSave
              };
              requests.push(this.inwardService.saveInward(savePayload));
            }
          }
        });

        if (requests.length > 0) {
          forkJoin(requests).subscribe({
            next: () => {
              this.loading = false;
              this.messageService.success('Entry updated successfully!');
              this.router.navigate(['/dashboard/delivery-challan']);
              this.cdr.markForCheck();
            },
            error: () => {
              this.loading = false;
              this.messageService.error('Failed to update entry');
              this.cdr.markForCheck();
            }
          });
        } else {
          this.loading = false;
          this.messageService.error('No quantities entered');
        }
      }
    } else {
      if (entryType === 'M') {
        const meterPayload = {
          entryType: 'M',
          companyId: Number(formVal.companyId),
          colour: formVal.colour,
          designName: formVal.designName,
          styleNo: formVal.styleNo,
          inwardDcNo: formVal.inwardDcNo,
          poNo: formVal.poNo,
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
        // Size Based: New Entry (Multi-Colour)
        const requests: Observable<any>[] = [];

        formVal.matrix.forEach((row: any) => {
          const sizesToSave: any[] = [];
          this.sizeChips.controls.forEach(s => {
            const qty = Number(row.quantities[s.value]);
            if (qty > 0) {
              sizesToSave.push({ size: s.value, count: qty });
            }
          });

          if (sizesToSave.length > 0) {
            const payload = {
              inward: {
                companyId: Number(formVal.companyId),
                colour: row.colour,
                designName: formVal.designName,
                styleNo: formVal.styleNo,
                inwardDcNo: formVal.inwardDcNo,
                poNo: formVal.poNo,
                uploadURL: this.fileName || '',
                createdBy: userId
              },
              sizes: sizesToSave
            };
            requests.push(this.inwardService.saveInward(payload));
          }
        });

        if (requests.length > 0) {
          forkJoin(requests).subscribe({
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
          this.loading = false;
          this.messageService.error('Please enter at least one quantity.');
        }
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
    const fields = ['colour', 'designName', 'styleNo', 'inwardDcNo', 'uploadURL', 'poNo'];
    fields.forEach(f => this.inwardForm.get(f)?.disable());
    this.isCompanySelected = false;

    this.colourChips.clear();
    this.sizeChips.clear();
    this.matrix.clear();

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
