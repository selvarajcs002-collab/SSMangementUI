import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { ModalService } from '../../../core/services/modal.service';

export interface ToggleOption {
  label: string;
  value: string;
  icon: string;
}

export interface ToggleConfig {
  type: string;
  options: ToggleOption[];
}

@Component({
  selector: 'app-dynamic-toggle',
  standalone: true,
  imports: [CommonModule, SafeHtmlPipe],
  template: `
    <div class="toggle-container" [style.--options-count]="config?.options?.length || 2">
      <div class="toggle-pill" *ngIf="config">
        <button 
          *ngFor="let opt of config.options"
          class="toggle-btn" 
          [class.active]="value === opt.value"
          (click)="onOptionClick(opt.value)">
          <span class="icon" [innerHTML]="opt.icon | safeHtml"></span>
          <span class="label">{{ opt.label }}</span>
        </button>
        
        <div class="active-indicator" [style.transform]="getIndicatorTransform()"></div>
      </div>
    </div>
  `,
  styles: [`
    .toggle-container {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .toggle-pill {
      background: #F3F4F6;
      padding: 4px;
      border-radius: 999px;
      display: flex;
      position: relative;
      gap: 4px;
      border: 1px solid #E5E7EB;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .toggle-btn {
      border: none;
      background: transparent;
      padding: 8px 20px;
      border-radius: 999px;
      font-size: 14px;
      font-weight: 600;
      color: #64748B;
      cursor: pointer;
      position: relative;
      z-index: 1;
      transition: all 0.3s ease;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toggle-btn.active {
      color: #0F172A;
    }

    .toggle-btn .icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toggle-btn .icon ::ng-deep svg {
      width: 16px;
      height: 16px;
    }

    .active-indicator {
      position: absolute;
      top: 4px;
      left: 4px;
      bottom: 4px;
      width: calc(100% / var(--options-count) - 4px);
      background: #FFFFFF;
      border-radius: 999px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 0;
    }

    @media (max-width: 640px) {
      .toggle-btn {
        padding: 6px 12px;
        font-size: 13px;
      }
      .toggle-btn .label {
        display: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicToggleComponent {
  @Input() config: ToggleConfig | null = null;
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  constructor(private modalService: ModalService) {}

  async onOptionClick(newValue: string) {
    if (this.value === newValue) return;
    
    const confirmed = await this.modalService.showConfirmation({
      title: 'Are you sure?',
      message: 'Changing this will reset current data. Do you want to continue?'
    });

    if (confirmed) {
      this.value = newValue;
      this.valueChange.emit(this.value);
    }
  }

  getIndicatorTransform() {
    if (!this.config || !this.config.options) return 'translateX(0)';
    const index = this.config.options.findIndex(opt => opt.value === this.value);
    if (index === -1) return 'translateX(0)';
    return `translateX(calc(${index * 100}% + ${index * 4}px))`;
  }
}
