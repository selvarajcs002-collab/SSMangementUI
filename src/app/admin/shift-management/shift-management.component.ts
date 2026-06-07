import { Component, OnInit, OnDestroy, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate, query, stagger, state } from '@angular/animations';
import { CustomSelectComponent } from '../../shared/components/custom-select/custom-select.component';
import { EmployeeService } from '../../core/services/employee.service';
import { finalize, tap } from 'rxjs/operators';
import { Subscription, interval, forkJoin, Observable } from 'rxjs';

export type ShiftType = 'Morning' | 'Evening' | 'Night' | 'General';
export type MachineStatus = 'Active' | 'Idle' | 'Maintenance' | 'Overloaded' | 'Offline';
export type EmployeeStatus = 'Available' | 'Assigned' | 'On Leave' | 'Absent' | 'Overtime';

export interface Shift {
  id: string;
  name: ShiftType;
  time: string;
  color: string;
  capacity: number;
  lead: string;
  icon: string;
}

export interface Machine {
  id: string;
  name: string;
  status: MachineStatus;
  capacity: number;
  utilization: number;
  load: number;
  shiftId?: string;
}

export interface Employee {
  id: string;
  name: string;
  photo: string;
  designation: string;
  status: EmployeeStatus;
  shiftId?: string;
  machineId?: string;
  pendingShift?: string;
  pendingMachine?: string;
  selected?: boolean;
}

