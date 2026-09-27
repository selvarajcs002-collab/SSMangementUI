import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdvanceAmountService, AdvanceAmount } from '../../../core/services/advance-amount.service';
import { AdvanceAmountExcelService } from '../../../excel/advance-amount-excel.service';
import { DatePickerComponent } from '../../../shared/components/date-picker/date-picker.component';

@Component({
  selector: 'app-advance-amount',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePickerComponent],
  providers: [DatePipe],
  templateUrl: './advance-amount.component.html',
  styleUrl: './advance-amount.component.scss'
})
export class AdvanceAmountComponent implements OnInit {

  advances: AdvanceAmount[] = [];
  filteredAdvances: AdvanceAmount[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;
  pagedAdvances: AdvanceAmount[] = [];

  // Filters
  searchQuery: string = '';
  filterDate: string = '';

  // UI States
  isLoading: boolean = false;
  isModalOpen: boolean = false;
  isDeleteModalOpen: boolean = false;
  isViewMode: boolean = false;
  isExportModalOpen: boolean = false;
  
  modalTitle: string = 'Add Advance Amount';
  
  advanceForm: FormGroup;
  exportForm: FormGroup;
  selectedId: number | null | undefined = null;
  isGenerating: boolean = false;
  isSubmitting: boolean = false;
  isGeneratingChallan: boolean = false;
  generatingChallanId: number | null = null;
  
  @ViewChild('advanceDatePicker') advanceDatePicker!: DatePickerComponent;
  
  notification: { message: string, type: 'success' | 'error' } | null = null;

  constructor(
    private advanceService: AdvanceAmountService,
    private excelService: AdvanceAmountExcelService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private datePipe: DatePipe
  ) {
    this.advanceForm = this.fb.group({
      name: ['', Validators.required],
      date: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      remarks: ['']
    });

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.exportForm = this.fb.group({
      exportFromDate: [this.datePipe.transform(firstDay, 'yyyy-MM-dd'), Validators.required],
      exportToDate: [this.datePipe.transform(today, 'yyyy-MM-dd'), Validators.required]
    });
  }

  get ef() { return this.exportForm.controls; }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.advanceService.getAdvances().subscribe({
      next: (data) => {
        this.advances = data;
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.showNotification('Unable to load advance amount records.', 'error');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    let result = this.advances;

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(a => a.name.toLowerCase().includes(q));
    }

    if (this.filterDate) {
        result = result.filter(a => a.date === this.filterDate);
    }

    this.filteredAdvances = result;
    this.totalPages = Math.ceil(this.filteredAdvances.length / this.pageSize) || 1;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.pagedAdvances = this.filteredAdvances.slice(startIndex, startIndex + this.pageSize);
  }

  get totalAdvancePaid(): number {
    return this.filteredAdvances.reduce((sum, advance) => sum + Number(advance.amount || 0), 0);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getPages(): number[] {
    return Array.from({length: this.totalPages}, (_, i) => i + 1);
  }

  // --- Actions ---

  openAddModal(): void {
    this.isViewMode = false;
    this.modalTitle = 'Add Advance Amount';
    this.selectedId = null;
    this.advanceForm.reset();
    this.advanceForm.enable();
    this.isModalOpen = true;
    document.body.classList.add('modal-open');
  }

  openEditModal(advance: AdvanceAmount): void {
    this.isViewMode = false;
    this.modalTitle = 'Edit Advance Amount';
    this.selectedId = advance.id ?? null;
    this.advanceForm.patchValue({
      name: advance.name,
      date: advance.date,
      amount: advance.amount,
      remarks: advance.remarks
    });
    this.advanceForm.enable();
    this.isModalOpen = true;
    document.body.classList.add('modal-open');
  }

  openViewModal(advance: AdvanceAmount): void {
    this.isViewMode = true;
    this.modalTitle = 'View Advance Amount';
    this.selectedId = advance.id ?? null;
    this.advanceForm.patchValue({
      name: advance.name,
      date: advance.date,
      amount: advance.amount,
      remarks: advance.remarks
    });
    this.advanceForm.disable();
    this.isModalOpen = true;
    document.body.classList.add('modal-open');
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.advanceForm.reset();
    document.body.classList.remove('modal-open');
  }

  openExportModal(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.exportForm.patchValue({
      exportFromDate: this.datePipe.transform(firstDay, 'yyyy-MM-dd'),
      exportToDate: this.datePipe.transform(today, 'yyyy-MM-dd')
    });
    
    this.isExportModalOpen = true;
    document.body.classList.add('modal-open');
  }

  closeExportModal(): void {
    this.isExportModalOpen = false;
    this.exportForm.reset();
    document.body.classList.remove('modal-open');
  }

  clearForm(): void {
    this.advanceForm.reset();
  }

  get todayStr(): string {
    return this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '';
  }

  get yesterdayStr(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return this.datePipe.transform(d, 'yyyy-MM-dd') || '';
  }

  get selectedQuickDate(): string | null {
    const val = this.advanceForm.get('date')?.value;
    if (!val) return null;
    if (val === this.todayStr) return 'today';
    if (val === this.yesterdayStr) return 'yesterday';
    return null;
  }

  setQuickDate(type: 'today' | 'yesterday' | 'select'): void {
    if (type === 'today') {
      this.advanceForm.patchValue({ date: this.todayStr });
    } else if (type === 'yesterday') {
      this.advanceForm.patchValue({ date: this.yesterdayStr });
    } else if (type === 'select') {
      if (this.advanceDatePicker) {
        this.advanceDatePicker.isOpen = true;
        this.advanceDatePicker.generateCalendar();
      }
    }
  }

  get selectedQuickAmount(): number | null {
    const val = this.advanceForm.get('amount')?.value;
    if (val === 500) return 500;
    if (val === 1000) return 1000;
    if (val === 1500) return 1500;
    if (val === 2000) return 2000;
    return null;
  }

  setQuickAmount(amount: number): void {
    this.advanceForm.patchValue({ amount });
  }

  submitForm(): void {
    if (this.advanceForm.invalid || this.isSubmitting) {
      this.advanceForm.markAllAsTouched();
      return;
    }

    const formValue = this.advanceForm.value;
    const reqData = {
      name: formValue.name,
      date: formValue.date,
      amount: Number(formValue.amount),
      remarks: formValue.remarks || ''
    };

    this.isSubmitting = true;

    if (this.selectedId) {
      const payload = { id: this.selectedId, ...reqData };
      this.advanceService.updateAdvance(payload).subscribe({
        next: async () => {
          this.isSubmitting = false;
          this.showNotification('Advance amount updated successfully.', 'success');
          this.closeModal();
          this.loadData();
        },
        error: () => {
          this.isSubmitting = false;
          this.showNotification('Failed to update advance amount.', 'error');
        }
      });
    } else {
      this.advanceService.addAdvance(reqData).subscribe({
        next: async (saved) => {
          this.isSubmitting = false;
          this.showNotification('Advance amount added successfully.', 'success');
          this.closeModal();
          this.loadData();
        },
        error: () => {
          this.isSubmitting = false;
          this.showNotification('Failed to add advance amount.', 'error');
        }
      });
    }
  }



  // --- Delete ---

  openDeleteModal(id: number | undefined): void {
    if (id === undefined) return;
    this.selectedId = id;
    this.isDeleteModalOpen = true;
    document.body.classList.add('modal-open');
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.selectedId = null;
    document.body.classList.remove('modal-open');
  }

  confirmDelete(): void {
    if (this.selectedId) {
      this.advanceService.deleteAdvance(this.selectedId).subscribe(() => {
        this.showNotification('Advance amount deleted successfully.', 'success');
        this.closeDeleteModal();
        this.loadData();
      });
    }
  }

  downloadChallan(advance: AdvanceAmount): void {
    if (!advance.id || this.isGeneratingChallan) return;
    this.requestChallan({
      advanceId: advance.id,
      name: advance.name,
      date: this.toApiDate(advance.date),
      amount: Number(advance.amount),
      remarks: advance.remarks || ''
    }, false);
  }

  generateChallan(): void {
    if (this.isGeneratingChallan) return;

    if (!this.selectedId) {
      this.showNotification('Save the advance before generating the challan.', 'error');
      return;
    }

    if (!this.isViewMode && this.advanceForm.invalid) {
      this.advanceForm.markAllAsTouched();
      return;
    }

    const formValue = this.advanceForm.getRawValue();
    this.requestChallan({
      advanceId: this.selectedId,
      name: formValue.name,
      date: this.toApiDate(formValue.date),
      amount: Number(formValue.amount),
      remarks: formValue.remarks || ''
    }, true);
  }

  private requestChallan(payload: {
    advanceId: number;
    name: string;
    date: string;
    amount: number;
    remarks: string;
  }, closeAfterDownload: boolean): void {
    this.isGeneratingChallan = true;
    this.generatingChallanId = payload.advanceId;

    this.advanceService.generateChallan(payload).subscribe({
      next: (response) => {
        const fileName = this.readPdfFileName(response.headers.get('content-disposition'));
        const blob = new Blob([response.body ?? new Blob()], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(url);

        this.isGeneratingChallan = false;
        this.generatingChallanId = null;
        if (closeAfterDownload) {
          this.closeModal();
        }
        this.showNotification('Advance challan generated successfully.', 'success');
        this.cdr.detectChanges();
      },
      error: async (err) => {
        this.isGeneratingChallan = false;
        this.generatingChallanId = null;
        const message = await this.readChallanError(err);
        this.showNotification(message, 'error');
        this.cdr.detectChanges();
      }
    });
  }

  private toApiDate(value: string | null | undefined): string {
    if (!value) return '';
    return value.length >= 10 ? value.substring(0, 10) : value;
  }

  private readPdfFileName(contentDisposition: string | null): string {
    if (!contentDisposition) return 'Advance_Challan.pdf';
    const encoded = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
    if (encoded?.[1]) return decodeURIComponent(encoded[1].replace(/"/g, ''));
    const plain = /filename="?([^";]+)"?/i.exec(contentDisposition);
    return plain?.[1] || 'Advance_Challan.pdf';
  }

  private async readChallanError(error: any): Promise<string> {
    const fallback = 'Unable to generate advance challan.';
    const body = error?.error;
    if (body instanceof Blob) {
      try {
        const text = await body.text();
        const parsed = JSON.parse(text);
        return parsed?.message || fallback;
      } catch {
        return fallback;
      }
    }
    return error?.error?.message || fallback;
  }

  generateExcelReport(): void {
    if (this.exportForm.invalid) {
      this.exportForm.markAllAsTouched();
      return;
    }

    const fromDateStr = this.exportForm.value.exportFromDate;
    const toDateStr = this.exportForm.value.exportToDate;

    const from = new Date(fromDateStr);
    const to = new Date(toDateStr);

    if (from > to) {
      this.showNotification('From Date cannot be greater than To Date.', 'error');
      return;
    }

    this.isGenerating = true;
    this.advanceService.exportAdvanceReport(fromDateStr, toDateStr).subscribe({
      next: (blob) => {
        this.isGenerating = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Format names similar to backend
        const formattedFrom = fromDateStr.replace(/-/g, '');
        const formattedTo = toDateStr.replace(/-/g, '');
        a.download = `Advance_Amount_Report_${formattedFrom}_to_${formattedTo}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showNotification('Advance Amount report generated successfully.', 'success');
        this.closeExportModal();
      },
      error: (err) => {
        this.isGenerating = false;
        console.error('Export Error:', err);
        this.showNotification('Failed to generate report. Please try again.', 'error');
      }
    });
  }

  exportToFile(): void {
    // Re-route export to open the export modal
    this.openExportModal();
  }

  // --- Utilities ---

  showNotification(message: string, type: 'success' | 'error'): void {
    this.notification = { message, type };
    setTimeout(() => {
      this.notification = null;
      this.cdr.detectChanges();
    }, 3000);
  }

  get f() { return this.advanceForm.controls; }
}
