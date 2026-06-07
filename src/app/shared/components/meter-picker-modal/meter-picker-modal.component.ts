import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

export interface AvailableMeter {
  meterValue: number;
  availableBits: number;
  availableMeter: number;
}

@Component({
  selector: 'app-meter-picker-modal',
  standalone: true,
  imports: [CommonModule, SafeHtmlPipe],
  templateUrl: './meter-picker-modal.component.html',
  styleUrl: './meter-picker-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeterPickerModalComponent implements OnInit {
  @Input() availableMeters: AvailableMeter[] = [];
  @Input() alreadySelected: number[] = [];
  @Output() confirm = new EventEmitter<AvailableMeter[]>();
  @Output() cancel = new EventEmitter<void>();

  selectedMeters: Set<number> = new Set();
  
  icons = {
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>`,
    x: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`
  };

  ngOnInit(): void {
    // Optionally pre-select meters already added
    // this.alreadySelected.forEach(m => this.selectedMeters.add(m));
  }

  toggleMeter(meterValue: number): void {
    if (this.selectedMeters.has(meterValue)) {
      this.selectedMeters.delete(meterValue);
    } else {
      this.selectedMeters.add(meterValue);
    }
  }

  toggleSelectAll(): void {
    if (this.selectedMeters.size === this.availableMeters.length) {
      this.selectedMeters.clear();
    } else {
      this.availableMeters.forEach(m => this.selectedMeters.add(m.meterValue));
    }
  }

  isAllSelected(): boolean {
    return this.availableMeters.length > 0 && this.selectedMeters.size === this.availableMeters.length;
  }

  onConfirm(): void {
    const selectedList = this.availableMeters.filter(m => this.selectedMeters.has(m.meterValue));
    this.confirm.emit(selectedList);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
