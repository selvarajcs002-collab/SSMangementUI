import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, map } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CompanyService, CompanySummary } from '../../../core/services/company.service';
import { StockManagementService } from '../../../core/services/stock-management.service';
import { MessageService } from '../../../core/services/message.service';
import { DashboardFilterStateService, DashboardFilterState } from '../../../core/services/dashboard-filter-state.service';
import { SelectOption, CustomSelectComponent } from '../../../shared/components/custom-select/custom-select.component';
import { AppDatePickerComponent } from '../../../shared/components/app-date-picker/app-date-picker.component';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-dashboard-filter-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CustomSelectComponent, SafeHtmlPipe, AppDatePickerComponent],
  templateUrl: './dashboard-filter-dialog.component.html',
  styleUrl: './dashboard-filter-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardFilterDialogComponent implements OnInit, OnDestroy {
  @Output() apply = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  filterForm!: FormGroup;
  companies$: Observable<SelectOption[]>;
  styleOptions: SelectOption[] = [];
  designOptions: SelectOption[] = [];
  colourOptions: SelectOption[] = [];
  
  dcOptions: SelectOption[] = [];
  
  isStyleLoading: boolean = false;
  isDesignLoading: boolean = false;
  isColourLoading: boolean = false;
  isDcLoading: boolean = false;
  
  private cache = new Map<string, SelectOption[]>();
  
  private destroy$ = new Subscription();
  private originalState!: DashboardFilterState;

  icons = {
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>`,
    company: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`,
    style: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42Z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>`,
    design: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.688-1.688h1.938c3.102 0 5.625-2.433 5.625-5.469C22 5.658 17.558 2 12 2Z"/></svg>`,
    colour: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/><path d="m5 2 5 5"/><path d="M2 13h15"/><path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z"/></svg>`,
    filter: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,
    size: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h.01"/><path d="M17 7h.01"/><path d="M7 17h.01"/><path d="M17 17h.01"/></svg>`,
    meter: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/></svg>`,
    all: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
    reset: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    dc: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`
  };

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private stockService: StockManagementService,
    private filterStateService: DashboardFilterStateService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService
  ) {
    this.companies$ = this.companyService.getCompanies() as unknown as Observable<SelectOption[]>;
  }

  private styleSub?: Subscription;
  private designSub?: Subscription;
  private colourSub?: Subscription;
  private dcSub?: Subscription;

  ngOnInit(): void {
    // Lock scroll
    document.body.style.overflow = 'hidden';
    
    // Get current state
    this.originalState = { ...this.filterStateService.currentState };
    this.initForm(this.originalState);
    this.setupDcDependency();
    
    if (this.originalState.companyId) {
      this.fetchStyles(Number(this.originalState.companyId), this.originalState.styleNo);
    }
  }

  ngOnDestroy(): void {
    // Unlock scroll
    document.body.style.overflow = '';
    this.destroy$.unsubscribe();
    if (this.styleSub) this.styleSub.unsubscribe();
    if (this.designSub) this.designSub.unsubscribe();
    if (this.colourSub) this.colourSub.unsubscribe();
    if (this.dcSub) this.dcSub.unsubscribe();
  }

  private initForm(state: DashboardFilterState): void {
    this.filterForm = this.fb.group({
      fromDate: [state.fromDate],
      toDate: [state.toDate],
      companyId: [state.companyId],
      styleNo: [{ value: state.styleNo, disabled: !state.companyId }],
      designName: [{ value: state.designName, disabled: !state.styleNo }],
      colour: [{ value: state.colour, disabled: !state.designName }],
      mode: [state.mode || 'S'],
      isDcBased: [state.isDcBased || false],
      deliveryChallans: [{ value: state.deliveryChallans || [], disabled: true }]
    });
  }

  onCompanyChange(companyId: any): void {
    this.filterForm.patchValue({ styleNo: null, designName: null, colour: null, deliveryChallans: [] });
    this.filterForm.get('styleNo')?.disable();
    this.filterForm.get('designName')?.disable();
    this.filterForm.get('colour')?.disable();
    this.filterForm.get('deliveryChallans')?.disable();
    
    this.styleOptions = [];
    this.designOptions = [];
    this.colourOptions = [];
    this.dcOptions = [];

    if (companyId) {
      this.fetchStyles(companyId);
    }
    this.cdr.markForCheck();
  }

  onStyleChange(styleNo: any): void {
    this.filterForm.patchValue({ designName: null, colour: null, deliveryChallans: [] });
    this.filterForm.get('designName')?.disable();
    this.filterForm.get('colour')?.disable();
    this.filterForm.get('deliveryChallans')?.disable();
    
    this.designOptions = [];
    this.colourOptions = [];
    this.dcOptions = [];

    const companyId = this.filterForm.get('companyId')?.value;
    if (companyId && styleNo) {
      this.fetchDesigns(companyId, styleNo);
    }
    this.cdr.markForCheck();
  }

  onDesignChange(designName: any): void {
    this.filterForm.patchValue({ colour: null, deliveryChallans: [] });
    this.filterForm.get('colour')?.disable();
    this.filterForm.get('deliveryChallans')?.disable();
    
    this.colourOptions = [];
    this.dcOptions = [];

    const companyId = this.filterForm.get('companyId')?.value;
    const styleNo = this.filterForm.get('styleNo')?.value;
    if (companyId && styleNo && designName) {
      this.fetchColours(companyId, styleNo, designName);
    }
    this.cdr.markForCheck();
  }

  onColourChange(colour: any): void {
    this.filterForm.patchValue({ deliveryChallans: [] });
    this.filterForm.get('deliveryChallans')?.disable();
    this.dcOptions = [];

    const companyId = this.filterForm.get('companyId')?.value;
    const styleNo = this.filterForm.get('styleNo')?.value;
    const designName = this.filterForm.get('designName')?.value;
    
    if (companyId && styleNo && designName && colour && this.filterForm.get('isDcBased')?.value) {
      this.fetchDeliveryChallans(companyId, styleNo, designName, colour);
    }
    this.cdr.markForCheck();
  }

  private fetchStyles(companyId: number, setVal?: string | null): void {
    const cacheKey = `styles_${companyId}`;
    if (this.cache.has(cacheKey)) {
      this.styleOptions = this.cache.get(cacheKey) || [];
      if (this.styleOptions.length > 0) this.filterForm.get('styleNo')?.enable();
      if (setVal) {
        this.filterForm.patchValue({ styleNo: setVal });
        this.fetchDesigns(companyId, setVal, this.originalState.designName);
      }
      return;
    }

    if (this.styleSub) this.styleSub.unsubscribe();
    this.isStyleLoading = true;
    this.filterForm.get('styleNo')?.disable({ emitEvent: false });
    this.cdr.markForCheck();

    this.styleSub = this.stockService.getStyles(companyId).subscribe({
      next: (res) => {
        this.styleOptions = (res || []).map((s: any) => ({ key: s.value, value: s.displayText }));
        this.cache.set(cacheKey, this.styleOptions);
        if (this.styleOptions.length > 0) {
          this.filterForm.get('styleNo')?.enable({ emitEvent: false });
          if (setVal) {
            this.filterForm.patchValue({ styleNo: setVal });
            this.fetchDesigns(companyId, setVal, this.originalState.designName);
          }
        }
        this.isStyleLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.styleOptions = [];
        this.isStyleLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private fetchDesigns(companyId: number, styleNo: string, setVal?: string | null): void {
    const cacheKey = `designs_${companyId}_${styleNo}`;
    if (this.cache.has(cacheKey)) {
      this.designOptions = this.cache.get(cacheKey) || [];
      if (this.designOptions.length > 0) this.filterForm.get('designName')?.enable();
      if (setVal) {
        this.filterForm.patchValue({ designName: setVal });
        this.fetchColours(companyId, styleNo, setVal, this.originalState.colour);
      }
      return;
    }

    if (this.designSub) this.designSub.unsubscribe();
    this.isDesignLoading = true;
    this.filterForm.get('designName')?.disable({ emitEvent: false });
    this.cdr.markForCheck();

    this.designSub = this.stockService.getDesigns(companyId, styleNo).subscribe({
      next: (res) => {
        this.designOptions = (res || []).map((s: any) => ({ key: s.value, value: s.displayText }));
        this.cache.set(cacheKey, this.designOptions);
        if (this.designOptions.length > 0) {
          this.filterForm.get('designName')?.enable({ emitEvent: false });
          if (setVal) {
            this.filterForm.patchValue({ designName: setVal });
            this.fetchColours(companyId, styleNo, setVal, this.originalState.colour);
          }
        }
        this.isDesignLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.designOptions = [];
        this.isDesignLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private fetchColours(companyId: number, styleNo: string, designName: string, setVal?: string | null): void {
    const cacheKey = `colours_${companyId}_${styleNo}_${designName}`;
    if (this.cache.has(cacheKey)) {
      this.colourOptions = this.cache.get(cacheKey) || [];
      if (this.colourOptions.length > 0) this.filterForm.get('colour')?.enable();
      if (setVal) {
        this.filterForm.patchValue({ colour: setVal });
        if (this.filterForm.get('isDcBased')?.value) {
            this.fetchDeliveryChallans(companyId, styleNo, designName, setVal, this.originalState.deliveryChallans);
        }
      }
      return;
    }

    if (this.colourSub) this.colourSub.unsubscribe();
    this.isColourLoading = true;
    this.filterForm.get('colour')?.disable({ emitEvent: false });
    this.cdr.markForCheck();

    this.colourSub = this.stockService.getColours(companyId, styleNo, designName).subscribe({
      next: (res) => {
        this.colourOptions = (res || []).map((s: any) => ({ key: s.value, value: s.displayText }));
        this.cache.set(cacheKey, this.colourOptions);
        if (this.colourOptions.length > 0) {
          this.filterForm.get('colour')?.enable({ emitEvent: false });
          if (setVal) {
            this.filterForm.patchValue({ colour: setVal });
            if (this.filterForm.get('isDcBased')?.value) {
                this.fetchDeliveryChallans(companyId, styleNo, designName, setVal, this.originalState.deliveryChallans);
            }
          }
        }
        this.isColourLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.colourOptions = [];
        this.isColourLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private setupDcDependency(): void {
    const sub = this.filterForm.get('isDcBased')?.valueChanges.subscribe(isDc => {
        if (isDc) {
            const vals = this.filterForm.getRawValue();
            if (vals.companyId && vals.styleNo && vals.designName && vals.colour) {
                this.fetchDeliveryChallans(vals.companyId, vals.styleNo, vals.designName, vals.colour);
            }
        } else {
            this.filterForm.get('deliveryChallans')?.disable({ emitEvent: false });
            this.filterForm.get('deliveryChallans')?.setValue([], { emitEvent: false });
            this.dcOptions = [];
        }
    });
    if (sub) this.destroy$.add(sub);
  }

  private fetchDeliveryChallans(companyId: number, styleNo: string, designName: string, colour: string, setVal?: any[] | null): void {
    const cacheKey = `dc_${companyId}_${styleNo}_${designName}_${colour}`;
    if (this.cache.has(cacheKey)) {
      this.dcOptions = this.cache.get(cacheKey) || [];
      if (this.dcOptions.length > 0) this.filterForm.get('deliveryChallans')?.enable();
      if (setVal) this.filterForm.patchValue({ deliveryChallans: setVal });
      return;
    }

    if (this.dcSub) this.dcSub.unsubscribe();
    this.isDcLoading = true;
    this.filterForm.get('deliveryChallans')?.disable({ emitEvent: false });
    this.cdr.markForCheck();

    this.dcSub = this.stockService.getDeliveryChallans(companyId, styleNo, designName, colour).subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          this.dcOptions = res.map((dc: any) => ({
            key: dc.deliveryChallanNo || dc.inwardDcNo || dc.value || dc,
            value: dc.deliveryChallanNo || dc.inwardDcNo || dc.displayText || dc
          }));
          this.cache.set(cacheKey, this.dcOptions);
          this.filterForm.get('deliveryChallans')?.enable({ emitEvent: false });
          if (setVal) this.filterForm.patchValue({ deliveryChallans: setVal });
        } else {
          this.dcOptions = [];
          this.cache.set(cacheKey, []);
        }
        this.isDcLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.dcOptions = [];
        this.isDcLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onReset(): void {
    this.filterStateService.resetState();
    const state = this.filterStateService.currentState;
    
    this.filterForm.reset({
      fromDate: state.fromDate,
      toDate: state.toDate,
      companyId: state.companyId,
      styleNo: state.styleNo,
      designName: state.designName,
      colour: state.colour,
      mode: state.mode,
      isDcBased: state.isDcBased,
      deliveryChallans: state.deliveryChallans || []
    });

    this.filterForm.get('styleNo')?.disable();
    this.filterForm.get('designName')?.disable();
    this.filterForm.get('colour')?.disable();
    this.styleOptions = [];
    this.designOptions = [];
    this.colourOptions = [];
    
    this.filterStateService.updateState(this.filterForm.getRawValue());
    this.apply.emit();
  }

  onCancel(): void {
    // Revert form state back to original
    this.filterStateService.updateState(this.originalState);
    this.cancel.emit();
  }

  onApply(): void {
    if (this.filterForm.valid) {
      const formValues = this.filterForm.getRawValue();
      
      if (formValues.fromDate && formValues.toDate) {
        const from = new Date(formValues.fromDate);
        const to = new Date(formValues.toDate);
        if (from > to) {
          this.messageService.error('From Date cannot be greater than To Date.');
          return;
        }
      }

      if (formValues.isDcBased) {
        if (!formValues.deliveryChallans || formValues.deliveryChallans.length === 0) {
          this.messageService.error('Please select at least one Delivery Challan.');
          return;
        }
      } else {
        formValues.deliveryChallans = [];
      }

      this.filterStateService.updateState(formValues);
      this.apply.emit();
    }
  }

  // Backdrop click handler
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.onCancel();
    }
  }
}
