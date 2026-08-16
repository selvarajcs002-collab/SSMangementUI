import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UpdateModalService } from '../../../core/services/update-modal.service';
import { CompanyService, CompanySummary } from '../../../core/services/company.service';
import { InwardService } from '../../../core/services/inward.service';
import { CustomSelectComponent, SelectOption } from '../custom-select/custom-select.component';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { MessageService } from '../../../core/services/message.service';
import { Observable, finalize } from 'rxjs';

@Component({
  selector: 'app-update-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CustomSelectComponent, SafeHtmlPipe],
  templateUrl: './update-modal.component.html',
  styleUrl: './update-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdateModalComponent implements OnInit {
  updateForm!: FormGroup;
  companies$: Observable<CompanySummary[]>;
  allData: any[] = [];
  
  styleOptions: SelectOption[] = [];
  designOptions: SelectOption[] = [];
  colourOptions: SelectOption[] = [];

  isLoadingData = false;
  isCompaniesLoading = false;

  icons = {
    company: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    x: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
  };

  @HostListener('window:keydown.escape')
  onEscape() {
    this.close();
  }

  constructor(
    public modalService: UpdateModalService,
    private fb: FormBuilder,
    private router: Router,
    private companyService: CompanyService,
    private inwardService: InwardService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    this.companies$ = this.companyService.getCompanies();
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.updateForm = this.fb.group({
      companyId: [null, Validators.required],
      styleNo: [{ value: null, disabled: true }, Validators.required],
      designName: [{ value: null, disabled: true }, Validators.required],
      colour: [{ value: null, disabled: true }, Validators.required]
    });
  }

  onCompanyChange(companyId: any): void {
    this.resetSelections();
    
    if (!companyId) return;

    this.isLoadingData = true;
    this.cdr.markForCheck();

    this.inwardService.getDesignStyleColour(companyId)
      .pipe(finalize(() => {
        this.isLoadingData = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (data) => {
          this.allData = data;
          this.updateDropdowns();
          this.enableFields();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error fetching modal data:', err);
          this.messageService.error('Failed to load style/design/colour options.');
        }
      });
  }

  onFieldChange(): void {
    this.updateDropdowns();
  }

  private updateDropdowns(): void {
    const { styleNo, designName, colour } = this.updateForm.getRawValue();

    // Population logic: unique values from the whole list based on company
    this.styleOptions = this.getUniqueOptions(this.allData, 'styleNo');
    this.designOptions = this.getUniqueOptions(this.allData, 'designName');
    this.colourOptions = this.getUniqueOptions(this.allData, 'colour');

    this.cdr.markForCheck();
  }

  private getUniqueOptions(data: any[], key: string): SelectOption[] {
    const unique = [...new Set(data.map(item => item[key]))];
    return unique
      .filter(val => val !== null && val !== undefined && val !== '')
      .map(val => ({ key: val, value: String(val) }));
  }

  private enableFields(): void {
    this.updateForm.get('styleNo')?.enable();
    this.updateForm.get('designName')?.enable();
    this.updateForm.get('colour')?.enable();
  }

  private resetSelections(): void {
    this.updateForm.patchValue({
      styleNo: null,
      designName: null,
      colour: null
    }, { emitEvent: false });
    
    this.updateForm.get('styleNo')?.disable();
    this.updateForm.get('designName')?.disable();
    this.updateForm.get('colour')?.disable();
    
    this.styleOptions = [];
    this.designOptions = [];
    this.colourOptions = [];
    this.allData = [];
    this.cdr.markForCheck();
  }

  close(): void {
    this.modalService.close();
    this.updateForm.reset();
    this.resetSelections();
  }

  onContinue(): void {
    if (this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      this.messageService.error('Please select all required fields to continue.');
      return;
    }

    const selection = this.updateForm.getRawValue();
    
    // Store in signal for reliable cross-component reactivity
    this.modalService.setPreFillData(selection);
    
    this.close();
    
    // Navigate to inward page
    this.router.navigate(['/dashboard/inward']);
  }
}
