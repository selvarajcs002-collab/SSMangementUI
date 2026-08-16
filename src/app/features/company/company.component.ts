import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OptionCardComponent } from '../../shared/components/option-card/option-card.component';

@Component({
  selector: 'app-company',
  standalone: true,
  imports: [CommonModule, OptionCardComponent],
  templateUrl: './company.component.html',
  styleUrl: './company.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyComponent {
  companyOptions = [
    {
      icon: '🏢➕',
      title: 'Add New Company',
      description: 'Create and add new company details',
      route: '/dashboard/company/add'
    },
    {
      icon: '🏢✏️',
      title: 'Update Company',
      description: 'Edit and update existing company information',
      route: '/dashboard/company/update/123'
    }
  ];
}
