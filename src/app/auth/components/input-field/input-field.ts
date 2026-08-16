import { Component, Input, forwardRef, ChangeDetectionStrategy, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-input-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './input-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputField),
      multi: true
    }
  ]
})
export class InputField implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() type: 'text' | 'email' | 'password' = 'text';
  @Input() placeholder: string = '';
  @Input() icon: string = '';
  @Input() error: string | null = null;
  
  value = signal<string>('');
  disabled = signal<boolean>(false);
  
  isPasswordVisible = signal<boolean>(false);

  onChange = (val: string) => {};
  onTouched = () => {};

  writeValue(val: string): void {
    this.value.set(val || '');
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.onChange(val);
  }

  onBlur(): void {
    this.onTouched();
  }

  togglePassword(): void {
    if (this.type === 'password') {
      this.isPasswordVisible.update(v => !v);
    }
  }

  get computedType(): string {
    if (this.type !== 'password') return this.type;
    return this.isPasswordVisible() ? 'text' : 'password';
  }
}
