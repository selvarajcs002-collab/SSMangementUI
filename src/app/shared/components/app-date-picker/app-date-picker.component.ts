import { Component, Input, Output, EventEmitter, forwardRef, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormsModule } from '@angular/forms';

export interface CalendarDay {
  date: Date | null;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './app-date-picker.component.html',
  styleUrls: ['./app-date-picker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppDatePickerComponent),
      multi: true
    }
  ]
})
export class AppDatePickerComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() placeholder: string = 'Select Date';
  @Input() minDate?: Date | string;
  @Input() maxDate?: Date | string;
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() error: boolean | string | null = false;

  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;
  currentDate = new Date();
  selectedDate: Date | null = null;
  
  weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  days: CalendarDay[] = [];
  
  onChange: any = () => {};
  onTouched: any = () => {};

  constructor(private elementRef: ElementRef) {
    this.generateCalendar();
  }

  get currentMonthName(): string {
    return this.currentDate.toLocaleString('default', { month: 'short' });
  }

  get currentYear(): number {
    return this.currentDate.getFullYear();
  }

  get displayValue(): string {
    if (!this.selectedDate) return '';
    const d = this.selectedDate;
    return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
  }

  // Parses yyyy-mm-dd or javascript Date
  private parseDate(val: any): Date | null {
    if (!val) return null;
    if (val instanceof Date) return new Date(val);
    if (typeof val === 'string') {
      // expected format from backend or standard input type="date" is yyyy-mm-dd
      const parts = val.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  }

  private formatDateForEmit(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  writeValue(value: any): void {
    this.selectedDate = this.parseDate(value);
    if (this.selectedDate) {
      this.currentDate = new Date(this.selectedDate);
    } else {
      this.currentDate = new Date();
    }
    this.generateCalendar();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  togglePopup(event: Event) {
    if (this.disabled) return;
    event.stopPropagation();
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.selectedDate) {
      this.currentDate = new Date(this.selectedDate);
    } else if (this.isOpen) {
      this.currentDate = new Date();
    }
    if (this.isOpen) {
      this.generateCalendar();
    } else {
      this.onTouched();
    }
  }

  onDocumentClick(event: Event) {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
      this.onTouched();
    }
  }

  prevMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  isPrevMonthDisabled(): boolean {
    if (!this.minDate) return false;
    const min = this.parseDate(this.minDate);
    if (!min) return false;
    return this.currentDate.getFullYear() === min.getFullYear() && this.currentDate.getMonth() <= min.getMonth();
  }

  isNextMonthDisabled(): boolean {
    if (!this.maxDate) return false;
    const max = this.parseDate(this.maxDate);
    if (!max) return false;
    return this.currentDate.getFullYear() === max.getFullYear() && this.currentDate.getMonth() >= max.getMonth();
  }

  selectDate(day: CalendarDay) {
    if (day.isDisabled || !day.date) return;
    
    this.selectedDate = day.date;
    const emittedValue = this.formatDateForEmit(this.selectedDate);
    
    this.onChange(emittedValue);
    this.valueChange.emit(emittedValue);
    
    this.isOpen = false;
    this.onTouched();
    this.generateCalendar();
  }

  generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selected = this.selectedDate ? new Date(this.selectedDate) : null;
    if (selected) selected.setHours(0, 0, 0, 0);
    
    const min = this.parseDate(this.minDate);
    if (min) min.setHours(0, 0, 0, 0);
    
    const max = this.parseDate(this.maxDate);
    if (max) max.setHours(23, 59, 59, 999);

    this.days = [];
    
    // Empty days before the 1st
    for (let i = 0; i < firstDay; i++) {
      this.days.push({
        date: null,
        isToday: false,
        isSelected: false,
        isDisabled: true
      });
    }
    
    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      date.setHours(0, 0, 0, 0);
      
      let isDisabled = false;
      if (min && date < min) isDisabled = true;
      if (max && date > max) isDisabled = true;
      
      this.days.push({
        date: date,
        isToday: date.getTime() === today.getTime(),
        isSelected: selected ? date.getTime() === selected.getTime() : false,
        isDisabled: isDisabled
      });
    }
  }
}
