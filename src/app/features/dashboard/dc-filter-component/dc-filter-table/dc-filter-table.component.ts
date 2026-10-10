import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';

export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

import { CommonModule } from '@angular/common';
import { SafeHtmlPipe } from '../../../../shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-dc-filter-table',
  standalone: true,
  imports: [CommonModule, SafeHtmlPipe],
  templateUrl: './dc-filter-table.component.html',
  styleUrl: './dc-filter-table.component.scss',
})
export class DcFilterTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() totalRecords: number = 0;
  @Input() currentPage: number = 1;
  @Input() pageSize: number = 10;
  @Input() showViewAction: boolean = true;
  @Input() showPrintAction: boolean = false;
  @Input() title: string = 'Challans';
  @Input() subtitle: string = '';
  @Input() viewTitle: string = 'View';
  @Input() expandedId: string | number | null = null;

  @Output() view = new EventEmitter<any>();
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() expandToggle = new EventEmitter<string | number | null>();

  showColumnDropdown = false;
  hiddenColumns: Set<string> = new Set();
  copiedKey: string | number | null = null;
  specialKeys = ['sno', 'bitsCount', 'totalMeter', 'authorizedBy', 'action', 'dcNo', 'entryKind'];

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.column-toggle-wrapper')) {
      this.showColumnDropdown = false;
    }
  }

  get visibleColumns(): TableColumn[] {
    return this.columns.filter(c => !this.hiddenColumns.has(c.key));
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.showColumnDropdown = !this.showColumnDropdown;
  }

  toggleColumn(key: string, event: Event): void {
    if (key === 'action' || key === 'sno') return;
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.hiddenColumns.delete(key);
    } else {
      this.hiddenColumns.add(key);
    }
  }

  rowKey(row: any): string | number {
    return row?.fullData?.id ?? row?.fullData?.Id ?? row?.dcNo ?? '';
  }

  isExpanded(row: any): boolean {
    return this.expandedId != null && String(this.expandedId) === String(this.rowKey(row));
  }

  toggleExpand(row: any): void {
    const key = this.rowKey(row);
    this.expandToggle.emit(this.isExpanded(row) ? null : key);
  }

  lineItems(row: any): { primary: string; secondary: string }[] {
    const details = row?.fullData?.details || row?.fullData?.Details || [];
    if (!Array.isArray(details)) return [];
    return details.map((detail: any) => {
      const size = detail.size ?? detail.Size;
      const count = detail.count ?? detail.Count;
      const meter = detail.meterValue ?? detail.MeterValue;
      const bits = detail.bitsCount ?? detail.BitsCount;
      const total = detail.totalMeter ?? detail.TotalMeter;
      if (size) {
        return { primary: String(size), secondary: `${count ?? 0} pcs` };
      }
      const meterText = meter != null && meter !== '' ? `${Number(meter).toFixed(2)} m / bit` : 'Meter';
      const bitsText = bits != null && bits !== '' ? `${bits} bits` : '';
      const totalText = total != null && total !== '' ? `${Number(total).toFixed(2)} m total` : '';
      return { primary: meterText, secondary: [bitsText, totalText].filter(Boolean).join(' · ') || '—' };
    });
  }

  lineSummary(row: any): string {
    if (!this.lineItems(row).length) return '';
    if (row.entryKind === 'Meter' || (Number(row.totalMeter) > 0 && row.entryKind !== 'Size')) {
      return `Total meter ${Number(row.totalMeter || 0).toFixed(2)}`;
    }
    return `Total pieces ${Number(row.bitsCount || 0)}`;
  }

  copyDc(row: any, event: Event): void {
    event.stopPropagation();
    const value = String(row?.dcNo || '');
    if (!value || value === '-') return;
    const done = () => {
      this.copiedKey = this.rowKey(row);
      setTimeout(() => {
        if (this.copiedKey === this.rowKey(row)) this.copiedKey = null;
      }, 1500);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(value).then(done).catch(() => this.fallbackCopy(value, done));
      return;
    }
    this.fallbackCopy(value, done);
  }

  private fallbackCopy(value: string, done: () => void): void {
    const area = document.createElement('textarea');
    area.value = value;
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    document.body.removeChild(area);
    done();
  }

  Math = Math;

  icons = {
    view: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
    edit: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`,
    delete: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
    settings: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`
  };

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.currentPage;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push(-1); // Dots

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (current < total - 2) pages.push(-1); // Dots
      pages.push(total);
    }
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  onView(row: any): void {
    this.view.emit(row);
  }

  onEdit(row: any): void {
    this.edit.emit(row);
  }

  onDelete(row: any): void {
    this.delete.emit(row);
  }
}
