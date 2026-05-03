import { Component } from '@angular/core';

@Component({
  selector: 'app-dc-filter-header',
  standalone: true,
  template: `
    <div class="header-container">
      <h1 class="status-title">Status</h1>
      <p class="status-subtitle">Track inward and outward activities</p>
    </div>
  `,
  styles: [`
    .header-container {
      margin-bottom: 32px;
      padding-left: 4px;
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
      margin-top: 4px;
      font-weight: 500;
    }
  `],
})
export class DcFilterHeaderComponent {}
