import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="message" [class]="type" class="alert animate-fade-in">
      <div class="alert-icon">
        <span *ngIf="type === 'success'">✅</span>
        <span *ngIf="type === 'error'">⚠️</span>
      </div>
      <div class="alert-content">
        {{ message }}
      </div>
      <button class="close-btn" (click)="close.emit()">
        &times;
      </button>
    </div>
  `,
  styles: [`
    .alert {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-radius: var(--radius);
      margin-bottom: 24px;
      position: relative;
      gap: 12px;
      border: 1px solid transparent;
    }

    .success {
      background: #ECFDF5;
      color: #065F46;
      border-color: #A7F3D0;
    }

    .error {
      background: #FEF2F2;
      color: #991B1B;
      border-color: #FECACA;
    }

    .alert-icon {
      font-size: 18px;
    }

    .alert-content {
      font-size: 14px;
      font-weight: 500;
      flex: 1;
    }

    .close-btn {
      background: transparent;
      border: none;
      font-size: 20px;
      padding: 4px;
      cursor: pointer;
      color: currentColor;
      opacity: 0.6;
      transition: opacity 0.2s;
    }

    .close-btn:hover {
      opacity: 1;
    }

    .animate-fade-in {
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AlertComponent {
  @Input() message: string | null = null;
  @Input() type: 'success' | 'error' = 'success';
  @Output() close = new EventEmitter<void>();
}
