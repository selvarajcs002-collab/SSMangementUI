import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OptionCardComponent } from '../../shared/components/option-card/option-card.component';

@Component({
  selector: 'app-company',
  standalone: true,
  imports: [CommonModule, RouterModule, OptionCardComponent],
  templateUrl: './company.component.html',
  styleUrl: './company.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyComponent {
  companyOptions = [
    {
      icon: '🏢➕',
      badge: 'CREATE PROFILE',
      title: 'Add New Company',
      description: 'Register a new client company with GSTIN, billing address, and multiple delivery locations.',
      cta: 'Create Company',
      accent: 'blue',
      route: '/dashboard/company/add'
    },
    {
      icon: '🏢✏️',
      badge: 'MODIFY EXISTING',
      title: 'Update Company',
      description: 'Search and edit existing company names, GST numbers, contact details, or delivery branches.',
      cta: 'Edit Company',
      accent: 'indigo',
      route: '/dashboard/company/update'
    }
  ];
}
