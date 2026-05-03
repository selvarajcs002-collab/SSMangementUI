import { Component, Input, Output, EventEmitter, forwardRef, HostListener, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

export interface SelectOption {
  key: any;
  value: string;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule, SafeHtmlPipe],
  templateUrl: './custom-select.component.html',
  styleUrl: './custom-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true
    }
  ]
})
export class CustomSelectComponent implements ControlValueAccessor, OnChanges {
  @Input() options: SelectOption[] | null = [];
  @Input() placeholder: string = 'Select...';
  @Input() icon: string = '';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() isInvalid: boolean = false;
  
  @Output() change = new EventEmitter<any>();

  selectedValue: any = null;
  selectedLabel: string = '';
  isOpen: boolean = false;

  onChange = (value: any) => {};
  onTouched = () => {};

  constructor(private elementRef: ElementRef, private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] || changes['disabled']) {
      this.updateSelectedLabel();
    }
  }

  toggle() {
    if (!this.disabled && !this.loading) {
      this.isOpen = !this.isOpen;
      this.onTouched();
      this.cdr.markForCheck();
    }
  }

  selectOption(option: SelectOption) {
    this.selectedValue = option.key;
    this.selectedLabel = option.value;
    this.isOpen = false;
    this.onChange(this.selectedValue);
    this.change.emit(this.selectedValue);
    this.cdr.markForCheck();
  }

  // ControlValueAccessor methods
  writeValue(value: any): void {
    this.selectedValue = value;
    this.updateSelectedLabel();
    this.cdr.markForCheck();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
      this.cdr.markForCheck();
    }
  }

  private updateSelectedLabel() {
    if (this.options && this.selectedValue !== null && this.selectedValue !== undefined && this.selectedValue !== '') {
      const option = this.options.find(o => String(o.key) === String(this.selectedValue));
      this.selectedLabel = option ? option.value : '';
    } else {
      this.selectedLabel = '';
    }
    this.cdr.markForCheck();
  }
}
