import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

@Component({
  selector: 'app-size-picker-modal',
  standalone: true,
  imports: [CommonModule, SafeHtmlPipe],
  templateUrl: './size-picker-modal.component.html',
  styleUrl: './size-picker-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SizePickerModalComponent implements OnInit {
  @Input() availableSizes: string[] = [];
  @Input() alreadySelected: string[] = [];
  @Output() confirm = new EventEmitter<string[]>();
  @Output() cancel = new EventEmitter<void>();

  selectedSizes: Set<string> = new Set();
  
  icons = {
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>`,
    x: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`
  };

  ngOnInit(): void {
    // Optionally pre-select sizes that are already in the list
    // this.alreadySelected.forEach(s => this.selectedSizes.add(s));
  }

  toggleSize(size: string): void {
    if (this.selectedSizes.has(size)) {
      this.selectedSizes.delete(size);
    } else {
      this.selectedSizes.add(size);
    }
  }

  toggleSelectAll(): void {
    if (this.selectedSizes.size === this.availableSizes.length) {
      this.selectedSizes.clear();
    } else {
      this.availableSizes.forEach(s => this.selectedSizes.add(s));
    }
  }

  isAllSelected(): boolean {
    return this.availableSizes.length > 0 && this.selectedSizes.size === this.availableSizes.length;
  }

  onConfirm(): void {
    this.confirm.emit(Array.from(this.selectedSizes));
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
