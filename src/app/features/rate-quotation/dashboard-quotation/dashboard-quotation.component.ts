import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { CustomSelectComponent } from '../../../shared/components/custom-select/custom-select.component';
import { RateQuotationService, RateQuotationModel } from '../../../core/services/rate-quotation.service';

@Component({
  selector: 'app-dashboard-quotation',
  templateUrl: './dashboard-quotation.component.html',
  styleUrls: ['./dashboard-quotation.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    CustomSelectComponent
  ]
})
export class DashboardQuotationComponent implements OnInit {
  displayedColumns: string[] = ['index', 'quoteNo', 'companyName', 'styleNo', 'embDesign', 'rate', 'date', 'actions'];
  dataSource = new MatTableDataSource<RateQuotationModel>([]);

  companyOptions = [
    { key: 'all', value: 'All Companies' },
    { key: 'acme', value: 'Acme Corp' },
    { key: 'globex', value: 'Globex' }
  ];

  statusOptions = [
    { key: 'all', value: 'All Status' },
    { key: 'approved', value: 'Approved' },
    { key: 'draft', value: 'Draft' }
  ];

  constructor(
    private router: Router, 
    private rateQuotationService: RateQuotationService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.fetchQuotations();
  }

  fetchQuotations(): void {
    this.rateQuotationService.getAllRateQuotations().subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          this.dataSource.data = response.data;
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error fetching rate quotations', error);
      }
    });
  }

  navigateToCreate() {
    this.router.navigate(['/dashboard/rate-quotation/create']);
  }

  editQuotation(id: number) {
    this.router.navigate(['/dashboard/rate-quotation/edit', id]);
  }
}
