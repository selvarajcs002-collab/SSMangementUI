import { Component, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger, state } from '@angular/animations';
import { InputFieldComponent } from '../../shared/components/input-field/input-field.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { SelectFieldComponent } from '../../shared/components/select-field/select-field.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { DatePickerComponent } from '../../shared/components/date-picker/date-picker.component';
import { EmployeeService } from '../../core/services/employee.service';
import { finalize } from 'rxjs/operators';

export type AttendanceStatus = 'Present' | 'Absent' | 'First Half' | 'Second Half' | 'Pending';

export interface EmployeeAttendance {
  id: string;
  name: string;
  dept: string;
  shift: string;
  photo: string;
  status: AttendanceStatus;
  remarks: string;
  selected: boolean;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  present: number;
  absent: number;
  halfDay: number;
}

@Component({
  selector: 'app-emp-addendence',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    InputFieldComponent,
    ButtonComponent,
    SelectFieldComponent,
    LoaderComponent,
    DatePickerComponent
  ],
  templateUrl: './emp-addendence.component.html',
  styleUrls: ['./emp-addendence.component.scss'],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('sidebarAnimation', [
      state('expanded', style({ width: '280px' })),
      state('collapsed', style({ width: '80px' })),
      transition('expanded <=> collapsed', animate('300ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ]),
    trigger('statusChange', [
      transition('* => *', [
        style({ opacity: 0.7 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmpAddendenceComponent implements OnInit {
  isSidebarCollapsed = signal(false);
  currentView = signal<'table' | 'calendar'>('table');
  isLoading = signal(false);
  isSaving = signal(false);
  lastSaved = signal<Date | null>(null);
  now = new Date();

  attendanceList = signal<EmployeeAttendance[]>([]);

  // Calendar specific states
  currentCalendarDate = signal(new Date());
  calendarDays = computed(() => this.generateCalendar(this.currentCalendarDate()));

  searchTerm = signal('');
  selectedDept = signal('All');
  selectedShift = signal('All');

  filteredAttendance = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const dept = this.selectedDept();
    const shift = this.selectedShift();

    return this.attendanceList().filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(term) || emp.id.toLowerCase().includes(term);
      const matchesDept = dept === 'All' || emp.dept === dept;
      const matchesShift = shift === 'All' || emp.shift === shift;
      return matchesSearch && matchesDept && matchesShift;
    });
  });

  departments = computed(() => {
    const depts = new Set(this.attendanceList().map(e => e.dept));
    return ['All', ...Array.from(depts)];
  });

  shifts = computed(() => {
    const shifts = new Set(this.attendanceList().map(e => e.shift));
    return ['All', ...Array.from(shifts)];
  });

  statusOptions: { label: AttendanceStatus, icon: string, color: string }[] = [
    { label: 'Present', icon: 'check_circle', color: '#10B981' },
    { label: 'Absent', icon: 'cancel', color: '#EF4444' },
    { label: 'First Half', icon: 'timelapse', color: '#F59E0B' },
    { label: 'Second Half', icon: 'timelapse', color: '#3B82F6' }
  ];

  stats = signal({
    total: 0,
    present: 0,
    absent: 0,
    halfDay: 0,
    leave: 0,
    pending: 0
  });

  menuItems = [
    { label: 'Dashboard', icon: 'grid_view', active: false, route: '/dashboard' },
    { label: 'New Registration', icon: 'person_add', active: false, route: '/dashboard/employee' },
    { label: 'Attendance', icon: 'calendar_today', active: true, route: '/dashboard/employee/attendance' },
    { label: 'Payroll', icon: 'payments', active: false, route: '/dashboard/payroll' },
    { label: 'Shift Management', icon: 'schedule', active: false, route: '/dashboard/shifts' },
    { label: 'Reports', icon: 'bar_chart', active: false, route: '/dashboard/employee/reports' }
  ];

  constructor(private employeeService: EmployeeService) { }

  ngOnInit(): void {
    this.loadAttendanceData();
    this.setupAutoRefresh();
  }

  setupAutoRefresh(): void {
    const now = new Date();
    const next6AM = new Date();
    next6AM.setHours(6, 0, 0, 0);

    // If it's already past 6 AM, set it for tomorrow 6 AM
    if (now >= next6AM) {
      next6AM.setDate(next6AM.getDate() + 1);
    }

    const timeout = next6AM.getTime() - now.getTime();
    setTimeout(() => {
      window.location.reload();
    }, timeout);

    console.log(`Auto-refresh scheduled in ${Math.round(timeout / 1000 / 60)} minutes (at 6:00 AM)`);
  }

  loadAttendanceData() {
    this.isLoading.set(true);
    const date = new Date().toISOString().split('T')[0];

    this.employeeService.getAllEmployees().subscribe((emps: any[]) => {
      this.employeeService.getShiftAssignments(date).subscribe((assignments: any[]) => {
        this.employeeService.getAttendanceByDate(date).subscribe((attendance: any[]) => {
          // Filter: Only show employees assigned to a shift/machine today
          const assignedEmpIds = new Set(assignments.map(a => a.employeeId));

          this.attendanceList.set(emps
            .filter((e: any) => assignedEmpIds.has(e.employeeId))
            .map((e: any) => {
              const record = attendance.find((a: any) => a.employeeId === e.employeeId);
              const assign = assignments.find((a: any) => a.employeeId === e.employeeId);
              return {
                id: e.employeeId,
                name: e.fullName,
                dept: e.designation,
                shift: assign?.shiftName || 'Assigned',
                photo: `https://i.pravatar.cc/150?u=${e.employeeId}`,
                status: (record?.status as AttendanceStatus) || 'Pending',
                remarks: record?.remarks || '',
                selected: false
              };
            }));
          this.isLoading.set(false);
          this.updateStats();
        });
      });
    });
  }

  updateStats(): void {
    const list = this.attendanceList();
    this.stats.set({
      total: list.length,
      present: list.filter(e => e.status === 'Present').length,
      absent: list.filter(e => e.status === 'Absent').length,
      halfDay: list.filter(e => e.status === 'First Half' || e.status === 'Second Half').length,
      leave: 0, // No longer using Leave status in this view
      pending: list.filter(e => e.status === 'Pending').length
    });
  }

  trackByEmpId(index: number, emp: EmployeeAttendance): string {
    return emp.id;
  }

  getInitials(name: string | null): string {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  selectStatus(employeeId: string, status: AttendanceStatus): void {
    this.attendanceList.update(list =>
      list.map(emp => emp.id === employeeId ? { ...emp, status } : emp)
    );
    this.updateStats();
  }

  updateRemarks(employeeId: string, remarks: string): void {
    this.attendanceList.update(list =>
      list.map(emp => emp.id === employeeId ? { ...emp, remarks } : emp)
    );
  }

  saveAttendanceRecord(employeeId: string): void {
    const emp = this.attendanceList().find(e => e.id === employeeId);
    if (!emp || emp.status === 'Pending') return;

    this.isSaving.set(true);
    const date = new Date().toISOString().split('T')[0];
    const attendance = {
      employeeId: emp.id,
      fullName: emp.name,
      date,
      status: emp.status,
      remarks: emp.remarks
    };

    this.employeeService.saveAttendance(attendance)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.lastSaved.set(new Date());
          this.showSuccessNotification('Attendance saved successfully');
        },
        error: () => alert('Failed to save attendance')
      });
  }

  markAllPresent(): void {
    this.attendanceList.update(list =>
      list.map(emp => emp.status === 'Pending' ? { ...emp, status: 'Present' as AttendanceStatus } : emp)
    );
    this.autoSave();
    this.updateStats();
  }

  toggleSelectAll(event: any): void {
    const checked = event.target.checked;
    this.attendanceList.update(list => list.map(emp => ({ ...emp, selected: checked })));
  }

  bulkMark(status: AttendanceStatus): void {
    this.attendanceList.update(list =>
      list.map(emp => emp.selected ? { ...emp, status, selected: false } : emp)
    );
    this.updateStats();
  }

  bulkConfirm(): void {
    const toSave = this.attendanceList().filter(e => e.selected && e.status !== 'Pending');
    if (toSave.length === 0) {
      alert('Please select employees with status to confirm');
      return;
    }

    toSave.forEach(emp => this.saveAttendanceRecord(emp.id));
  }

  autoSave(): void {
    const toSave = this.attendanceList().filter(e => e.status !== 'Pending');
    if (toSave.length === 0) {
      this.showSuccessNotification('No changes to update');
      return;
    }

    this.isSaving.set(true);
    let count = 0;
    toSave.forEach(emp => {
      this.saveAttendanceRecord(emp.id);
      count++;
    });
  }

  showSuccessNotification(message: string) {
    console.log('Notification:', message);
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(v => !v);
  }

  switchView(view: 'table' | 'calendar'): void {
    this.currentView.set(view);
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(' ', '-');
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  generateCalendar(currentDate: Date): CalendarDay[] {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay();
    
    const days: CalendarDay[] = [];
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: this.isToday(d),
        present: Math.floor(Math.random() * 20),
        absent: Math.floor(Math.random() * 5),
        halfDay: Math.floor(Math.random() * 2)
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const isPastOrToday = d <= new Date();
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: this.isToday(d),
        present: isPastOrToday ? Math.floor(Math.random() * 40 + 10) : 0,
        absent: isPastOrToday ? Math.floor(Math.random() * 10) : 0,
        halfDay: isPastOrToday ? Math.floor(Math.random() * 5) : 0
      });
    }
    
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: this.isToday(d),
        present: 0,
        absent: 0,
        halfDay: 0
      });
    }
    
    return days;
  }

  previousMonth(): void {
    const d = new Date(this.currentCalendarDate());
    d.setMonth(d.getMonth() - 1);
    this.currentCalendarDate.set(d);
  }

  nextMonth(): void {
    const d = new Date(this.currentCalendarDate());
    d.setMonth(d.getMonth() + 1);
    this.currentCalendarDate.set(d);
  }

  goToToday(): void {
    this.currentCalendarDate.set(new Date());
  }

}
