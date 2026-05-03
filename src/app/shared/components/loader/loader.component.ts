import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loader-overlay" *ngIf="loaderService.isLoading$ | async">
      <div class="loader-content">
        <div class="loader-mark">
          <div class="spinner"></div>
        </div>
        <p class="loader-text">Loading, please wait...</p>
      </div>
    </div>
  `,
  styles: [`
    .loader-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.18s ease-out;
    }

    .loader-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 28px 32px;
      background: rgba(255, 255, 255, 0.88);
      border: 1px solid rgba(226, 232, 240, 0.9);
      border-radius: 16px;
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.14);
      animation: loaderPop 0.24s ease-out;
    }

    .loader-mark {
      width: 64px;
      height: 64px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #EFF6FF, #E0F2FE);
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #DBEAFE;
      border-top: 4px solid #3B82F6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .loader-text {
      font-size: 16px;
      font-weight: 600;
      color: #1E293B;
      margin: 0;
      letter-spacing: 0;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes loaderPop {
      from { opacity: 0; transform: translateY(8px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `]
})
export class LoaderComponent {
  constructor(public loaderService: LoaderService) {}
}
