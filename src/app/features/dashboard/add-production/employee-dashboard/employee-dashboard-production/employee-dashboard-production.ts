import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employee-dashboard-production',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-dashboard-production.html',
  styleUrl: './employee-dashboard-production.scss',
})
export class EmployeeDashboardProduction {
  recentLogs = [
    { date: '2026-07-23', shift: 'Shift A', style: 'T-Shirt V-Neck', machine: 'Machine #EP-902', producedUnits: 200, targetUnits: 200, efficiency: '100%' },
    { date: '2026-07-23', shift: 'Shift A', style: 'Hoodie Basic', machine: 'Machine #EP-903', producedUnits: 150, targetUnits: 160, efficiency: '93.7%' },
    { date: '2026-07-23', shift: 'Shift B', style: 'Polo Shirt', machine: 'Machine #EP-902', producedUnits: 290, targetUnits: 300, efficiency: '96.6%' },
    { date: '2026-07-23', shift: 'Shift C', style: 'Denim Jacket', machine: 'Machine #EP-905', producedUnits: 110, targetUnits: 120, efficiency: '91.6%' }
  ];
}
