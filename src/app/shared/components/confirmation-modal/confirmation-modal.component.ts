import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Full-screen Overlay -->
    <div class="modal-backdrop" (click)="onCancel.emit()"></div>
    
    <!-- Centered Modal Container -->
    <div class="modal-wrapper animate-modal">
      <div class="modal-inner">
        <h2 class="modal-title">{{ title }}</h2>
        <p class="modal-message">{{ message }}</p>
        
        <div class="modal-actions">
          <button class="btn btn-secondary" (click)="onCancel.emit()">{{ cancelLabel }}</button>
          <button class="btn btn-primary" (click)="onConfirm.emit()">{{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 999;
      cursor: default;
    }

    .modal-wrapper {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 480px;
      max-width: 90%;
      z-index: 1000;
      pointer-events: none;
    }

    .modal-inner {
      background: #FFFFFF;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      pointer-events: auto;
      text-align: center;
    }

    .modal-title {
      font-size: 22px;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 12px;
    }

    .modal-message {
      font-size: 16px;
      color: #64748B;
      line-height: 1.6;
      margin-bottom: 32px;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
    }

    .btn {
      flex: 1;
      height: 48px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;
    }

    .btn-secondary {
      background: #F1F5F9;
      color: #475569;
    }

    .btn-secondary:hover {
      background: #E2E8F0;
    }

    .btn-primary {
      background: #3B82F6;
      color: #FFFFFF;
    }

    .btn-primary:hover {
      background: #2563EB;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
    }

    .animate-modal {
      animation: modalFadeInScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes modalFadeInScale {
      from { 
        opacity: 0; 
        transform: translate(-50%, -45%) scale(0.95); 
      }
      to { 
        opacity: 1; 
        transform: translate(-50%, -50%) scale(1); 
      }
    }

    @media (max-width: 640px) {
      .modal-inner {
        padding: 24px;
      }
    }
  `]
})
export class ConfirmationModalComponent implements OnInit, OnDestroy {
  @Input() title: string = 'Are you sure?';
  @Input() message: string = 'Do you want to continue?';
  @Input() confirmLabel: string = 'OK';
  @Input() cancelLabel: string = 'Cancel';
  
  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }
}



