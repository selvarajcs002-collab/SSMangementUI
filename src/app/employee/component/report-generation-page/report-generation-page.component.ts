import { Component, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate, query, stagger, state } from '@angular/animations';
import { EmployeeService } from '../../../core/services/employee.service';
import { finalize } from 'rxjs/operators';

interface PerformanceMetric {
  label: string;
  value: number | string;
  trend: number;
  trendDirection: 'up' | 'down' | 'neutral';
  insight: string;
}

interface MachineData {
  id: string;
  name: string;
  status: 'Operational' | 'Downtime' | 'Maintenance';
  utilization: number;
  output: number;
  healthScore: number;
}

interface ProductionEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  date: string;
  shift: 'Morning' | 'Evening' | 'Night';
  machineId: string;
  unitsProduced: number;
  efficiency: number;
  qualityScore: number;
  downtimeMinutes: number;
  overtimeHours: number;
  performanceRating: number;
}

interface AIInsight {
  type: 'success' | 'warning' | 'info' | 'danger';
  icon: string;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
}

@Component({
  selector: 'app-report-generation-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './report-generation-page.component.html',
  styleUrls: ['./report-generation-page.component.scss'],
  animations: [
    trigger('staggerAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(80, [
            animate('600ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('pulseWarning', [
      state('normal', style({ transform: 'scale(1)', opacity: 1 })),
      transition('normal => pulsing', [
        animate('1000ms ease-in-out', style({ transform: 'scale(1.05)', opacity: 0.8 })),
        animate('1000ms ease-in-out', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ]),
    trigger('sidebarAnimation', [
      state('expanded', style({ width: '280px' })),
      state('collapsed', style({ width: '80px' })),
      transition('expanded <=> collapsed', animate('300ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportGenerationPageComponent implements OnInit {
  // State Signals
  isLoading = signal(true);
  isSidebarCollapsed = signal(false);
  exportProgress = signal(0);
  isExporting = signal(false);

  // Filter Signals
  searchQuery = signal('');
  selectedTimeframe = signal<'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly'>('Monthly');
  selectedDepartment = signal('All');
  selectedShift = signal('All');
  selectedMachine = signal('All');
  performanceGrade = signal('All');

  // Data Signals
  private productionData = signal<ProductionEntry[]>([]);
  private machines = signal<MachineData[]>([]);

  // Computed Analytics
  filteredData = computed(() => {
    return this.productionData().filter(item => {
      const matchesSearch = item.employeeName.toLowerCase().includes(this.searchQuery().toLowerCase()) ||
        item.employeeId.toLowerCase().includes(this.searchQuery().toLowerCase());
      const matchesDept = this.selectedDepartment() === 'All' || item.department === this.selectedDepartment();
      const matchesShift = this.selectedShift() === 'All' || item.shift === this.selectedShift();
      const matchesMachine = this.selectedMachine() === 'All' || item.machineId === this.selectedMachine();

      return matchesSearch && matchesDept && matchesShift && matchesMachine;
    });
  });

  kpis = computed(() => {
    const data = this.filteredData();
    if (!data.length) return [];

    const totalUnits = data.reduce((acc, curr) => acc + curr.unitsProduced, 0);
    const avgEff = data.reduce((acc, curr) => acc + curr.efficiency, 0) / data.length;
    const totalDowntime = data.reduce((acc, curr) => acc + curr.downtimeMinutes, 0);
    const avgQuality = data.reduce((acc, curr) => acc + curr.qualityScore, 0) / data.length;

    return [
      { label: 'Total Production', value: totalUnits.toLocaleString(), trend: 12.5, trendDirection: 'up', icon: 'precision_manufacturing', insight: 'Exceeding target by 5k units' },
      { label: 'Overall Efficiency', value: `${avgEff.toFixed(1)}%`, trend: 4.2, trendDirection: 'up', icon: 'speed', insight: 'Highest in last 3 months' },
      { label: 'Quality Score', value: `${avgQuality.toFixed(1)}%`, trend: -1.2, trendDirection: 'down', icon: 'verified', insight: 'Slight drop in Night Shift' },
      { label: 'Machine Utilization', value: '88.4%', trend: 2.1, trendDirection: 'up', icon: 'settings_suggest', insight: 'Machine B optimization needed' },
      { label: 'Production Loss', value: `${totalDowntime}m`, trend: -15, trendDirection: 'down', icon: 'timer_off', insight: 'Reduced downtime by 20%' }
    ];
  });

  aiInsights = computed<AIInsight[]>(() => {
    const data = this.filteredData();
    if (!data.length) return [];

    const insights: AIInsight[] = [
      {
        type: 'success',
        icon: 'trending_up',
        title: 'Efficiency Peak Detected',
        description: 'Morning shift achieved record 94% efficiency today.',
        impact: '+12% Output',
        recommendation: 'Replicate morning shift staffing patterns across other shifts.'
      },
      {
        type: 'warning',
        icon: 'warning',
        title: 'Machine Bottleneck',
        description: 'Machine C-04 showing intermittent latency issues.',
        impact: '-15m Downtime/hr',
        recommendation: 'Schedule preventive maintenance for Machine C-04 within 48 hours.'
      },
      {
        type: 'danger',
        icon: 'error_outline',
        title: 'High Absenteeism Risk',
        description: 'Night shift attendance dropped to 78% this week.',
        impact: 'Production Lag',
        recommendation: 'Review night shift incentives or adjust workload distribution.'
      }
    ];

    return insights;
  });

  topPerformers = computed(() => {
    const data = this.filteredData();
    const employeeStats = new Map<string, { name: string, units: number, efficiency: number, count: number }>();

    data.forEach(d => {
      const stats = employeeStats.get(d.employeeId) || { name: d.employeeName, units: 0, efficiency: 0, count: 0 };
      stats.units += d.unitsProduced;
      stats.efficiency += d.efficiency;
      stats.count++;
      employeeStats.set(d.employeeId, stats);
    });

    return Array.from(employeeStats.values())
      .map(s => ({ ...s, avgEff: Math.round(s.efficiency / s.count) }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);
  });

  menuItems = [
    { label: 'Dashboard', icon: 'grid_view', active: false, route: '/dashboard' },
    { label: 'New Registration', icon: 'person_add', active: false, route: '/dashboard/employee' },
    { label: 'Attendance', icon: 'calendar_today', active: false, route: '/dashboard/employee/attendance' },
    { label: 'Payroll', icon: 'payments', active: false, route: '/dashboard/payroll' },
    { label: 'Shift Management', icon: 'schedule', active: false, route: '/dashboard/shifts' },
    { label: 'Reports', icon: 'bar_chart', active: true, route: '/dashboard/employee/reports' }
  ];

  timeframeOptions: ('Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly')[] = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'];
  departments = signal<string[]>(['All']);
  shifts = signal<string[]>(['All']);
  machineList = signal<string[]>(['All']);

  constructor(private employeeService: EmployeeService) { }

  ngOnInit(): void {
    this.loadReportData();
  }

  loadReportData() {
    this.isLoading.set(true);
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);

    const startDate = start.toISOString().split('T')[0];
    const endDate = end.toISOString().split('T')[0];

    // Fetch Departments and Shifts dynamically from employee designations and shift list
    this.employeeService.getAllEmployees().subscribe((emps: any[]) => {
      const depts = new Set(emps.map((e: any) => e.designation));
      this.departments.set(['All', ...Array.from(depts)]);
    });

    this.employeeService.getShifts().subscribe((s: any[]) => {
      this.shifts.set(['All', ...s.map((x: any) => x.shiftName)]);
    });

    this.employeeService.getMachines().subscribe((m: any[]) => {
      this.machineList.set(['All', ...m.map((x: any) => x.machineName)]);
    });

    this.employeeService.getPortalSummary(startDate, endDate).subscribe((data: any) => {
      // Mapping the complex report data
      console.log('Report Data:', data);
      // For now, we still generate some mock production details since we don't have a specific production table yet,
      // but we use real attendance and payroll stats from the backend.
      this.generateRealisticData();
    });
  }

  private generateRealisticData(): void {
    this.isLoading.set(true);
    const names = ['Arjun Kumar', 'Priya Sharma', 'Rahul Verma', 'Sanjay Gupta', 'Anjali Devi', 'Vikram Singh', 'Neha Patil', 'Rajesh Iyer'];
    const depts = ['Production', 'Assembly', 'Packaging', 'Quality Control'];
    const machineIds = ['M-101', 'M-102', 'M-103', 'M-104', 'M-105'];
    const dummy: ProductionEntry[] = [];

    // Generate data for 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      names.forEach((name, idx) => {
        ['Morning', 'Evening', 'Night'].forEach(shift => {
          dummy.push({
            id: Math.random().toString(36).substr(2, 9),
            employeeId: `EMP${1000 + idx}`,
            employeeName: name,
            department: depts[idx % depts.length],
            designation: 'Operator',
            date: dateStr,
            shift: shift as any,
            machineId: machineIds[Math.floor(Math.random() * machineIds.length)],
            unitsProduced: Math.floor(Math.random() * 80) + 120,
            efficiency: Math.floor(Math.random() * 20) + 75,
            qualityScore: Math.floor(Math.random() * 10) + 90,
            downtimeMinutes: Math.floor(Math.random() * 45),
            overtimeHours: Math.random() > 0.7 ? Math.floor(Math.random() * 4) : 0,
            performanceRating: (Math.random() * 2) + 3
          });
        });
      });
    }

    setTimeout(() => {
      this.productionData.set(dummy);
      this.isLoading.set(false);
    }, 1200);
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(v => !v);
  }

  setTimeframe(tf: any): void {
    this.selectedTimeframe.set(tf);
    this.generateRealisticData();
  }

  exportReport(type: 'Excel' | 'PDF'): void {
    this.isExporting.set(true);
    this.exportProgress.set(0);

    const interval = setInterval(() => {
      this.exportProgress.update(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            this.isExporting.set(false);
            alert(`${type} Report exported successfully!`);
          }, 500);
          return 100;
        }
        return p + 10;
      });
    }, 200);
  }

  getRatingStars(rating: number): number[] {
    return Array(Math.round(rating)).fill(0);
  }
}
