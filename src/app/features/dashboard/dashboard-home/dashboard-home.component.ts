import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OptionCardComponent } from '../../../shared/components/option-card/option-card.component';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, OptionCardComponent],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardHomeComponent {
  options = [
    {
      icon: '🏢',
      title: 'Add Company Details',
      description: 'Manage company information, addresses, and primary contact details',
      route: '/dashboard/company'
    },
    {
      icon: '⬇️',
      title: 'InWard',
      description: 'Track and log all incoming shipments, materials, and inventory items',
      route: '/dashboard/inward'
    },
    {
      icon: '⬆️',
      title: 'OutWard',
      description: 'Process and monitor all outgoing orders, shipments, and dispatches',
      route: '/dashboard/outward'
    },
    {
      icon: '👤',
      title: 'Add Employee',
      description: 'Onboard new staff, manage employee records, and assign roles',
      route: '/dashboard/employee'
    },
    {
      icon: '📁',
      title: 'Documents',
      description: 'Securely store, organize, and access important company documents',
      route: '/documents'
    },
    {
      icon: '🚚',
      title: 'Delivery Challan',
      description: 'Monitor delivery statuses, view logistics data, and manage couriers',
      route: '/dashboard/delivery-challan'
    },
    {
      icon: '📊',
      title: 'Status',
      description: 'View real-time system health, operational metrics, and activity logs',
      route: '/status'
    },
    {
      icon: '📄',
      title: 'Rate Quotation',
      description: 'Create and manage price quotations for embroidery designs',
      route: '/dashboard/rate-quotation/dashboard'
    },
    {
      icon: '📦',
      title: 'Stock Management',
      description: 'View stock balances and track last transactions',
      route: '/dashboard/stock-management'
    }
  ];
}
