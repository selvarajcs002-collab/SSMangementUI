import { Component, Input, forwardRef, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

@Component({
  selector: 'app-input-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SafeHtmlPipe],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputFieldComponent),
      multi: true
    }
  ],
  template: `
    <div class="input-container">
      <label *ngIf="label" [for]="id" class="label">
        {{ label }} <span *ngIf="required" class="required">*</span>
      </label>
      <div class="input-wrapper" [class.has-icon]="icon" [class.invalid]="error">
        <span class="input-icon" *ngIf="icon" [innerHTML]="icon | safeHtml"></span>
        <input
          [id]="id"
          [type]="type"
          [placeholder]="placeholder"
          [value]="value"
          [inputMode]="inputMode"
          [maxLength]="maxLength ?? 524288"
          (input)="onInput($event)"
          (blur)="onBlur()"
          [disabled]="disabled"
          class="input"
        />
      </div>
      <div class="error-message" *ngIf="error">
        {{ error }}
      </div>
    </div>
  `,
  styles: [`
    .input-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }

    .label {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-main);
    }

    .required {
      color: var(--error);
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      height: 48px;
    }

    .input-wrapper.has-icon .input {
      padding-left: 44px;
    }

    .input-icon {
      position: absolute;
      left: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94A3B8;
      pointer-events: none;
    }

    .input-icon ::ng-deep svg {
      width: 20px;
      height: 20px;
      stroke-width: 2;
    }

    .input {
      width: 100%;
      height: 100%;
      padding: 0 16px;
      border: none;
      background: transparent;
      font-size: 14px;
      font-family: inherit;
      color: var(--text-main);
      outline: none;
    }

    .input-wrapper:focus-within {
      border-color: var(--border-focus);
      box-shadow: var(--shadow-focus);
    }

    .input-wrapper.invalid {
      border-color: var(--error);
    }

    .input-wrapper.invalid:focus-within {
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
    }

    .input:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .error-message {
      font-size: 12px;
      color: var(--error);
      font-weight: 500;
      margin-top: -4px;
    }

    .input::placeholder {
      color: var(--placeholder);
    }
  `]
})
export class InputFieldComponent implements ControlValueAccessor {
  @Input() id: string = 'input-' + Math.random().toString(36).substr(2, 9);
  @Input() label: string = '';
  @Input() type: string = 'text';
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() error: string | null = null;
  @Input() icon: string | null = null;
  @Input() @HostBinding('style.grid-column') gridColumn: string = 'auto';
  @Input() inputMode: string = 'text';
  @Input() maxLength: number | null = null;

  value: string = '';
  disabled: boolean = false;

  onChange: any = () => {};
  onTouched: any = () => {};

  onInput(event: any) {
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
