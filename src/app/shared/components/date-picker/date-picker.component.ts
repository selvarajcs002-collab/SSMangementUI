import { Component, Input, Output, EventEmitter, OnInit, ElementRef, HostListener, forwardRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true
    }
  ],
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.scss'
})
export class DatePickerComponent implements ControlValueAccessor, OnInit {
  @Input() id: string = 'date-picker-' + Math.random().toString(36).substr(2, 9);
  @Input() label: string = '';
  @Input() required: boolean = false;
  @Input() placeholder: string = 'Select date';
  @Input() error: string | null = null;
  @Input() disabled: boolean = false;

  @Output() valueChange = new EventEmitter<string>();

  private _value: string = '';

  @Input()
  get value(): string {
    return this._value;
  }

  set value(val: string) {
    this._value = val || '';
    this.formatDisplayValue();
    this.cdr.markForCheck();
  }

  displayValue: string = '';
  isOpen: boolean = false;

  currentYear: number = new Date().getFullYear();
  currentMonth: number = new Date().getMonth();

  gridDays: any[] = [];
  weekdays: string[] = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Year options for dropdown (current year +/- 5)
  yearOptions: number[] = [];

  onChange: any = () => {};
  onTouched: any = () => {};

  constructor(private elementRef: ElementRef, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth();
    this.generateCalendar();
    const start = this.currentYear - 5;
    for (let i = 0; i < 12; i++) {
      this.yearOptions.push(start + i);
    }
  }

  // Handlers for dropdown changes (ngModel already updates currentMonth/currentYear)
  onMonthChange(event: any) {
    this.generateCalendar();
  }

  // Inline year stepper handler
  changeYear(delta: number) {
    this.currentYear += delta;
    this.generateCalendar();
  }

  onYearChange(event: any) {
    this.generateCalendar();
  }

  toggleCalendar() {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      if (this._value) {
        const d = new Date(this._value);
        if (!isNaN(d.getTime())) {
          this.currentYear = d.getFullYear();
          this.currentMonth = d.getMonth();
        }
      }
      this.generateCalendar();
    }
  }

  prevMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.generateCalendar();
  }

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.generateCalendar();
  }

  selectDate(item: any) {
    if (item.isDisabled) return;
    const d = new Date(item.year, item.month, item.day);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    this._value = `${year}-${month}-${day}`;
    this.formatDisplayValue();
    this.onChange(this._value);
    this.valueChange.emit(this._value);
    this.onTouched();
    this.isOpen = false;
    this.generateCalendar();
    this.cdr.markForCheck();
  }

  // Quick action: today
  selectToday(event: MouseEvent) {
    event.stopPropagation();
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this._value = `${year}-${month}-${day}`;
    this.formatDisplayValue();
    this.onChange(this._value);
    this.valueChange.emit(this._value);
    this.onTouched();
    this.isOpen = false;
    this.generateCalendar();
    this.cdr.markForCheck();
  }

  // Quick action: clear
  clearValue(event: MouseEvent) {
    event.stopPropagation();
    this._value = '';
    this.formatDisplayValue();
    this.onChange(this._value);
    this.valueChange.emit(this._value);
    this.onTouched();
    this.isOpen = false;
    this.generateCalendar();
    this.cdr.markForCheck();
  }

  generateCalendar() {
    const year = this.currentYear;
    const month = this.currentMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const prefixCount = firstDay === 0 ? 6 : firstDay - 1;
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    const days: any[] = [];
    // previous month padding
    for (let i = prefixCount - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      let pm = month - 1;
      let py = year;
      if (pm < 0) { pm = 11; py--; }
      days.push(this.createDayObject(d, pm, py, false));
    }
    // current month
    for (let d = 1; d <= totalDays; d++) {
      days.push(this.createDayObject(d, month, year, true));
    }
    // next month padding to make 42 cells
    const suffixCount = 42 - days.length;
    for (let d = 1; d <= suffixCount; d++) {
      let nm = month + 1;
      let ny = year;
      if (nm > 11) { nm = 0; ny++; }
      days.push(this.createDayObject(d, nm, ny, false));
    }
    this.gridDays = days;
    this.cdr.markForCheck();
  }

  private createDayObject(day: number, month: number, year: number, isCurrentMonth: boolean) {
    const isWeekend = this.checkIsWeekend(year, month, day);
    const isToday = this.checkIsToday(year, month, day);
    const isSelected = this.checkIsSelected(year, month, day);
    return { day, month, year, isCurrentMonth, isWeekend, isToday, isSelected, isDisabled: false };
  }

  private checkIsWeekend(year: number, month: number, day: number): boolean {
    const d = new Date(year, month, day).getDay();
    return d === 0 || d === 6;
  }

  private checkIsToday(year: number, month: number, day: number): boolean {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  }

  private checkIsSelected(year: number, month: number, day: number): boolean {
    if (!this.value) return false;
    const sel = new Date(this.value);
    return sel.getDate() === day && sel.getMonth() === month && sel.getFullYear() === year;
  }

  private formatDisplayValue() {
    if (!this.value) { this.displayValue = ''; return; }
    const parts = this.value.split('-');
    if (parts.length !== 3) { this.displayValue = this.value; return; }
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (isNaN(d.getTime())) { this.displayValue = this.value; return; }
    this.displayValue = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
      this.cdr.markForCheck();
    }
  }

  writeValue(value: any): void { this.value = value || ''; this.formatDisplayValue(); this.cdr.markForCheck(); }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; this.cdr.markForCheck(); }
}
