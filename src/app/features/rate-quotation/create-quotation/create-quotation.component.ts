import { Component, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  selector: 'app-create-quotation',
  templateUrl: './create-quotation.component.html',
  styleUrls: ['./create-quotation.component.scss'],
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
export class CreateQuotationComponent {
  quotationForm: FormGroup;
  imagePreview: string | ArrayBuffer | null = null;
  isLoadingCompanies = true;

  companyOptions: CompanyDropdownModel[] = [];

  constructor(
    private fb: FormBuilder,
    private rateQuotationService: RateQuotationService,
    private messageService: MessageService,
    private router: Router,
    private appConfig: AppConfigService,
    private companyService: CompanyService,
    private destroyRef: DestroyRef
  ) {
    this.quotationForm = this.fb.group({
      companyId: [null, [Validators.required, Validators.min(1)]],
      styleNo: ['', Validators.required],
      embDesign: ['', Validators.required],
      noOfStitches: ['', Validators.required],
      chenilleColors: ['', Validators.required],
      normalEmbColors: ['', Validators.required],
      ratePerPiece: ['', [Validators.required, Validators.min(0)]],
      embCost: ['', [Validators.required, Validators.min(0)]],
      paymentTerms: ['', Validators.required]
    });

    this.quotationForm.get('companyId')?.disable();
  }

  ngOnInit() {
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
        this.quotationForm.get('companyId')?.enable();
        console.log('API Success: Fetched companies');
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

  selectedFile: File | null = null;

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
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
    this.selectedFile = null;
    this.imagePreview = null;
  }

  saveDraft() {
    console.log('Draft saved', this.quotationForm.value);
  }

  generatePdf() {
    console.log('Generating PDF...');
  }

  submitQuotation() {
    if (this.quotationForm.valid) {
      if (!this.selectedFile) {
        this.messageService.error('Please select an image before submitting.');
        return;
      }

      const formValue = this.quotationForm.value;
      const defaults = this.appConfig.defaultQuotationSettings;

      const selectedCompany = this.companyOptions.find(c => c.key === formValue.companyId);
      const companyName = selectedCompany ? selectedCompany.value : "Acme Corp";

      const payload = {
        "quotationDate": new Date().toISOString(),
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
        "chenilleColors": formValue.chenilleColors ? Number(formValue.chenilleColors) : null,
        "normalEmbColors": formValue.normalEmbColors ? Number(formValue.normalEmbColors) : null,
        "ratePerPiece": formValue.ratePerPiece ? Number(formValue.ratePerPiece) : null,
        "ratePerMeter": formValue.embCost ? Number(formValue.embCost) : null,
        "quantity": defaults.quantity ? Number(defaults.quantity) : null,
        "totalAmount": (formValue.embCost ? Number(formValue.embCost) : 0) * (defaults.quantity ? Number(defaults.quantity) : 0) || null,
        "remarks": formValue.paymentTerms || "",
        "status": defaults.status || "",
        "createdBy": defaults.createdBy || null
      };

      console.log('Payload Before Save:', payload);

      this.rateQuotationService.createRateQuotation(payload).subscribe({
        next: (response) => {
          if (response.success) {
            const newId = response.data;
            if (this.selectedFile && newId) {
              this.rateQuotationService.uploadImage(newId, this.selectedFile).subscribe({
                next: () => {
                  this.messageService.success('Rate Quotation created and image saved successfully.');
                  this.router.navigate(['/dashboard/rate-quotation/dashboard']);
                },
                error: (err) => {
                  console.error('Image upload error:', err);
                  this.rateQuotationService.deleteRateQuotation(newId).subscribe();
                  this.messageService.error('Failed to save image. Rate Quotation was not saved.');
                  // Remain on the same page
                }
              });
            } else {
              this.messageService.success(response.message || 'Rate Quotation created successfully.');
              this.router.navigate(['/dashboard/rate-quotation/dashboard']);
            }
          } else {
            this.messageService.error(response.message || 'Failed to create rate quotation.');
          }
        },
        error: (error) => {
          this.messageService.error('An error occurred while creating the quotation.');
          console.error(error);
        }
      });
    } else {
      this.quotationForm.markAllAsTouched();
    }
  }
}

