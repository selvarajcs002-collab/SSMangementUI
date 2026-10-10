import { Component, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
  customFieldLabel = 'Additional Detail';

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
      companyId: [null],
      styleNo: [''],
      embDesign: [''],
      noOfStitches: [''],
      numberOfTrimmings: [''],
      customField: [''],
      chenilleColors: [''],
      normalEmbColors: [''],
      ratePerPiece: [''],
      embCost: [''],
      paymentTerms: ['']
    });

    this.quotationForm.get('companyId')?.disable();
  }

  ngOnInit() {
    this.loadFieldLabel();
    this.loadCompanies();
  }

  loadFieldLabel() {
    this.rateQuotationService.getSettings().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        const label = response?.data?.customFieldLabel?.trim();
        if (label) {
          this.customFieldLabel = label;
        }
      }
    });
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

  private asText(value: unknown): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    return String(value);
  }

  private asNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }

  submitQuotation() {
    const formValue = this.quotationForm.getRawValue();
    const defaults = this.appConfig.defaultQuotationSettings;

    const selectedCompany = this.companyOptions.find(c => c.key === formValue.companyId);
    const companyName = selectedCompany ? selectedCompany.value : '';
    const embCost = this.asNumber(formValue.embCost);
    const quantity = this.asNumber(defaults.quantity);

    const payload = {
      "quotationDate": new Date().toISOString(),
      "companyId": formValue.companyId ?? null,
      "companyName": companyName,
      "contactPerson": defaults.contactPerson,
      "mobileNo": defaults.mobileNo,
      "emailId": defaults.emailId,
      "address": defaults.address,
      "styleNo": formValue.styleNo ?? '',
      "designName": formValue.embDesign ?? '',
      "productType": defaults.productType || "",
      "noOfStitches": this.asText(formValue.noOfStitches),
      "numberOfTrimmings": this.asText(formValue.numberOfTrimmings),
      "customField": this.asText(formValue.customField),
      "chenilleColors": this.asNumber(formValue.chenilleColors),
      "normalEmbColors": this.asNumber(formValue.normalEmbColors),
      "ratePerPiece": this.asText(formValue.ratePerPiece),
      "ratePerMeter": this.asText(formValue.embCost),
      "quantity": quantity,
      "totalAmount": embCost === null ? null : embCost * (quantity ?? 0),
      "remarks": formValue.paymentTerms ?? '',
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
  }
}

