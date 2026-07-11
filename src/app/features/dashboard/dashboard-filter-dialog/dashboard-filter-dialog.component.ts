import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, map } from 'rxjs';
import { CompanyService, CompanySummary } from '../../../core/services/company.service';
import { InwardService } from '../../../core/services/inward.service';
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
    close: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`
  };

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private inwardService: InwardService,
    private filterStateService: DashboardFilterStateService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService
  ) {
    this.companies$ = this.companyService.getCompanies() as unknown as Observable<SelectOption[]>;
  }

  ngOnInit(): void {
    // Lock scroll
    document.body.style.overflow = 'hidden';
    
    // Get current state
    this.originalState = { ...this.filterStateService.currentState };
    this.initForm(this.originalState);
    
    if (this.originalState.companyId) {
      this.fetchStyleAndDesign(Number(this.originalState.companyId));
    }
  }

  ngOnDestroy(): void {
    // Unlock scroll
    document.body.style.overflow = '';
    this.destroy$.unsubscribe();
  }

  private initForm(state: DashboardFilterState): void {
    this.filterForm = this.fb.group({
      fromDate: [state.fromDate],
      toDate: [state.toDate],
      companyId: [state.companyId],
      styleNo: [{ value: state.styleNo, disabled: !state.companyId }],
      designName: [{ value: state.designName, disabled: !state.companyId }],
      colour: [{ value: state.colour, disabled: !state.companyId }],
      mode: [state.mode || 'S']
    });
  }

  onCompanyChange(companyId: any): void {
    if (companyId) {
      this.filterForm.get('styleNo')?.enable();
      this.filterForm.get('designName')?.enable();
      this.filterForm.get('colour')?.enable();
      
      this.filterForm.patchValue({ styleNo: null, designName: null, colour: null });
      this.fetchStyleAndDesign(companyId);
    } else {
      this.filterForm.get('styleNo')?.disable();
      this.filterForm.get('designName')?.disable();
      this.filterForm.get('colour')?.disable();
      
      this.filterForm.patchValue({ styleNo: null, designName: null, colour: null });
      this.styleOptions = [];
      this.designOptions = [];
      this.colourOptions = [];
    }
    this.cdr.markForCheck();
  }

  private fetchStyleAndDesign(companyId: number): void {
    this.inwardService.getDesignStyleColour(companyId).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          const getUniqueOptions = (items: any[], selector: (item: any) => any) => {
            const map = new Map<string, string>();
            items.forEach(item => {
              const val = selector(item);
              if (val) {
                const str = val.toString().trim();
                if (str) {
                  const lower = str.toLowerCase();
                  if (!map.has(lower)) {
                    map.set(lower, str);
                  }
                }
              }
            });
            return Array.from(map.values()).map(val => ({ key: val, value: val }));
          };

          this.styleOptions = getUniqueOptions(data, item => item.styleNo);
          this.designOptions = getUniqueOptions(data, item => item.designName);
          this.colourOptions = getUniqueOptions(data, item => item.colourName || item.colour);
        } else {
          this.styleOptions = [];
          this.designOptions = [];
          this.colourOptions = [];
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.styleOptions = [];
        this.designOptions = [];
        this.colourOptions = [];
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
      mode: state.mode
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
