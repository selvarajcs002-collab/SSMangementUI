import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { CompanyService, CompanySummary } from '../../../core/services/company.service';
import { InwardService } from '../../../core/services/inward.service';
import { MessageService } from '../../../core/services/message.service';
import { SelectOption, CustomSelectComponent } from '../../../shared/components/custom-select/custom-select.component';
import { AppDatePickerComponent } from '../../../shared/components/app-date-picker/app-date-picker.component';

import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-dc-filter-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CustomSelectComponent, SafeHtmlPipe, AppDatePickerComponent],
  templateUrl: './dc-filter-component.component.html',
  styleUrl: './dc-filter-component.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DcFilterComponent implements OnInit {
  @Output() search = new EventEmitter<any>();

  filterForm!: FormGroup;
  companies$: Observable<CompanySummary[]>;
  styleOptions: SelectOption[] = [];
  designOptions: SelectOption[] = [];

  icons = {
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>`,
    company: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`,
    style: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42Z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>`,
    design: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.688-1.688h1.938c3.102 0 5.625-2.433 5.625-5.469C22 5.658 17.558 2 12 2Z"/></svg>`,
    reset: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`,
    search: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`
  };

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private inwardService: InwardService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService
  ) {
    this.companies$ = this.companyService.getCompanies();
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    this.filterForm = this.fb.group({
      fromDate: [this.formatDate(firstDayOfMonth)],
      toDate: [this.formatDate(today)],
      companyId: [null],
      styleNo: [{ value: null, disabled: true }],
      designName: [{ value: null, disabled: true }]
    });
  }

  onCompanyChange(companyId: any): void {
    if (companyId) {
      this.filterForm.get('styleNo')?.enable();
      this.filterForm.get('designName')?.enable();
      this.fetchStyleAndDesign(companyId);
    } else {
      this.filterForm.get('styleNo')?.disable();
      this.filterForm.get('designName')?.disable();
      this.filterForm.patchValue({ styleNo: null, designName: null });
      this.styleOptions = [];
      this.designOptions = [];
    }
    this.cdr.markForCheck();
  }

  private fetchStyleAndDesign(companyId: number): void {
    this.inwardService.getDesignStyleColour(companyId).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          // Extract unique styles and designs
          const styles = Array.from(new Set(data.map(item => item.styleNo)))
            .map(style => ({ key: style, value: style }));
          const designs = Array.from(new Set(data.map(item => item.designName)))
            .map(design => ({ key: design, value: design }));

          this.styleOptions = styles;
          this.designOptions = designs;
        } else {
          this.styleOptions = [];
          this.designOptions = [];
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.styleOptions = [];
        this.designOptions = [];
        this.cdr.markForCheck();
      }
    });
  }

  onReset(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    this.filterForm.reset({
      fromDate: null,
      toDate: null,
      companyId: null,
      styleNo: null,
      designName: null
    });

    this.filterForm.get('styleNo')?.disable();
    this.filterForm.get('designName')?.disable();
    this.styleOptions = [];
    this.designOptions = [];
    this.cdr.markForCheck();
  }

  onSearch(): void {
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

      this.search.emit(formValues);
    }
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }
}
