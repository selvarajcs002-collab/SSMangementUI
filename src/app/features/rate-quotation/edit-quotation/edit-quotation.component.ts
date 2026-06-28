// edit-quotation component
import { Component, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CustomSelectComponent } from '../../../shared/components/custom-select/custom-select.component';
import { RateQuotationService } from '../../../core/services/rate-quotation.service';
import { MessageService } from '../../../core/services/message.service';
import { AppConfigService } from '../../../core/services/app-config.service';
import { CompanyService } from '../../../core/services/company.service';
import { CompanyDropdownModel } from '../../../core/models/company.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-edit-quotation',
  templateUrl: './edit-quotation.component.html',
  styleUrls: ['./edit-quotation.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatButtonModule,
    CustomSelectComponent
  ]
})
export class EditQuotationComponent {
  quotationForm: FormGroup;
  imagePreview: string | ArrayBuffer | null = null;
  isLoadingCompanies = true;
  isLoadingQuotation = true;
  isSaving = false;
  quotationId: number | null = null;

  companyOptions: CompanyDropdownModel[] = [];

  constructor(
    private fb: FormBuilder,
    private rateQuotationService: RateQuotationService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute,
    private appConfig: AppConfigService,
    private companyService: CompanyService,
    private destroyRef: DestroyRef
  ) {
    this.quotationForm = this.fb.group({
      companyId: [null, [Validators.required, Validators.min(1)]],
      styleNo: ['', Validators.required],
      embDesign: ['', Validators.required],
      noOfStitches: ['', [Validators.required, Validators.min(0)]],
      chenilleColors: ['', Validators.required],
      normalEmbColors: ['', Validators.required],
      embCost: ['', [Validators.required, Validators.min(0)]],
      paymentTerms: ['', Validators.required]
    });
    
    this.quotationForm.disable(); // Initially disable everything while loading
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam || isNaN(Number(idParam)) || Number(idParam) === 0) {
      this.messageService.error('Invalid Rate Quotation Id');
      this.router.navigate(['/dashboard/rate-quotation/dashboard']);
      return;
    }
    this.quotationId = Number(idParam);
    this.loadCompanies();
  }

  loadCompanies() {
    console.log('API Request: Fetching company list');
    this.isLoadingCompanies = true;
    this.quotationForm.get('companyId')?.disable();

    this.companyService.getCompanies().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: any) => {
        this.isLoadingCompanies = false;
        
        if (response === null) {
          this.messageService.error('No companies found.');
          return;
        }

        const data = Array.isArray(response) ? response : response.data || [];
        
        if (!Array.isArray(data) || (data.length > 0 && !('key' in data[0] && 'value' in data[0]))) {
          console.error('Invalid response format', response);
          this.messageService.error('An unexpected error occurred while loading companies.');
          return;
        }

        if (data.length === 0) {
          this.messageService.error('No companies available.');
          return;
        }

        this.companyOptions = data as CompanyDropdownModel[];
        console.log('API Success: Fetched companies');
        this.loadQuotation(); // Load quotation data AFTER companies so dropdown works
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingCompanies = false;
        console.error('API Failure:', error);
        
        if (error.status === 0) {
          this.messageService.error('Network error occurred.');
        } else if (error.status === 401) {
          this.router.navigate(['/login']);
        } else if (error.status === 403) {
          this.messageService.error('You do not have permission.');
        } else if (error.status === 408 || (error as any).name === 'TimeoutError') {
          this.messageService.error('Request timed out.');
        } else if (error.status === 500) {
          this.messageService.error('Unable to load company list. Please try again.');
        } else {
          this.messageService.error('Unable to load company list. Please try again.');
        }
      }
    });
  }

  loadQuotation() {
    if (!this.quotationId) return;

    console.log(`API Request: Fetching rate quotation by id: ${this.quotationId}`);
    this.rateQuotationService.getRateQuotationById(this.quotationId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: any) => {
        this.isLoadingQuotation = false;

        if (response === null || !response.data) {
          this.messageService.error('No data found');
          return;
        }

        const data = response.data;
        console.log('API Success: Fetched quotation details', data);

        // Verify company exists
        if (!this.companyOptions.some(c => c.key === data.companyId)) {
          this.messageService.error('Selected company no longer available');
        }

        this.quotationForm.patchValue({
          companyId: data.companyId,
          styleNo: data.styleNo,
          embDesign: data.designName,
          productType: data.productType,
          quantity: data.quantity,
          embCost: data.ratePerMeter,
          paymentTerms: data.remarks,
          // These fields exist in the form but are NOT returned by the backend API model.
          // We provide fallback values so the required validation doesn't block the form.
          noOfStitches: data.noOfStitches || '0',
          chenilleColors: data.chenilleColors || '0',
          normalEmbColors: data.normalEmbColors || '0'
        });

        this.quotationForm.enable();
        console.log('Form Patch Success');
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingQuotation = false;
        console.error('GetById API Failure:', error);
        
        if (error.status === 0) {
          this.messageService.error('Network connection error');
        } else if (error.status === 401) {
          this.router.navigate(['/login']);
        } else if (error.status === 403) {
          this.messageService.error('You do not have permission');
        } else if (error.status === 404) {
          this.messageService.error('Rate Quotation Not Found');
          this.router.navigate(['/dashboard/rate-quotation/dashboard']);
        } else if (error.status === 408 || (error as any).name === 'TimeoutError') {
          this.messageService.error('Request timed out');
        } else {
          this.messageService.error('Unable to load quotation details');
        }
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          this.imagePreview = e.target.result;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.imagePreview = null;
  }

  saveDraft() {
    console.log('Draft saved', this.quotationForm.value);
  }

  generatePdf() {
    console.log('Generating PDF...');
  }

  submitQuotation() {
    if (this.quotationForm.valid && this.quotationId) {
      this.isSaving = true;
      const formValue = this.quotationForm.value;
      const defaults = this.appConfig.defaultQuotationSettings;
      
      const selectedCompany = this.companyOptions.find(c => c.key === formValue.companyId);
      const companyName = selectedCompany ? selectedCompany.value : "Acme Corp";

      const payload = {
        "quotationDate": new Date().toISOString().split('T')[0],
        "companyId": formValue.companyId,
        "companyName": companyName,
        "contactPerson": defaults.contactPerson,
        "mobileNo": defaults.mobileNo,
        "emailId": defaults.emailId,
        "address": defaults.address,
        "styleNo": formValue.styleNo || "",
        "designName": formValue.embDesign || "",
        "productType": defaults.productType || "",
        "noOfStitches": formValue.noOfStitches || null,
        "chenilleColors": formValue.chenilleColors || null,
        "normalEmbColors": formValue.normalEmbColors || null,
        "ratePerPiece": null,
        "ratePerMeter": formValue.embCost || null,
        "quantity": formValue.quantity || defaults.quantity || null,
        "totalAmount": (formValue.embCost || 0) * (formValue.quantity || defaults.quantity || 0) || null,
        "remarks": formValue.paymentTerms || "",
        "status": defaults.status || "",
        "modifiedBy": defaults.createdBy || null
      };

      console.log('Update Payload:', payload);

      this.rateQuotationService.updateRateQuotation(this.quotationId, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (response: any) => {
          this.isSaving = false;
          if (response && response.success) {
            console.log('Update Success');
            this.messageService.success('Rate Quotation Updated Successfully');
            this.router.navigate(['/dashboard/rate-quotation/dashboard']);
          } else {
            console.log('Update Failure', response);
            this.messageService.error(response?.message || 'Failed to update rate quotation.');
          }
        },
        error: (error: HttpErrorResponse) => {
          this.isSaving = false;
          console.error('Update Failure:', error);
          if (error.status === 409) {
            this.messageService.error('Quotation already exists');
          } else if (error.status === 404) {
            this.messageService.error('Record was modified by another user. Please reload.');
          } else {
            this.messageService.error('An error occurred while updating the quotation.');
          }
        }
      });
    } else {
      console.log('Validation Errors');
      this.quotationForm.markAllAsTouched();
    }
  }
}

