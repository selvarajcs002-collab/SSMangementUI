import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dc-filter-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="header-container">
      <div class="header-icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      </div>
      <div class="title-group">
        <div class="title-row">
          <h1 class="status-title">Delivery Challan</h1>
          <button
            type="button"
            class="info-trigger"
            (click)="showInfo = !showInfo"
            title="Find a challan, check quantities, print for client, or edit entries"
            aria-label="About Delivery Challan register">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="M12 8h.01"/>
            </svg>
          </button>
        </div>
        <p class="status-subtitle" *ngIf="showInfo">
          Find a challan, check the quantities, then print it for the client or correct the entry.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .header-container {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 0;
    }
    .header-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: #EFF6FF;
      color: #2563EB;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 1px solid #DBEAFE;
    }
    .title-group {
      display: flex;
      flex-direction: column;
    }
    .title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .status-title {
      font-size: 24px;
      font-weight: 700;
      color: #0F172A;
      margin: 0;
      letter-spacing: -0.025em;
      line-height: 1.2;
    }
    .info-trigger {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: none;
      background: transparent;
      color: #94A3B8;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
      transition: all 0.15s ease;
    }
    .info-trigger:hover {
      background: #E2E8F0;
      color: #1E293B;
    }
    .status-subtitle {
      font-size: 13px;
      color: #64748B;
      margin: 4px 0 0;
      font-weight: 500;
      line-height: 1.4;
    }
  `],
})
export class DcFilterHeaderComponent {
  showInfo = false;
}
