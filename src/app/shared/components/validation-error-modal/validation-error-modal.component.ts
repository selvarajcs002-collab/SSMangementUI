import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-validation-error-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal-content animate-slide-up" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="title-with-icon">
            <span class="error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </span>
            <h2>{{ title }}</h2>
          </div>
          <button class="btn-close-header" (click)="onClose()" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="error-list">
            <div *ngFor="let line of errorLines" class="error-item">
              <span class="bullet"></span>
              <p class="error-text">{{ line }}</p>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-primary" (click)="onClose()">Dismiss</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-content {
      background: #FFFFFF;
      width: 100%;
      max-width: 500px;
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.1);
      overflow: hidden;
    }

    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid #F1F5F9;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #FFF5F5;

      .title-with-icon {
        display: flex;
        align-items: center;
        gap: 12px;

        .error-icon {
          color: #EF4444;
          display: flex;
        }

        h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #B91C1C;
        }
      }
    }

    .btn-close-header {
      border: none;
      background: transparent;
      color: #94A3B8;
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      transition: all 0.2s;

      &:hover {
        background: rgba(0, 0, 0, 0.05);
        color: #64748B;
      }
    }

    .modal-body {
      padding: 24px;
      max-height: 400px;
      overflow-y: auto;
    }

    .error-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .error-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background: #FEF2F2;
      border-radius: 8px;
      border-left: 4px solid #EF4444;

      .bullet {
        margin-top: 8px;
        width: 6px;
        height: 6px;
        background: #EF4444;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .error-text {
        margin: 0;
        font-size: 14px;
        line-height: 1.6;
        color: #450A0A;
        font-weight: 500;
      }
    }

    .modal-footer {
      padding: 16px 24px;
      background: #F8FAFC;
      border-top: 1px solid #F1F5F9;
      display: flex;
      justify-content: flex-end;
    }

    .btn-primary {
      background: #1E293B;
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #0F172A;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      &:active {
        transform: translateY(0);
      }
    }

    .animate-slide-up {
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidationErrorModalComponent {
  @Input() title: string = 'Validation Error';
  @Input() errorLines: string[] = [];
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }
}
