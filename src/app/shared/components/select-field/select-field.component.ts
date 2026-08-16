import { Component, Input, forwardRef, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

export interface SelectOption {
  label: string;
  value: any;
}

@Component({
  selector: 'app-select-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SafeHtmlPipe],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectFieldComponent),
      multi: true
    }
  ],
  template: `
    <div class="select-container">
      <label *ngIf="label" [for]="id" class="label">
        {{ label }} <span *ngIf="required" class="required">*</span>
      </label>
      <div class="select-wrapper" [class.has-icon]="icon" [class.invalid]="error">
        <span class="select-icon" *ngIf="icon" [innerHTML]="icon | safeHtml"></span>
        <select
          [id]="id"
          [disabled]="disabled"
          (change)="onSelect($event)"
          (blur)="onBlur()"
          class="select"
        >
          <option value="" disabled [selected]="!value">{{ placeholder }}</option>
          <option *ngFor="let opt of options" [value]="opt.value" [selected]="opt.value === value">
            {{ opt.label }}
          </option>
        </select>
        <span class="chevron">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </span>
      </div>
      <div class="error-message" *ngIf="error">
        {{ error }}
      </div>
    </div>
  `,
  styles: [`
    .select-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }

    .label {
      font-size: 13px;
      font-weight: 500;
      color: #1E293B;
    }

    .required {
      color: #EF4444;
    }

    .select-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      height: 48px;
    }

    .select-wrapper.has-icon .select {
      padding-left: 44px;
    }

    .select-icon {
      position: absolute;
      left: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94A3B8;
      pointer-events: none;
      z-index: 1;
    }

    .select-icon ::ng-deep svg {
      width: 20px;
      height: 20px;
      stroke-width: 2;
    }

    .select {
      width: 100%;
      height: 100%;
      padding: 0 40px 0 16px;
      border: none;
      background: transparent;
      font-size: 14px;
      font-family: inherit;
      color: #1E293B;
      outline: none;
      appearance: none;
      cursor: pointer;
      z-index: 2;
    }

    .chevron {
      position: absolute;
      right: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748B;
      pointer-events: none;
      z-index: 1;
    }

    .select-wrapper:focus-within {
      border-color: #3B82F6;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }

    .select-wrapper.invalid {
      border-color: #EF4444;
    }

    .select:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .error-message {
      font-size: 12px;
      color: #EF4444;
      font-weight: 500;
      margin-top: -4px;
    }
  `]
})
export class SelectFieldComponent implements ControlValueAccessor {
  @Input() id: string = 'select-' + Math.random().toString(36).substr(2, 9);
  @Input() label: string = '';
  @Input() placeholder: string = 'Select an option';
  @Input() options: SelectOption[] = [];
  @Input() required: boolean = false;
  @Input() error: string | null = null;
  @Input() icon: string | null = null;
  @Input() @HostBinding('style.grid-column') gridColumn: string = 'auto';

  value: any = '';
  disabled: boolean = false;

  onChange: any = () => {};
  onTouched: any = () => {};

  onSelect(event: any) {
    this.value = event.target.value;
    this.onChange(this.value);
  }

  onBlur() {
    this.onTouched();
  }

  writeValue(value: any): void {
    this.value = value || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
