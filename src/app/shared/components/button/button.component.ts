import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || isLoading"
      [class]="variant"
      [class.loading]="isLoading"
      [class.full-width]="fullWidth"
      (click)="onClick($event)"
      class="btn"
    >
      <span class="btn-content" [class.hidden]="isLoading">
        <ng-content></ng-content>
        {{ label }}
      </span>
      <div class="spinner" *ngIf="isLoading"></div>
    </button>
  `,
  styles: [`
    .btn {
      height: 48px;
      padding: 0 32px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      border: 2px solid transparent;
      outline: none;
      gap: 8px;
    }

    .primary {
      background: var(--primary);
      color: #FFFFFF;
      box-shadow: 0 4px 10px rgba(66, 165, 245, 0.25);
    }

    .primary:hover:not(:disabled) {
      background: var(--primary-hover);
      transform: translateY(-1px);
      box-shadow: 0 6px 15px rgba(66, 165, 245, 0.3);
    }

    .primary:active:not(:disabled) {
      transform: translateY(0);
    }

    .secondary {
      background: #FFFFFF;
      color: var(--text-main);
      border: 1px solid var(--border);
    }

    .secondary:hover:not(:disabled) {
      background: #F8FAFC;
      border-color: #CBD5E1;
    }

    .ghost {
      background: transparent;
      color: var(--text-muted);
      border: 1px solid var(--border);
    }

    .ghost:hover:not(:disabled) {
      background: rgba(0, 0, 0, 0.02);
      color: var(--text-main);
      border-color: #CBD5E1;
    }

    .full-width {
      width: 100%;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      box-shadow: none !important;
    }

    .loading {
      cursor: wait;
    }

    .btn-content.hidden {
      visibility: hidden;
    }

    .spinner {
      width: 22px;
      height: 22px;
      border: 2.5px solid rgba(255, 255, 255, 0.3);
      border-top-color: #FFFFFF;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      position: absolute;
    }

    .secondary .spinner, .ghost .spinner {
      border-color: rgba(15, 23, 42, 0.1);
      border-top-color: var(--primary);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ButtonComponent {
  @Input() label: string = '';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'ghost' = 'primary';
  @Input() isLoading: boolean = false;
  @Input() disabled: boolean = false;
  @Input() fullWidth: boolean = false;
  @Output() btnClick = new EventEmitter<MouseEvent>();

  onClick(event: MouseEvent) {
    if (!this.disabled && !this.isLoading) {
      this.btnClick.emit(event);
    }
  }
}