@Component({
  selector: 'app-shift-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, CustomSelectComponent],
  templateUrl: './shift-management.component.html',
  styleUrls: ['./shift-management.component.scss'],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('500ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerCards', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(15px)' }),
          stagger(50, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('cardHover', [
      state('normal', style({ transform: 'translateY(0)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' })),
      state('hover', style({ transform: 'translateY(-5px)', boxShadow: '0 12px 24px rgba(0,0,0,0.1)' })),
      transition('normal <=> hover', animate('200ms ease-in-out'))
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShiftManagementComponent implements OnInit, OnDestroy {
  now = new Date();
  isSidebarCollapsed = signal(false);
  searchTerm = signal('');
  isSaving = signal(false);
  lastSaved = signal<Date | null>(null);

  employees = signal<Employee[]>([]);
  shifts = signal<Shift[]>([]);
  machines = signal<Machine[]>([]);

  private refreshSubscription?: Subscription;
  private settings: any = null;

  machineOptions = computed(() =>
    this.machines().map(m => ({ key: m.id, value: `${m.name} (#${m.id})` }))
  );

  filteredEmployees = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.employees().filter(e =>
      e.name.toLowerCase().includes(term) || e.id.toLowerCase().includes(term)
    );
  });

  stats = computed(() => {
    const emps = this.employees();
    return {
      total: emps.length,
      unassigned: emps.filter(e => !e.pendingShift).length,
      machinesActive: this.machines().filter(m => m.status === 'Active').length
    };
  });

  getInitials(name: string | null): string {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  getMachineUtilization(machineId: string): number {
    const machine = this.machines().find(m => m.id === machineId);
    return machine ? machine.utilization : 0;
  }

  currentView = signal<'table' | 'machine'>('table');
  selectedShiftForMachineView = signal<string>('1');

  constructor(private employeeService: EmployeeService) { }

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  private setupAutoRefresh() {
    // 1. Fetch settings from appsettings (via backend API)
    this.employeeService.getShiftSettings().subscribe(settings => {
      this.settings = settings;
      console.log('Shift Refresh Settings:', settings);

      // 2. Check every minute if we need to refresh
      this.refreshSubscription = interval(60000).subscribe(() => {
        this.checkAndRefresh();
      });
    });
  }

  private checkAndRefresh() {
    if (!this.settings) return;

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().split(' ')[0]; // HH:mm:ss

    // Check if current day matches RefreshDay (e.g., Sunday)
    // and if current time is within the same minute as RefreshTime
    const targetTime = this.settings.refreshTime;

    if (currentDay === this.settings.refreshDay) {
      // Check if current time matches target time (HH:mm)
      if (currentTime.substring(0, 5) === targetTime.substring(0, 5)) {
        console.log('Scheduled refresh triggered!');
        this.loadInitialData();
        this.showSuccessNotification(`Scheduled refresh performed for ${currentDay} evening.`);
      }
    }
  }

  loadInitialData() {
    this.isSaving.set(true);
    // Fetch Shifts
    this.employeeService.getShifts().subscribe((s: any[]) => {
      this.shifts.set(s.map((x: any) => ({
        id: x.shiftId.toString(),
        name: x.shiftName as ShiftType,
        time: `${x.startTime} - ${x.endTime}`,
        color: x.color,
        capacity: 30,
        lead: 'N/A',
        icon: x.icon
      })));
    });

    // Fetch Machines
    this.employeeService.getMachines().subscribe((m: any[]) => {
      this.machines.set(m.map((x: any) => ({
        id: x.machineId.toString(),
        name: x.machineName,
        status: x.status as MachineStatus,
        capacity: x.capacity,
        utilization: 0,
        load: 0
      })));
    });

    // Fetch Employees and their assignments
    this.employeeService.getAllEmployees().subscribe((emps: any[]) => {
      const date = new Date().toISOString().split('T')[0];
      this.employeeService.getShiftAssignments(date).subscribe((assignments: any[]) => {
        this.employees.set(emps.map((e: any) => {
          const assign = assignments.find((a: any) => a.employeeId === e.employeeId);
          return {
            id: e.employeeId,
            name: e.fullName,
            designation: e.designation,
            photo: `https://i.pravatar.cc/150?u=${e.employeeId}`,
            status: assign ? 'Assigned' : 'Available',
            pendingShift: assign ? assign.shiftId.toString() : '',
            pendingMachine: assign ? assign.machineId.toString() : '',
            selected: false
          };
        }));
        this.isSaving.set(false);
      });
    });
  }

  switchView(view: 'table' | 'machine') {
    this.currentView.set(view);
  }

  setShiftForMachineView(shiftId: string) {
    this.selectedShiftForMachineView.set(shiftId);
  }

  getAvailableEmployees() {
    return this.employees().filter(e => !e.pendingShift || !e.pendingMachine);
  }

  getEmployeesByMachineAndShift(machineId: string, shiftId: string) {
    return this.employees().filter(e => e.pendingMachine === machineId && e.pendingShift === shiftId);
  }

  getPendingLoadForMachine(machineId: string, shiftId: string): number {
    return this.getEmployeesByMachineAndShift(machineId, shiftId).length;
  }

  assignToMachineInMachineView(employeeId: string, machineId: string) {
    const shiftId = this.selectedShiftForMachineView();
    this.selectShift(employeeId, shiftId);
    this.selectMachine(employeeId, machineId);
  }

  menuItems = [
    { label: 'Dashboard', icon: 'grid_view', active: false, route: '/dashboard' },
    { label: 'New Registration', icon: 'person_add', active: false, route: '/dashboard/employee' },
    { label: 'Attendance', icon: 'calendar_today', active: false, route: '/dashboard/employee/attendance' },
    { label: 'Payroll', icon: 'payments', active: false, route: '/dashboard/payroll' },
    { label: 'Shift Management', icon: 'schedule', active: true, route: '/dashboard/shifts' },
    { label: 'Reports', icon: 'bar_chart', active: false, route: '/dashboard/employee/reports' }
  ];

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(v => !v);
  }

  selectShift(employeeId: string, shiftId: string) {
    this.employees.update(list => list.map(e =>
      e.id === employeeId ? { ...e, pendingShift: shiftId } : e
    ));
  }

  selectMachine(employeeId: string, machineId: string) {
    this.employees.update(list => list.map(e =>
      e.id === employeeId ? { ...e, pendingMachine: machineId } : e
    ));
  }

  saveAssignmentObservable(employeeId: string, shiftId: string, machineId: string): Observable<any> {
    const assignment = {
      employeeId,
      shiftId: parseInt(shiftId),
      machineId: parseInt(machineId),
      assignmentDate: new Date().toISOString().split('T')[0]
    };

    return this.employeeService.assignShift(assignment).pipe(
      tap((res: any) => {
        if (res && (res.status === true || res.Status === true)) {
          this.employees.update(list => list.map(e =>
            e.id === employeeId ? { ...e, status: 'Assigned' as EmployeeStatus, selected: false } : e
          ));
        }
      })
    );
  }

  saveAssignment(employeeId: string, shiftId: string, machineId: string) {
    this.isSaving.set(true);
    this.saveAssignmentObservable(employeeId, shiftId, machineId)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res: any) => {
          if (res && (res.status === true || res.Status === true)) {
            this.lastSaved.set(new Date());
            this.showSuccessNotification('Assignment saved to database');
          } else {
            alert('Backend Error: ' + (res?.message || res?.Message || 'Unknown error'));
          }
        },
        error: (err) => {
          console.error('Assignment Error:', err);
          const errorMsg = err.error?.message || err.error?.Message || err.message || 'Failed to save assignment';
          alert('Error: ' + errorMsg);
        }
      });
  }

  toggleSelectAll(event: any) {
    const checked = event.target.checked;
    this.employees.update(list => list.map(e => ({ ...e, selected: checked })));
  }

  confirmAssignment(employeeId: string) {
    const emp = this.employees().find(e => e.id === employeeId);
    if (emp && emp.pendingShift && emp.pendingMachine) {
      this.saveAssignment(employeeId, emp.pendingShift!, emp.pendingMachine!);
    } else if (emp && (!emp.pendingShift || !emp.pendingMachine)) {
      alert(`Please select both shift and machine for ${emp.name}`);
    }
  }

  bulkConfirm() {
    const selected = this.employees().filter(e => e.selected && e.pendingShift && e.pendingMachine);
    if (selected.length === 0) {
      alert('Please select employees with both shift and machine assigned');
      return;
    }

    this.isSaving.set(true);
    const observables = selected.map(emp => 
      this.saveAssignmentObservable(emp.id, emp.pendingShift!, emp.pendingMachine!)
    );

    forkJoin(observables)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (results) => {
          this.lastSaved.set(new Date());
          this.showSuccessNotification(`Successfully saved ${results.length} assignments`);
        },
        error: (err) => {
          console.error('Bulk Assignment Error:', err);
          alert('Some assignments failed to save. Please check the console.');
        }
      });
  }

  autoSave() {
    const toSave = this.employees().filter(e => e.pendingShift && e.pendingMachine);
    if (toSave.length === 0) {
      this.showSuccessNotification('No changes to update');
      return;
    }

    this.isSaving.set(true);
    const observables = toSave.map(emp => 
      this.saveAssignmentObservable(emp.id, emp.pendingShift!, emp.pendingMachine!)
    );

    forkJoin(observables)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (results) => {
          this.lastSaved.set(new Date());
          this.showSuccessNotification(`Successfully updated ${results.length} assignments`);
        },
        error: (err) => {
          console.error('Auto Update Error:', err);
          alert('Update failed. Please check your connection.');
        }
      });
  }

  draggedEmployee: Employee | null = null;

  onDragStart(event: DragEvent, employee: Employee) {
    this.draggedEmployee = employee;
    event.dataTransfer?.setData('text/plain', employee.id);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDropToShift(event: DragEvent, shiftId: string) {
    event.preventDefault();
    if (this.draggedEmployee) {
      this.assignToShift(this.draggedEmployee.id, shiftId);
      this.draggedEmployee = null;
    }
  }

  onDropToMachine(event: DragEvent, machineId: string) {
    event.preventDefault();
    if (this.draggedEmployee) {
      this.assignToMachine(this.draggedEmployee.id, machineId);
      this.draggedEmployee = null;
    }
  }

  assignToShift(employeeId: string, shiftId: string) {
    this.employees.update(list => list.map(e =>
      e.id === employeeId ? { ...e, shiftId, status: 'Assigned' as EmployeeStatus } : e
    ));
    this.showSuccessNotification('Employee assigned to shift');
  }

  assignToMachine(employeeId: string, machineId: string) {
    const machine = this.machines().find(m => m.id === machineId);
    if (machine && machine.load >= machine.capacity) {
      alert('Machine capacity reached! Cannot assign more employees.');
      return;
    }

    this.employees.update(list => list.map(e =>
      e.id === employeeId ? { ...e, machineId, status: 'Assigned' as EmployeeStatus } : e
    ));

    this.machines.update(list => list.map(m => {
      if (m.id === machineId) {
        const newLoad = m.load + 1;
        return { ...m, load: newLoad, utilization: (newLoad / m.capacity) * 100 };
      }
      return m;
    }));

    this.showSuccessNotification('Employee assigned to machine');
  }

  removeFromShift(employeeId: string) {
    this.employees.update(list => list.map(e =>
      e.id === employeeId ? { ...e, shiftId: undefined, status: 'Available' as EmployeeStatus } : e
    ));
  }

  removeFromMachine(employeeId: string, machineId: string) {
    this.employees.update(list => list.map(e =>
      e.id === employeeId ? { ...e, machineId: undefined, pendingMachine: undefined } : e
    ));

    this.machines.update(list => list.map(m => {
      if (m.id === machineId) {
        const newLoad = Math.max(0, m.load - 1);
        return { ...m, load: newLoad, utilization: (newLoad / m.capacity) * 100 };
      }
      return m;
    }));
  }

  getEmployeesForShift(shiftId: string): Employee[] {
    return this.employees().filter(e => e.pendingShift === shiftId);
  }

  getEmployeesForMachine(machineId: string): Employee[] {
    return this.employees().filter(e => e.pendingMachine === machineId);
  }

  getStatusClass(status: MachineStatus | EmployeeStatus): string {
    return status.toLowerCase().replace(' ', '-');
  }

  bulkAssignToMachine(machineId: string) {
    this.employees().filter(e => e.selected).forEach(emp => {
      this.assignToMachineInMachineView(emp.id, machineId);
    });
  }
  
  bulkRemoveFromMachine() {
    this.employees().filter(e => e.selected).forEach(emp => {
      if(emp.pendingMachine) {
        this.removeFromMachine(emp.id, emp.pendingMachine);
      }
    });
  }

  showSuccessNotification(message: string) {
    console.log('Notification:', message);
  }

  getShiftColor(shiftId?: string): string {
    if (!shiftId) return '#64748B';
    const shift = this.shifts().find(s => s.id === shiftId);
    return shift ? shift.color : '#64748B';
  }
}
