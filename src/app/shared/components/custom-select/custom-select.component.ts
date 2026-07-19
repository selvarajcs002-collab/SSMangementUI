import { Component, Input, Output, EventEmitter, forwardRef, HostListener, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

export interface SelectOption {
  key: any;
  value: string;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeHtmlPipe],
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
  @Input() multiple: boolean = false;
  @Input() showSearch: boolean = false;
  @Input() emptyMessage: string = 'No options available';

  @Output() change = new EventEmitter<any>();

  searchTerm: string = '';
  selectedChips: SelectOption[] = [];

  selectedValue: any = null;
  selectedLabel: string = '';
  isOpen: boolean = false;

  onChange = (value: any) => { };
  onTouched = () => { };

  constructor(private elementRef: ElementRef, private cdr: ChangeDetectorRef) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] || changes['disabled']) {
      this.updateSelectedLabel();
    }
  }

  toggle() {
    if (!this.disabled && !this.loading) {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.searchTerm = ''; // Reset search on open
      }
      this.onTouched();
      this.cdr.markForCheck();
    }
  }

  get filteredOptions(): SelectOption[] {
    if (!this.options) return [];
    if (!this.searchTerm) return this.options;
    const term = this.searchTerm.toLowerCase();
    return this.options.filter(o => o.value.toLowerCase().includes(term));
  }

  selectAll() {
    if (this.options && this.multiple) {
      this.selectedValue = this.options.map(o => o.key);
      this.onChange(this.selectedValue);
      this.change.emit(this.selectedValue);
      this.updateSelectedLabel();
    }
  }

  clearAll() {
    if (this.multiple) {
      this.selectedValue = [];
      this.onChange(this.selectedValue);
      this.change.emit(this.selectedValue);
      this.updateSelectedLabel();
    }
  }

  removeChip(option: SelectOption, event: Event) {
    event.stopPropagation();
    if (this.multiple && Array.isArray(this.selectedValue)) {
      this.selectedValue = this.selectedValue.filter(k => k !== option.key);
      this.onChange(this.selectedValue);
      this.change.emit(this.selectedValue);
      this.updateSelectedLabel();
    }
  }

  selectOption(option: SelectOption) {
    if (this.multiple) {
      if (!Array.isArray(this.selectedValue)) {
        this.selectedValue = [];
      }
      const index = this.selectedValue.indexOf(option.key);
      if (index > -1) {
        this.selectedValue.splice(index, 1);
      } else {
        this.selectedValue.push(option.key);
      }
      this.onChange(this.selectedValue);
      this.change.emit(this.selectedValue);
      this.updateSelectedLabel();
    } else {
      this.selectedValue = option.key;
      this.isOpen = false;
      this.onChange(this.selectedValue);
      this.change.emit(this.selectedValue);
      this.updateSelectedLabel();
    }
    this.cdr.markForCheck();
  }

  isSelected(option: SelectOption): boolean {
    if (this.multiple) {
      return Array.isArray(this.selectedValue) && this.selectedValue.includes(option.key);
    }
    return option.key === this.selectedValue;
  }

  // ControlValueAccessor methods
  writeValue(value: any): void {
    if (this.multiple) {
      this.selectedValue = Array.isArray(value) ? [...value] : (value ? [value] : []);
    } else {
      this.selectedValue = value;
    }
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
      this.searchTerm = '';
      this.cdr.markForCheck();
    }
  }

  private updateSelectedLabel() {
    if (this.options) {
      if (this.multiple) {
        if (Array.isArray(this.selectedValue) && this.selectedValue.length > 0) {
          const selectedOptions = this.options.filter(o => this.selectedValue.includes(o.key));
          this.selectedChips = selectedOptions;
          this.selectedLabel = selectedOptions.map(o => o.value).join(', ');
        } else {
          this.selectedChips = [];
          this.selectedLabel = '';
        }
      } else {
        if (this.selectedValue !== null && this.selectedValue !== undefined && this.selectedValue !== '') {
          const option = this.options.find(o => String(o.key) === String(this.selectedValue));
          this.selectedLabel = option ? option.value : '';
        } else {
          this.selectedLabel = '';
        }
      }
    } else {
      this.selectedLabel = '';
    }
    this.cdr.markForCheck();
  }
}
