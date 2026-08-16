import { Component, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { EmployeeService } from '../../core/services/employee.service';
import { finalize } from 'rxjs/operators';
import packageJson from '../../../../package.json';

export interface PayrollRecord {
  id: string;
  name: string;
  photo: string;
  designation: string;
  baseSalary: number;
  incentive: number;
  workingDays: number;
  absentDays: number;
  lastPayoutDate: string;
}

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './payroll.component.html',
  styleUrls: ['./payroll.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('staggerCards', [
      transition(':enter', [
        query('.employee-card', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(50, [
            animate('0.4s cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('fadeScale', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('0.2s ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('0.15s ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ])
  ]
})
export class PayrollComponent implements OnInit {
  isSidebarCollapsed = signal(false);

  employees = signal<PayrollRecord[]>([]);
  isLoading = signal(false);

  searchQuery = signal('');
  filteredEmployees = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.employees().filter(e => e.name.toLowerCase().includes(query) || e.id.toLowerCase().includes(query));
  });

  stats = computed(() => {
    const emps = this.employees();
    const totalPayout = emps.reduce((acc, curr) => acc + this.calculateNetPay(curr), 0);
    const avgSalary = totalPayout / emps.length;
    const maxIncentive = Math.max(...emps.map(e => e.incentive));
    return {
      totalPayout,
      avgSalary,
      maxIncentive
    };
  });

  selectedEmployee = signal<PayrollRecord | null>(null);
  isModalOpen = signal(false);
  lastSaved = signal<Date | null>(null);
  daysInMonth = computed(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  });

  completedStatus = signal<Record<string, number>>({});
  currentTime = signal(Date.now());

  constructor(private employeeService: EmployeeService) { }

  ngOnInit(): void {
    this.loadPayrollData();

    const saved = localStorage.getItem('payroll_completed_status');
    if (saved) {
      this.completedStatus.set(JSON.parse(saved));
    }

    setInterval(() => {
      this.currentTime.set(Date.now());
    }, 1000);
  }

  loadPayrollData() {
    this.isLoading.set(true);
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    this.employeeService.getPayrollSummary(month, year).subscribe({
      next: (data: any[]) => {
        this.employees.set(data.map((e: any) => ({
          id: e.employeeId,
          name: e.fullName,
          designation: e.designation,
          photo: '', // No longer used, using initials instead
          baseSalary: e.monthlySalary,
          incentive: e.baseIncentive,
          workingDays: e.presentDays,
          absentDays: this.daysInMonth() - e.presentDays,
          lastPayoutDate: '2026-04-30' // Could be dynamic if added to SP
        })));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  calculateNetPay(emp: PayrollRecord): number {
    const dailyRate = emp.baseSalary / this.daysInMonth();
    const baseEarned = dailyRate * emp.workingDays;
    return Math.round(baseEarned + emp.incentive);
  }

  openPayrollModal(emp: PayrollRecord) {
    this.selectedEmployee.set({ ...emp });
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedEmployee.set(null);
  }

  updateIncentive(event: any) {
    const amount = Number(event.target.value);
    const emp = this.selectedEmployee();
    if (emp) {
      this.selectedEmployee.set({ ...emp, incentive: amount });
    }
  }

  savePayroll() {
    const updated = this.selectedEmployee();
    if (updated) {
      this.employees.update(list => list.map(e => e.id === updated.id ? updated : e));
      this.lastSaved.set(new Date());
      this.closeModal();
    }
  }

  markCompleted() {
    const emp = this.selectedEmployee();
    if (emp) {
      const duration = (packageJson as any).config?.payrollStatusDuration || 120000;
      const expiration = Date.now() + duration;
      const newStatus = { ...this.completedStatus(), [emp.id]: expiration };
      this.completedStatus.set(newStatus);
      localStorage.setItem('payroll_completed_status', JSON.stringify(newStatus));
      this.closeModal();
    }
  }

  isCompleted(id: string): boolean {
    const expiration = this.completedStatus()[id];
    return expiration ? this.currentTime() < expiration : false;
  }

  printVoucher() {
    window.print();
  }

  menuItems = [
    { label: 'Dashboard', icon: 'grid_view', active: false, route: '/dashboard' },
    { label: 'New Registration', icon: 'person_add', active: false, route: '/dashboard/employee' },
    { label: 'Attendance', icon: 'calendar_today', active: false, route: '/dashboard/employee/attendance' },
    { label: 'Payroll', icon: 'payments', active: true, route: '/dashboard/payroll' },
    { label: 'Shift Management', icon: 'schedule', active: false, route: '/dashboard/shifts' },
    { label: 'Reports', icon: 'bar_chart', active: false, route: '/dashboard/employee/reports' }
  ];

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(v => !v);
  }

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
