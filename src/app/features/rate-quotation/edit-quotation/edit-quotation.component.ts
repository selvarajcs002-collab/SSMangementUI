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
  isGeneratingPdf = false;
  quotationId: number | null = null;
  quotationNo: string = '';

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
      noOfStitches: ['', Validators.required],
      chenilleColors: ['', Validators.required],
      normalEmbColors: ['', Validators.required],
      ratePerPiece: ['', [Validators.required, Validators.min(0)]],
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
        this.quotationNo = data.quotationNo || '';
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
          noOfStitches: data.noOfStitches || '',
          chenilleColors: data.chenilleColors || '0',
          normalEmbColors: data.normalEmbColors || '0',
          ratePerPiece: data.ratePerPiece || ''
        });

        this.quotationForm.enable();
        if (this.quotationId) {
          this.imagePreview = this.rateQuotationService.getImageUrl(this.quotationId) + '?t=' + new Date().getTime();
        }
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

  selectedFile: File | null = null;
  imageRemoved: boolean = false;

  onImageError() {
    this.imagePreview = null;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.imageRemoved = false;
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
    this.imageRemoved = true;
  }

  saveDraft() {
    console.log('Draft saved', this.quotationForm.value);
  }

  generatePdf() {
    if (!this.quotationId) {
      this.messageService.error('Please save the quotation first before generating PDF.');
      return;
    }

    if (this.quotationForm.dirty && !this.isSaving) {
      this.messageService.error('You have unsaved changes. Please update the quotation before generating PDF.');
    }

    this.isGeneratingPdf = true;
    console.log(`Generating PDF for Quotation ID: ${this.quotationId}...`);

    this.rateQuotationService.generatePdf(this.quotationId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');

        const quoteNo = this.quotationNo || this.quotationForm.get('styleNo')?.value || 'Quotation';
        anchor.href = url;
        anchor.download = `RateQuotation_${quoteNo}.pdf`;
        anchor.click();

        window.URL.revokeObjectURL(url);
        this.isGeneratingPdf = false;
        this.messageService.success('PDF Generated Successfully');
      },
      error: (error: HttpErrorResponse) => {
        this.isGeneratingPdf = false;
        console.error('PDF Generation Failure:', error);
        this.messageService.error('Failed to generate PDF. Please try again.');
      }
    });
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
        "chenilleColors": formValue.chenilleColors ? Number(formValue.chenilleColors) : null,
        "normalEmbColors": formValue.normalEmbColors ? Number(formValue.normalEmbColors) : null,
        "ratePerPiece": formValue.ratePerPiece ? Number(formValue.ratePerPiece) : null,
        "ratePerMeter": formValue.embCost ? Number(formValue.embCost) : null,
        "quantity": (formValue.quantity ? Number(formValue.quantity) : (defaults.quantity ? Number(defaults.quantity) : null)),
        "totalAmount": (formValue.embCost ? Number(formValue.embCost) : 0) * ((formValue.quantity ? Number(formValue.quantity) : (defaults.quantity ? Number(defaults.quantity) : 0))) || null,
        "remarks": formValue.paymentTerms || "",
        "status": defaults.status || "",
        "modifiedBy": defaults.createdBy || null
      };

      console.log('Update Payload:', payload);

      this.rateQuotationService.updateRateQuotation(this.quotationId, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (response: any) => {
          if (response && response.success) {
            console.log('Update Success');

            if (this.selectedFile) {
              // Upload new image (overrides older image on server)
              this.rateQuotationService.uploadImage(this.quotationId!, this.selectedFile).subscribe({
                next: () => {
                  this.isSaving = false;
                  this.messageService.success('Rate Quotation updated and new image saved successfully.');
                  this.router.navigate(['/dashboard/rate-quotation/dashboard']);
                },
                error: (err) => {
                  this.isSaving = false;
                  console.error('Image upload error:', err);
                  this.messageService.error('Failed to upload image. Please try again.');
                }
              });
            } else if (this.imageRemoved) {
              // Delete image on server
              this.rateQuotationService.deleteImage(this.quotationId!).subscribe({
                next: () => {
                  this.isSaving = false;
                  this.messageService.success('Rate Quotation updated and image removed.');
                  this.router.navigate(['/dashboard/rate-quotation/dashboard']);
                },
                error: () => {
                  this.isSaving = false;
                  this.messageService.success('Rate Quotation updated.');
                  this.router.navigate(['/dashboard/rate-quotation/dashboard']);
                }
              });
            } else {
              this.isSaving = false;
              this.messageService.success('Rate Quotation Updated Successfully');
              this.router.navigate(['/dashboard/rate-quotation/dashboard']);
            }
          } else {
            this.isSaving = false;
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

