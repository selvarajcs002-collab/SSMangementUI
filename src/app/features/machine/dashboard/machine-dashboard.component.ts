import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-machine-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './machine-dashboard.component.html',
  styleUrls: ['./machine-dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MachineDashboardComponent {
  kpiCards = [
    { title: 'Total Machines', count: '48', trend: '+2', trendUp: true, icon: 'precision_manufacturing', color: 'blue' },
    { title: 'Running Now', count: '42', trend: '88%', trendUp: true, icon: 'play_circle', color: 'green' },
    { title: 'Maintenance', count: '4', trend: '-1', trendUp: false, icon: 'build', color: 'orange' },
    { title: 'Downtime', count: '2', trend: '4.2%', trendUp: false, icon: 'error', color: 'red' },
    { title: 'Efficiency (OEE)', count: '92%', trend: '+3.5%', trendUp: true, icon: 'speed', color: 'purple' },
    { title: 'Output Today', count: '12.5k', trend: '+12%', trendUp: true, icon: 'inventory_2', color: 'indigo' },
    { title: 'Critical Alerts', count: '3', trend: 'Urgent', trendUp: false, icon: 'warning', color: 'amber' },
    { title: 'Service Due', count: '5', trend: 'Next 7d', trendUp: true, icon: 'event', color: 'cyan' }
  ];

  recentAlerts = [
    { id: 'AL-102', machine: 'CNC-01', message: 'Vibration threshold exceeded', time: '10 mins ago', severity: 'high' },
    { id: 'AL-103', machine: 'LATH-04', message: 'Coolant level low', time: '25 mins ago', severity: 'medium' },
    { id: 'AL-104', machine: 'MILL-02', message: 'Motor temperature warning', time: '1 hr ago', severity: 'medium' }
  ];

  aiInsights = [
    { title: 'Predictive Maintenance', message: 'Machine CNC-05 shows 85% probability of bearing failure in next 48 hours.', action: 'Schedule Check' },
    { title: 'Efficiency Boost', message: 'Optimizing operator rotation on Line B could increase output by 8.5%.', action: 'View Plan' }
  ];
}
