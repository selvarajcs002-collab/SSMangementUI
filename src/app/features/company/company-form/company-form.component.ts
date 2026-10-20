import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { InputFieldComponent } from '../../../shared/components/input-field/input-field.component';
import { SelectFieldComponent, SelectOption } from '../../../shared/components/select-field/select-field.component';
import { CustomSelectComponent } from '../../../shared/components/custom-select/custom-select.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { GridLayoutComponent } from '../../../shared/components/grid-layout/grid-layout.component';
import { SectionHeaderComponent } from '../../../shared/components/section-header/section-header.component';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';
import { CompanyService, CompanySummary, readCompanyGst, readCompanyId } from '../../../core/services/company.service';
import { ModalService } from '../../../core/services/modal.service';
import { CompanyRequest } from '../../../core/models/request/company-request.model';
import { CommonResponse } from '../../../core/models/response/common-response.model';
import { gstValidator, phoneValidator, pincodeValidator } from '../../../shared/validators/custom-validators';

@Component({
  selector: 'app-company-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputFieldComponent,
    SelectFieldComponent,
    CustomSelectComponent,
    ButtonComponent,
    AlertComponent,
    GridLayoutComponent,
    SectionHeaderComponent,
    SafeHtmlPipe
  ],
  template: `
    <div class="company-workspace animate-fade-in">
      <!-- Top Navigation & Mode Bar -->
      <div class="workspace-topbar">
        <button type="button" class="btn-back" (click)="onCancel()" title="Back to Company Management">
          <span class="btn-back-icon" [innerHTML]="icons.arrowLeft | safeHtml"></span>
          <span>Back to Companies</span>
        </button>

        <div class="mode-Segmented" role="tablist" aria-label="Company form mode">
          <button
            type="button"
            class="mode-tab"
            [class.active]="mode === 'add'"
            (click)="switchMode('add')">
            <span class="tab-icon" [innerHTML]="icons.plus | safeHtml"></span>
            <span>Add Company</span>
          </button>
          <button
            type="button"
            class="mode-tab"
            [class.active]="mode === 'update'"
            (click)="switchMode('update')">
            <span class="tab-icon" [innerHTML]="icons.edit | safeHtml"></span>
            <span>Update Company</span>
          </button>
        </div>
      </div>

      <!-- Hero Banner -->
      <header class="hero-banner" [class.is-update]="mode === 'update'">
        <div class="hero-left">
          <div class="hero-icon-box">
            <span class="main-icon" [innerHTML]="(mode === 'add' ? icons.building : icons.editBuilding) | safeHtml"></span>
          </div>
          <div class="hero-copy">
            <div class="hero-eyebrow-row">
              <span class="hero-badge" [class.badge-update]="mode === 'update'">
                {{ mode === 'add' ? 'NEW REGISTRATION' : 'PROFILE UPDATE' }}
              </span>
              <span class="hero-id-pill" *ngIf="mode === 'update' && editId">
                Company ID #{{ editId }}
              </span>
            </div>
            <h1 class="form-title">{{ mode === 'add' ? 'Add New Company' : 'Update Company Details' }}</h1>
            <p class="form-subtitle">
              {{ mode === 'add'
                ? 'Register a new client company with GST credentials, billing address, and delivery destinations.'
                : 'Select an existing company profile below to modify its name, GST number, address, or delivery locations.' }}
            </p>
          </div>
        </div>

        <div class="hero-right">
          <div class="completion-pill" [class.is-ready]="companyForm.valid">
            <span class="completion-dot"></span>
            <span>{{ companyForm.valid ? 'Ready to ' + (isEdit ? 'Update' : 'Create') : completionPercentage + '% Completed' }}</span>
          </div>
        </div>
      </header>

      <app-alert
        *ngIf="alertMessage"
        [message]="alertMessage"
        [type]="alertType"
        (close)="alertMessage = null"
      ></app-alert>

      <form [formGroup]="companyForm" (ngSubmit)="onSubmit()" class="workspace-grid">
        <!-- Main Form Column -->
        <div class="form-main-col">

          <!-- Update Mode: Spotlight Company Selector Card -->
          <section class="section-card selector-spotlight" *ngIf="mode === 'update'">
            <div class="selector-header">
              <div class="selector-title-group">
                <span class="selector-badge-num">STEP 1</span>
                <div>
                  <h2 class="selector-title">Select Company to Edit</h2>
                  <p class="selector-desc">Search and choose a registered company to load its current details into the form</p>
                </div>
              </div>
              <span class="company-count-pill" *ngIf="companySelectOptions.length">
                {{ companySelectOptions.length }} Companies
              </span>
            </div>

            <div class="select-field-container">
              <label class="field-label">Search Registered Company <span class="required">*</span></label>
              <app-custom-select
                formControlName="companyId"
                [options]="companySelectOptions"
                [enableTypeAhead]="true"
                [icon]="icons.building"
                placeholder="Type company name to search and select..."
                (change)="onCompanyChange($event)">
              </app-custom-select>
              <div class="error-message" *ngIf="getErrorMessage('companyId')">{{ getErrorMessage('companyId') }}</div>
            </div>
          </section>

          <!-- Section 1: Corporate & Tax Identity -->
          <section class="section-card">
            <div class="section-card-header">
              <div class="section-icon-wrap blue">
                <span [innerHTML]="icons.building | safeHtml"></span>
              </div>
              <div class="section-header-text">
                <h2 class="section-title">Basic & Tax Information</h2>
                <p class="section-subtitle">Official registered business name, GSTIN, and primary contact number</p>
              </div>
            </div>

            <div class="fields-grid-2">
              <div class="field-span-full">
                <app-input-field
                  [label]="mode === 'update' ? 'Company Name (Editable)' : 'Company Name'"
                  placeholder="Enter official company name"
                  formControlName="companyName"
                  [required]="true"
                  [icon]="icons.building"
                  [error]="getErrorMessage('companyName')"
                ></app-input-field>
              </div>

              <app-input-field
                label="GST Number (15-Digit GSTIN)"
                placeholder="e.g. 22AAAAA0000A1Z5"
                formControlName="gst_No"
                [required]="true"
                [icon]="icons.hash"
                [maxLength]="15"
                [error]="getErrorMessage('gst_No')"
              ></app-input-field>

              <app-input-field
                label="Phone Number"
                placeholder="10-digit contact number"
                formControlName="phoneNumber"
                [required]="false"
                [icon]="icons.phone"
                inputMode="tel"
                [maxLength]="15"
              ></app-input-field>
            </div>
          </section>

          <!-- Section 2: Delivery To Locations -->
          <section class="section-card">
            <div class="section-card-header">
              <div class="section-icon-wrap indigo">
                <span [innerHTML]="icons.truck | safeHtml"></span>
              </div>
              <div class="section-header-text">
                <h2 class="section-title">Delivery To Locations</h2>
                <p class="section-subtitle">Add one or more warehouse, branch, or factory drop-off locations for challans</p>
              </div>
              <span class="location-count-badge">
                {{ deliveryToLocations.length }} {{ deliveryToLocations.length === 1 ? 'Location' : 'Locations' }}
              </span>
            </div>

            <div class="delivery-composer">
              <div class="composer-input-row">
                <div class="composer-field-wrap">
                  <div class="composer-input-box" [class.invalid]="locationInputError">
                    <span class="composer-icon" [innerHTML]="icons.mapPin | safeHtml"></span>
                    <input
                      type="text"
                      [formControl]="newLocationControl"
                      (keyup.enter)="$event.preventDefault(); addLocation()"
                      placeholder="Type a delivery destination (e.g. Tirupur Unit 2, Warehouse B) and press Enter"
                      class="composer-input" />
                    <button
                      *ngIf="newLocationControl.value"
                      type="button"
                      class="composer-clear-btn"
                      (click)="newLocationControl.reset(); locationInputError = null"
                      title="Clear text">
                      ×
                    </button>
                  </div>
                  <div *ngIf="locationInputError" class="composer-error">{{ locationInputError }}</div>
                </div>

                <button type="button" class="btn-add-location" (click)="addLocation()">
                  <span class="add-btn-icon" [innerHTML]="icons.plus | safeHtml"></span>
                  <span>Add Location</span>
                </button>
              </div>

              <!-- Chips Display -->
              <div class="locations-chip-area" *ngIf="deliveryToLocations.length > 0; else emptyLocationsTpl">
                <div *ngFor="let loc of deliveryToLocations; let i = index" class="location-chip">
                  <span class="chip-pin" [innerHTML]="icons.mapPin | safeHtml"></span>
                  <span class="chip-text">{{ loc }}</span>
                  <button type="button" (click)="removeLocation(i)" class="chip-remove-btn" title="Remove location">
                    <span [innerHTML]="icons.x | safeHtml"></span>
                  </button>
                </div>
              </div>

              <ng-template #emptyLocationsTpl>
                <div class="empty-locations-box">
                  <span class="empty-loc-icon" [innerHTML]="icons.mapPin | safeHtml"></span>
                  <span>No delivery locations added yet. Add locations above for quick selection during DC creation.</span>
                </div>
              </ng-template>
            </div>
          </section>

          <!-- Section 3: Registered Address Information -->
          <section class="section-card">
            <div class="section-card-header">
              <div class="section-icon-wrap emerald">
                <span [innerHTML]="icons.mapPin | safeHtml"></span>
              </div>
              <div class="section-header-text">
                <h2 class="section-title">Address Information</h2>
                <p class="section-subtitle">Complete street address, landmark, city, and postal code</p>
              </div>
            </div>

            <div class="fields-grid-address">
              <app-input-field
                label="Door / Plot No"
                placeholder="e.g. 402/A"
                formControlName="door_No"
                [required]="false"
                [icon]="icons.door"
                [error]="getErrorMessage('door_No')"
              ></app-input-field>

              <div class="street-span">
                <app-input-field
                  label="Street Name / Building"
                  placeholder="Enter street, industrial estate, or building name"
                  formControlName="street_Name"
                  [required]="true"
                  [icon]="icons.street"
                  [error]="getErrorMessage('street_Name')"
                ></app-input-field>
              </div>

              <app-input-field
                label="Nearby / Landmark"
                placeholder="e.g. Near City Center"
                formControlName="landmark"
                [icon]="icons.landmark"
                [error]="getErrorMessage('landmark')"
              ></app-input-field>

              <app-input-field
                label="City / District"
                placeholder="Enter city"
                formControlName="city"
                [required]="true"
                [icon]="icons.city"
                [error]="getErrorMessage('city')"
              ></app-input-field>

              <app-input-field
                label="Pincode"
                placeholder="6-digit pincode"
                formControlName="pincode"
                [required]="true"
                [icon]="icons.hash"
                inputMode="numeric"
                [maxLength]="6"
                [error]="getErrorMessage('pincode')"
              ></app-input-field>
            </div>
          </section>

          <!-- Action Footer -->
          <footer class="modern-form-footer">
            <button
              type="button"
              class="btn-footer-reset"
              (click)="onResetForm()"
              [disabled]="isLoading">
              Reset Fields
            </button>

            <div class="footer-right-actions">
              <app-button
                type="button"
                variant="secondary"
                (btnClick)="onCancel()"
                [disabled]="isLoading">
                Cancel
              </app-button>
              <app-button
                type="submit"
                variant="primary"
                [isLoading]="isLoading"
                [disabled]="companyForm.invalid || isLoading">
                {{ isEdit ? 'Update Company' : 'Create Company' }}
              </app-button>
            </div>
          </footer>
        </div>

        <!-- Right Sticky Column: Live Company Profile Preview -->
        <aside class="preview-sidebar">
          <div class="preview-card">
            <div class="preview-top-banner">
              <div class="preview-avatar">
                {{ companyInitials }}
              </div>
              <div class="preview-status-tag">
                {{ isEdit ? (editId ? 'EDITING #' + editId : 'SELECT COMPANY') : 'LIVE PREVIEW' }}
              </div>
            </div>

            <div class="preview-body">
              <h3 class="preview-company-name" [class.is-placeholder]="!companyForm.get('companyName')?.value">
                {{ companyForm.get('companyName')?.value || 'Company Name Preview' }}
              </h3>

              <div class="preview-meta-pills">
                <span class="meta-pill gst">
                  <strong>GST:</strong> {{ (companyForm.get('gst_No')?.value | uppercase) || 'Not entered' }}
                </span>
                <span class="meta-pill phone" *ngIf="companyForm.get('phoneNumber')?.value">
                  <strong>Tel:</strong> {{ companyForm.get('phoneNumber')?.value }}
                </span>
              </div>

              <div class="preview-divider"></div>

              <div class="preview-block">
                <span class="preview-block-label">BILLING ADDRESS</span>
                <p class="preview-address-text" [class.is-placeholder]="!formattedAddressPreview">
                  {{ formattedAddressPreview || 'Address details will appear here as you type...' }}
                </p>
              </div>

              <div class="preview-block">
                <div class="preview-block-row">
                  <span class="preview-block-label">DELIVERY LOCATIONS</span>
                  <span class="preview-mini-count">{{ deliveryToLocations.length }}</span>
                </div>
                <div class="preview-locs-wrap" *ngIf="deliveryToLocations.length > 0; else noPreviewLocs">
                  <span *ngFor="let loc of deliveryToLocations" class="preview-loc-tag">{{ loc }}</span>
                </div>
                <ng-template #noPreviewLocs>
                  <p class="preview-empty-hint">No delivery locations added</p>
                </ng-template>
              </div>

              <div class="preview-divider"></div>

              <!-- Field Readiness Checklist -->
              <div class="preview-checklist">
                <span class="preview-block-label">REQUIRED CHECKLIST</span>
                <div class="check-item" [class.done]="companyForm.get('companyName')?.valid">
                  <span class="check-dot"></span>
                  <span>Company Name</span>
                </div>
                <div class="check-item" [class.done]="companyForm.get('gst_No')?.valid">
                  <span class="check-dot"></span>
                  <span>Valid 15-Digit GSTIN</span>
                </div>
                <div class="check-item" [class.done]="companyForm.get('street_Name')?.valid">
                  <span class="check-dot"></span>
                  <span>Street / Building Address</span>
                </div>
                <div class="check-item" [class.done]="companyForm.get('city')?.valid && companyForm.get('pincode')?.valid">
                  <span class="check-dot"></span>
                  <span>City & 6-Digit Pincode</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </form>
    </div>
  `,
  styles: [`
    .company-workspace {
      max-width: 1240px;
      margin: 0 auto;
      padding: 24px 20px 48px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Top Bar */
    .workspace-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 38px;
      padding: 0 14px;
      border-radius: 10px;
      border: 1px solid #E2E8F0;
      background: #FFFFFF;
      color: #475569;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.16s ease;

      &:hover {
        background: #F8FAFC;
        border-color: #CBD5E1;
        color: #0F172A;
        transform: translateX(-2px);
      }
    }

    .btn-back-icon {
      display: inline-flex;
      align-items: center;
    }

    .btn-back-icon ::ng-deep svg {
      width: 16px;
      height: 16px;
    }

    .mode-Segmented {
      display: inline-flex;
      align-items: center;
      padding: 4px;
      border-radius: 12px;
      background: #F1F5F9;
      border: 1px solid #E2E8F0;
      gap: 4px;
    }

    .mode-tab {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      height: 34px;
      padding: 0 14px;
      border-radius: 9px;
      border: none;
      background: transparent;
      color: #64748B;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.16s ease;

      &:hover:not(.active) {
        color: #0F172A;
      }

      &.active {
        background: #FFFFFF;
        color: #2563EB;
        box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
      }
    }

    .tab-icon {
      display: inline-flex;
      align-items: center;
    }

    .tab-icon ::ng-deep svg {
      width: 15px;
      height: 15px;
    }

    /* Hero Banner */
    .hero-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
      padding: 24px 28px;
      border-radius: 18px;
      background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%);
      border: 1px solid #E2E8F0;
      box-shadow: 0 8px 24px -10px rgba(15, 23, 42, 0.06);
      position: relative;
      overflow: hidden;
    }

    .hero-banner::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 5px;
      background: linear-gradient(180deg, #2563EB, #3B82F6);
    }

    .hero-banner.is-update::before {
      background: linear-gradient(180deg, #4F46E5, #6366F1);
    }

    .hero-left {
      display: flex;
      align-items: center;
      gap: 18px;
    }

    .hero-icon-box {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, #EFF6FF, #DBEAFE);
      border: 1px solid #BFDBFE;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #2563EB;
      flex-shrink: 0;
    }

    .hero-banner.is-update .hero-icon-box {
      background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
      border-color: #C7D2FE;
      color: #4F46E5;
    }

    .main-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .main-icon ::ng-deep svg {
      width: 28px;
      height: 28px;
    }

    .hero-eyebrow-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .hero-badge {
      font-size: 10.5px;
      font-weight: 800;
      letter-spacing: 0.08em;
      padding: 3px 9px;
      border-radius: 999px;
      background: #DBEAFE;
      color: #1D4ED8;
    }

    .hero-badge.badge-update {
      background: #E0E7FF;
      color: #4338CA;
    }

    .hero-id-pill {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 9px;
      border-radius: 999px;
      background: #F1F5F9;
      color: #334155;
      border: 1px solid #E2E8F0;
    }

    .form-title {
      font-size: 24px;
      font-weight: 800;
      color: #0F172A;
      margin: 0 0 4px;
      letter-spacing: -0.02em;
    }

    .form-subtitle {
      font-size: 13.5px;
      color: #64748B;
      margin: 0;
    }

    .completion-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 999px;
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      color: #B45309;
      font-size: 12.5px;
      font-weight: 800;

      .completion-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #F59E0B;
      }

      &.is-ready {
        background: #ECFDF5;
        border-color: #A7F3D0;
        color: #047857;

        .completion-dot {
          background: #10B981;
        }
      }
    }

    /* Two-column layout */
    .workspace-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 330px;
      gap: 22px;
      align-items: start;
    }

    .form-main-col {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Section Cards */
    .section-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 18px;
      padding: 24px;
      box-shadow: 0 4px 16px -6px rgba(15, 23, 42, 0.05);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;

      &:hover {
        border-color: #CBD5E1;
      }
    }

    .selector-spotlight {
      background: linear-gradient(135deg, #F8FAFF 0%, #EFF6FF 100%);
      border: 1.5px solid #BFDBFE;
    }

    .selector-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }

    .selector-title-group {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .selector-badge-num {
      padding: 4px 9px;
      border-radius: 8px;
      background: #2563EB;
      color: #FFFFFF;
      font-size: 10.5px;
      font-weight: 800;
      letter-spacing: 0.06em;
      margin-top: 2px;
    }

    .selector-title {
      font-size: 16px;
      font-weight: 800;
      color: #0F172A;
      margin: 0 0 2px;
    }

    .selector-desc {
      font-size: 12.5px;
      color: #475569;
      margin: 0;
    }

    .company-count-pill {
      padding: 4px 10px;
      border-radius: 999px;
      background: #FFFFFF;
      border: 1px solid #BFDBFE;
      color: #1D4ED8;
      font-size: 11.5px;
      font-weight: 800;
      white-space: nowrap;
    }

    .section-card-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding-bottom: 18px;
      margin-bottom: 20px;
      border-bottom: 1px solid #F1F5F9;
    }

    .section-icon-wrap {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.blue {
        background: #EFF6FF;
        color: #2563EB;
        border: 1px solid #DBEAFE;
      }

      &.indigo {
        background: #EEF2FF;
        color: #4F46E5;
        border: 1px solid #E0E7FF;
      }

      &.emerald {
        background: #ECFDF5;
        color: #059669;
        border: 1px solid #D1FAE5;
      }
    }

    .section-icon-wrap ::ng-deep svg {
      width: 20px;
      height: 20px;
    }

    .section-header-text {
      flex: 1;
    }

    .section-title {
      font-size: 16px;
      font-weight: 800;
      color: #0F172A;
      margin: 0 0 2px;
    }

    .section-subtitle {
      font-size: 12.5px;
      color: #64748B;
      margin: 0;
    }

    .location-count-badge {
      padding: 4px 11px;
      border-radius: 999px;
      background: #EEF2FF;
      color: #4338CA;
      font-size: 12px;
      font-weight: 800;
    }

    /* Field Grids */
    .fields-grid-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    .field-span-full {
      grid-column: 1 / -1;
    }

    .fields-grid-address {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
    }

    .street-span {
      grid-column: span 2;
    }

    /* Delivery Locations Composer */
    .delivery-composer {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .composer-input-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .composer-field-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .composer-input-box {
      height: 48px;
      display: flex;
      align-items: center;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      background: #F8FAFC;
      padding: 0 12px;
      transition: all 0.18s ease;

      &:focus-within {
        background: #FFFFFF;
        border-color: #3B82F6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.14);
      }

      &.invalid {
        border-color: #EF4444;
        background: #FEF2F2;
      }
    }

    .composer-icon {
      display: flex;
      align-items: center;
      color: #64748B;
      margin-right: 10px;
    }

    .composer-icon ::ng-deep svg {
      width: 18px;
      height: 18px;
    }

    .composer-input {
      flex: 1;
      height: 100%;
      border: none;
      outline: none;
      background: transparent;
      font-size: 14px;
      color: #0F172A;
    }

    .composer-clear-btn {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      border: none;
      background: #E2E8F0;
      color: #475569;
      font-size: 15px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .composer-error {
      color: #EF4444;
      font-size: 12px;
      font-weight: 600;
      margin-top: 5px;
    }

    .btn-add-location {
      height: 48px;
      padding: 0 18px;
      border-radius: 10px;
      border: none;
      background: linear-gradient(135deg, #2563EB, #1D4ED8);
      color: #FFFFFF;
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.22);
      transition: all 0.16s ease;

      &:hover {
        background: linear-gradient(135deg, #1D4ED8, #1E40AF);
        transform: translateY(-1px);
      }
    }

    .add-btn-icon {
      display: inline-flex;
      align-items: center;
    }

    .add-btn-icon ::ng-deep svg {
      width: 17px;
      height: 17px;
    }

    .locations-chip-area {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 14px;
      border-radius: 12px;
      background: #F8FAFC;
      border: 1px dashed #CBD5E1;
    }

    .location-chip {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 6px 10px 6px 12px;
      border-radius: 999px;
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      color: #1E293B;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      transition: all 0.15s ease;

      &:hover {
        border-color: #93C5FD;
        background: #EFF6FF;
      }
    }

    .chip-pin {
      display: inline-flex;
      color: #2563EB;
    }

    .chip-pin ::ng-deep svg {
      width: 14px;
      height: 14px;
    }

    .chip-remove-btn {
      background: #F1F5F9;
      border: none;
      padding: 0;
      margin: 0;
      color: #64748B;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      transition: all 0.15s ease;

      &:hover {
        color: #EF4444;
        background: #FEE2E2;
      }
    }

    .chip-remove-btn ::ng-deep svg {
      width: 13px;
      height: 13px;
    }

    .empty-locations-box {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      border-radius: 12px;
      background: #F8FAFC;
      border: 1px dashed #CBD5E1;
      color: #64748B;
      font-size: 13px;
    }

    .empty-loc-icon {
      display: inline-flex;
      color: #94A3B8;
    }

    .empty-loc-icon ::ng-deep svg {
      width: 18px;
      height: 18px;
    }

    /* Footer */
    .modern-form-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      padding: 18px 24px;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      box-shadow: 0 4px 16px -6px rgba(15, 23, 42, 0.05);
    }

    .btn-footer-reset {
      height: 42px;
      padding: 0 14px;
      border-radius: 10px;
      border: 1px solid transparent;
      background: transparent;
      color: #64748B;
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover:not(:disabled) {
        background: #F1F5F9;
        color: #0F172A;
      }
    }

    .footer-right-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* Live Preview Sidebar */
    .preview-sidebar {
      position: sticky;
      top: 20px;
    }

    .preview-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 10px 28px -10px rgba(15, 23, 42, 0.08);
    }

    .preview-top-banner {
      background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .preview-avatar {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: linear-gradient(135deg, #3B82F6, #2563EB);
      color: #FFFFFF;
      font-size: 18px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
    }

    .preview-status-tag {
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.12);
      color: #E2E8F0;
      font-size: 10.5px;
      font-weight: 800;
      letter-spacing: 0.06em;
    }

    .preview-body {
      padding: 20px;
    }

    .preview-company-name {
      font-size: 17px;
      font-weight: 800;
      color: #0F172A;
      margin: 0 0 10px;
      word-break: break-word;

      &.is-placeholder {
        color: #94A3B8;
        font-weight: 600;
      }
    }

    .preview-meta-pills {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .meta-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 12px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      color: #334155;
    }

    .preview-divider {
      height: 1px;
      background: #F1F5F9;
      margin: 16px 0;
    }

    .preview-block {
      margin-bottom: 14px;
    }

    .preview-block-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .preview-block-label {
      display: block;
      font-size: 10.5px;
      font-weight: 800;
      letter-spacing: 0.07em;
      color: #64748B;
      margin-bottom: 6px;
    }

    .preview-mini-count {
      padding: 1px 7px;
      border-radius: 999px;
      background: #EFF6FF;
      color: #2563EB;
      font-size: 11px;
      font-weight: 800;
    }

    .preview-address-text {
      font-size: 13px;
      line-height: 1.5;
      color: #334155;
      margin: 0;

      &.is-placeholder {
        color: #94A3B8;
        font-style: italic;
      }
    }

    .preview-locs-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .preview-loc-tag {
      padding: 4px 9px;
      border-radius: 999px;
      background: #F1F5F9;
      color: #334155;
      font-size: 11.5px;
      font-weight: 600;
    }

    .preview-empty-hint {
      font-size: 12.5px;
      color: #94A3B8;
      font-style: italic;
      margin: 0;
    }

    .preview-checklist {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .check-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12.5px;
      font-weight: 600;
      color: #64748B;

      .check-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #CBD5E1;
        transition: all 0.15s ease;
      }

      &.done {
        color: #0F172A;

        .check-dot {
          background: #10B981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.16);
        }
      }
    }

    .select-field-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }

    .field-label {
      font-size: 13px;
      font-weight: 600;
      color: #1E293B;
    }

    .required {
      color: var(--error, #ef4444);
    }

    .error-message {
      font-size: 12px;
      color: var(--error, #ef4444);
      font-weight: 500;
      margin-top: -4px;
    }

    @media (max-width: 1024px) {
      .workspace-grid {
        grid-template-columns: 1fr;
      }

      .preview-sidebar {
        position: static;
      }
    }

    @media (max-width: 768px) {
      .fields-grid-2,
      .fields-grid-address {
        grid-template-columns: 1fr;
      }

      .street-span {
        grid-column: span 1;
      }

      .composer-input-row {
        flex-direction: column;
      }

      .btn-add-location {
        width: 100%;
        justify-content: center;
      }

      .modern-form-footer {
        flex-direction: column-reverse;
        align-items: stretch;
      }

      .footer-right-actions {
        flex-direction: column-reverse;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyFormComponent implements OnInit, OnChanges {
  @Input() mode: 'add' | 'update' = 'add';
  @Input() companyId: number | null = null;

  companyForm!: FormGroup;
  isLoading = false;
  isEdit = false; // true for update
  editId: number | null = null;
  alertMessage: string | null = null;
  alertType: 'success' | 'error' = 'success';
  companyOptions: SelectOption[] = [];
  companySelectOptions: { key: any; value: string }[] = [];

  icons = {
    building: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M16 18h.01"/></svg>`,
    editBuilding: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`,
    arrowLeft: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`,
    edit: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    truck: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`,
    phone: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-phone"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    hash: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hash"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>`,
    plus: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
    trash: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
    mapPin: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    door: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-door-open"><path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.562v16.156a1 1 0 0 1-1.242.97L5 20V5.562a1 1 0 0 1 1.242-.97L12 6a1 1 0 0 1 1 1z"/></svg>`,
    street: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pinned"><path d="M18 8c0 4.5-6 9-6 9s-6-4.5-6-9a6 6 0 0 1 12 0Z"/><circle cx="12" cy="8" r="2"/><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/></svg>`,
    landmark: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-landmark"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>`,
    city: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-navigation"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`,
    x: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private companyService: CompanyService,
    private modalService: ModalService
  ) {}

  deliveryToLocations: string[] = [];
  locationInputError: string | null = null;
  newLocationControl = new FormControl('');

  addLocation(): void {
    const val = this.newLocationControl.value?.trim();
    if (!val) {
      this.locationInputError = 'Location cannot be empty';
      return;
    }
    
    const exists = this.deliveryToLocations.some(loc => loc.toLowerCase() === val.toLowerCase());
    if (exists) {
      this.locationInputError = 'Location already exists';
      return;
    }

    this.deliveryToLocations.push(val);
    this.newLocationControl.reset();
    this.locationInputError = null;
    this.companyForm.markAsDirty();
  }

  removeLocation(index: number): void {
    this.deliveryToLocations.splice(index, 1);
    this.companyForm.markAsDirty();
  }

  ngOnInit(): void {
    this.isEdit = this.mode === 'update';
    this.initForm();
    if (this.isEdit) {
      this.editId = this.companyId;
      this.loadCompanyList();
      if (this.editId && this.editId > 0) {
        this.fetchAndPatchCompany(this.editId);
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['companyId'] && !changes['companyId'].firstChange) {
      const nextId = Number(this.companyId || 0);
      if (this.isEdit && nextId > 0 && nextId !== this.editId) {
        this.fetchAndPatchCompany(nextId);
      }
    }
  }

  initForm(): void {
    this.companyForm = this.fb.group({
      companyId: [null, this.mode === 'update' ? [Validators.required] : []],
      companyName: ['', Validators.required],
      gst_No: ['', [Validators.required, gstValidator]],
      phoneNumber: [''],
      door_No: [''],
      street_Name: ['', Validators.required],
      landmark: [''],
      city: ['', Validators.required],
      pincode: ['', [Validators.required, pincodeValidator]]
    });
  }

  loadCompanyList(): void {
    this.companyService.getCompanies().subscribe(companies => {
      this.companyOptions = companies.map(c => ({
        label: c.value,
        value: c.key
      }));
      this.companySelectOptions = companies.map(c => ({
        key: c.key,
        value: c.value
      }));
      this.cdr.markForCheck();
    });
  }

  private hasFieldEdits(): boolean {
    if (!this.companyForm || !this.editId) return false;
    const keys = ['companyName', 'gst_No', 'phoneNumber', 'door_No', 'street_Name', 'landmark', 'city', 'pincode'];
    return keys.some(k => this.companyForm.get(k)?.dirty);
  }

  async onCompanyChange(event: any) {
    const newId = Number(event?.target?.value ?? event);
    if (!newId || newId === this.editId) return;

    if (this.hasFieldEdits()) {
      const confirmed = await this.modalService.showConfirmation({
        title: 'Switch Company?',
        message: 'Switching company will reset current data. Do you want to continue?'
      });

      if (!confirmed) {
        this.companyForm.get('companyId')?.setValue(this.editId, { emitEvent: false });
        this.cdr.markForCheck();
        return;
      }
    }

    this.fetchAndPatchCompany(newId);
  }

  fetchAndPatchCompany(id: number): void {
    this.isLoading = true;
    this.companyService.getCompanyById(id).subscribe({
      next: details => {
        this.isLoading = false;
        const loadedId = readCompanyId(details);
        if (details && loadedId === id) {
          this.editId = loadedId;
          this.companyForm.patchValue({
            companyId: loadedId,
            companyName: details.companyName ?? details.CompanyName ?? '',
            phoneNumber: details.phoneNumber ?? details.PhoneNumber ?? '',
            gst_No: readCompanyGst(details),
            door_No: details.door_No ?? details.Door_No ?? '',
            street_Name: details.street_Name ?? details.Street_Name ?? '',
            landmark: details.landmark ?? details.Landmark ?? '',
            city: details.city ?? details.City ?? '',
            pincode: details.pincode ?? details.Pincode ?? ''
          }, { emitEvent: false });

          // Patch delivery to array
          if (details.deliveryToLocations && Array.isArray(details.deliveryToLocations)) {
            this.deliveryToLocations = [...details.deliveryToLocations];
          } else if (details.deliveryTo) {
            this.deliveryToLocations = [details.deliveryTo];
          } else {
            this.deliveryToLocations = [];
          }

          this.companyForm.markAsPristine();
          this.companyForm.markAsUntouched();
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getErrorMessage(controlName: string): string | null {
    const control = this.companyForm.get(controlName);
    if (!control || !control.touched || !control.errors) return null;

    if (control.errors['required']) return 'This field is required';
    if (control.errors['pattern']) {
       if (controlName === 'gst_No') return 'Enter a valid 15-digit GST number';
       if (controlName === 'pincode') return 'Enter a valid 6-digit pincode';
    }

    return 'Invalid input';
  }

  onSubmit(): void {
    // 1. Validate form
    if (this.companyForm.invalid) {
      this.companyForm.markAllAsTouched();
      return;
    }

    // 2. Prepare payload
    const formValues = this.companyForm.getRawValue();
    const resolvedCompanyId = this.isEdit
      ? Number(this.editId || formValues.companyId || 0) || undefined
      : undefined;

    const payload: CompanyRequest = {
      ...formValues,
      companyName: String(formValues.companyName || '').trim(),
      deliveryToLocations: this.deliveryToLocations,
      mode: this.isEdit ? 'UPDATE' : 'INSERT',
      companyId: resolvedCompanyId
    } as any;

    this.isLoading = true;

    // 3. Choice API
    const request$ = this.isEdit
      ? this.companyService.updateCompany(payload)
      : this.companyService.saveCompany(payload);

    // 4. Call API
    request$.subscribe({
      next: (res: CommonResponse) => {
        this.isLoading = false;
        if (res.status) {
          console.log('Success:', res);

          // Store response
          localStorage.setItem('companyId', res.id.toString());

          if (this.isEdit) {
            this.loadCompanyList();
          }

          alert(res.message);

          // Reset form after create
          if (!this.isEdit) {
            this.companyForm.reset();
          }

          this.cdr.markForCheck();
          setTimeout(() => this.router.navigate(['/dashboard/company']), 2000);
        } else {
          alert(res.message);
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        alert('Something went wrong');
        this.cdr.markForCheck();
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/company']);
  }

  switchMode(targetMode: 'add' | 'update'): void {
    if (this.mode === targetMode) return;
    this.router.navigate([
      targetMode === 'add' ? '/dashboard/company/add' : '/dashboard/company/update'
    ]);
  }

  onResetForm(): void {
    if (this.isEdit && this.editId) {
      this.fetchAndPatchCompany(this.editId);
      return;
    }
    this.companyForm.reset();
    this.deliveryToLocations = [];
    this.newLocationControl.reset();
    this.locationInputError = null;
    this.cdr.markForCheck();
  }

  get companyInitials(): string {
    const name = String(this.companyForm?.get('companyName')?.value || '').trim();
    if (!name) return 'CO';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  get formattedAddressPreview(): string {
    if (!this.companyForm) return '';
    const v = this.companyForm.value;
    const parts = [
      v.door_No ? `No. ${v.door_No}` : '',
      v.street_Name || '',
      v.landmark ? `(${v.landmark})` : '',
      v.city || '',
      v.pincode ? `- ${v.pincode}` : ''
    ].filter(Boolean);
    return parts.join(', ').replace(', - ', ' - ');
  }

  get completionPercentage(): number {
    if (!this.companyForm) return 0;
    const requiredKeys = this.isEdit
      ? ['companyId', 'companyName', 'gst_No', 'street_Name', 'city', 'pincode']
      : ['companyName', 'gst_No', 'street_Name', 'city', 'pincode'];
    const validCount = requiredKeys.filter(k => this.companyForm.get(k)?.valid).length;
    return Math.round((validCount / requiredKeys.length) * 100);
  }

  scrollToFirstError(): void {
    const firstInvalidControl = document.querySelector('.input-wrapper.invalid');
    if (firstInvalidControl) {
      firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = (firstInvalidControl as HTMLElement).querySelector('input');
      if (input) input.focus();
    }
  }
}
