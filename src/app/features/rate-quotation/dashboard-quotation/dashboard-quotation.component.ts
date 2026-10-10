import { Component, OnInit, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { RateQuotationService, RateQuotationModel } from '../../../core/services/rate-quotation.service';
import { MessageService } from '../../../core/services/message.service';

@Component({
  selector: 'app-dashboard-quotation',
  templateUrl: './dashboard-quotation.component.html',
  styleUrls: ['./dashboard-quotation.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule
  ]
})
export class DashboardQuotationComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['index', 'quoteNo', 'companyName', 'styleNo', 'embDesign', 'date', 'actions'];
  dataSource = new MatTableDataSource<RateQuotationModel>([]);
  allQuotations: RateQuotationModel[] = [];
  searchQuery = '';
  companyFilter = '';
  statusFilter = '';
  fromDate = '';
  toDate = '';
  companyNames: string[] = [];
  statusNames: string[] = [];

  get filteredCount(): number {
    return this.dataSource.data.length;
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private router: Router, 
    private rateQuotationService: RateQuotationService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.fetchQuotations();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  fetchQuotations(): void {
    this.rateQuotationService.getAllRateQuotations().subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          this.allQuotations = response.data;
          this.companyNames = Array.from(new Set(response.data.map(item => item.companyName).filter(Boolean))).sort();
          this.statusNames = Array.from(new Set(response.data.map(item => item.status).filter(Boolean))).sort();
          this.applyFilter();
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error fetching rate quotations', error);
      }
    });
  }

  applyFilter(): void {
    const query = this.searchQuery.trim().toLowerCase();
    this.dataSource.data = this.allQuotations.filter(item => {
      const haystack = [item.quotationNo, item.companyName, item.styleNo, item.designName]
        .join(' ')
        .toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const matchesCompany = !this.companyFilter || item.companyName === this.companyFilter;
      const matchesStatus = !this.statusFilter || item.status === this.statusFilter;
      const quoteDate = item.quotationDate ? item.quotationDate.slice(0, 10) : '';
      const matchesFrom = !this.fromDate || quoteDate >= this.fromDate;
      const matchesTo = !this.toDate || quoteDate <= this.toDate;
      return matchesQuery && matchesCompany && matchesStatus && matchesFrom && matchesTo;
    });
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.companyFilter = '';
    this.statusFilter = '';
    this.fromDate = '';
    this.toDate = '';
    this.applyFilter();
  }

  navigateToCreate() {
    this.router.navigate(['/dashboard/rate-quotation/create']);
  }

  editQuotation(id: number) {
    this.router.navigate(['/dashboard/rate-quotation/edit', id]);
  }

  deleteQuotation(id: number) {
    if (confirm('Are you sure you want to delete this rate quotation?')) {
      this.rateQuotationService.deleteRateQuotation(id).subscribe({
        next: (response) => {
          if (response && response.success) {
            this.messageService.success('Rate Quotation deleted successfully.');
            this.fetchQuotations(); // Refresh the table
          } else {
            this.messageService.error(response?.message || 'Failed to delete rate quotation.');
          }
        },
        error: (error) => {
          console.error('Error deleting rate quotation', error);
          this.messageService.error('An error occurred while deleting the quotation.');
        }
      });
    }
  }
}
