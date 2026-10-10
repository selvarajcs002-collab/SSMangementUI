import { Component } from '@angular/core';

@Component({
  selector: 'app-dc-filter-header',
  standalone: true,
  template: `
    <div class="header-container">
      <p class="eyebrow">Delivery register</p>
      <h1 class="status-title">Delivery Challan</h1>
      <p class="status-subtitle">Find a challan, check the quantities, then print it for the client or correct the entry.</p>
    </div>
  `,
  styles: [`
    .header-container {
      margin-bottom: 0;
      padding-left: 4px;
      max-width: 640px;
    }
    .eyebrow {
      margin: 0 0 6px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #3B82F6;
    }
    .status-title {
      font-size: 32px;
      font-weight: 700;
      color: #1E293B;
      margin: 0;
      letter-spacing: -0.025em;
    }
    .status-subtitle {
      font-size: 15px;
      color: #64748B;
      margin: 6px 0 0;
      font-weight: 500;
      line-height: 1.5;
    }
  `],
})
export class DcFilterHeaderComponent { }
