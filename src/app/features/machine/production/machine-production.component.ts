import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger, keyframes } from '@angular/animations';
import { InputFieldComponent } from '../../../shared/components/input-field/input-field.component';
import { AppDatePickerComponent } from '../../../shared/components/app-date-picker/app-date-picker.component';

interface ProductionEntry {
  id: string;
  date: string;
  machine: string;
  machineId: string;
  design: string;
  style: string;
  shift: string;
  produced: number;
  expected: number;
  achievement: number;
  rejected: number;
  downtime: number;
  efficiency: number;
  status: string;
}

@Component({
  selector: 'app-machine-production',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AppDatePickerComponent],
  templateUrl: './machine-production.component.html',
  styleUrls: ['./machine-production.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('listAnimation', [
      transition('* <=> *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(15px)' }),
          stagger('50ms', animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })))
        ], { optional: true })
      ])
    ]),
    trigger('modalAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) translateY(20px)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 1, 1)', style({ opacity: 0, transform: 'scale(0.95) translateY(20px)' }))
      ])
    ]),
    trigger('overlayAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class MachineProductionComponent {
  productionForm: FormGroup;
  showAddModal = signal(false);
  showViewModal = signal(false);
  selectedEntry = signal<ProductionEntry | null>(null);
  isLoading = signal(false);

  kpiCards = [
    { title: 'Total Produced Today', value: '18,450', trend: '+14%', up: true, icon: 'inventory_2', color: 'blue', progress: 85 },
    { title: 'Active Machines', value: '42/48', trend: '88%', up: true, icon: 'precision_manufacturing', color: 'indigo', progress: 88 },
    { title: 'Highest Output', value: '2,400', trend: 'CNC-01', up: true, icon: 'trending_up', color: 'green', progress: 100 },
    { title: 'Lowest Output', value: '850', trend: 'LATH-04', up: false, icon: 'trending_down', color: 'red', progress: 35 },
    { title: 'Overall Efficiency', value: '92.4%', trend: '+2.1%', up: true, icon: 'speed', color: 'purple', progress: 92 },
    { title: 'Production Loss', value: '450', trend: '-12%', up: false, icon: 'money_off', color: 'amber', progress: 12 },
    { title: 'Styles Produced', value: '12', trend: 'Active', up: true, icon: 'style', color: 'cyan', progress: 60 },
    { title: 'Shift Performance', value: 'A (High)', trend: 'Shift A', up: true, icon: 'event_repeat', color: 'deep-purple', progress: 95 }
  ];

  productionHistory = signal<ProductionEntry[]>([
    { id: '1', date: '2024-05-14', machine: 'CNC-01', machineId: 'MC-101', design: 'Radial Gear', style: 'S-102', shift: 'A', produced: 1200, expected: 1200, achievement: 100, rejected: 12, downtime: 15, efficiency: 94, status: 'Completed' },
    { id: '2', date: '2024-05-14', machine: 'LATH-04', machineId: 'MC-104', design: 'Shaft 20mm', style: 'S-405', shift: 'B', produced: 650, expected: 800, achievement: 81.2, rejected: 45, downtime: 45, efficiency: 76, status: 'Underperforming' },
    { id: '3', date: '2024-05-14', machine: 'MILL-02', machineId: 'MC-202', design: 'Housing-A', style: 'H-901', shift: 'A', produced: 520, expected: 500, achievement: 104, rejected: 5, downtime: 10, efficiency: 97, status: 'Overachieved' },
    { id: '4', date: '2024-05-13', machine: 'CNC-01', machineId: 'MC-101', design: 'Radial Gear', style: 'S-102', shift: 'C', produced: 1100, expected: 1200, achievement: 91.6, rejected: 25, downtime: 30, efficiency: 88, status: 'Delayed' },
    { id: '5', date: '2024-05-13', machine: 'CNC-05', machineId: 'MC-105', design: 'Plate-X', style: 'P-112', shift: 'A', produced: 1500, expected: 1500, achievement: 100, rejected: 10, downtime: 5, efficiency: 96, status: 'Completed' },
    { id: '6', date: '2024-05-13', machine: 'DRILL-03', machineId: 'MC-303', design: 'Bracket-V', style: 'B-202', shift: 'B', produced: 800, expected: 2000, achievement: 40, rejected: 120, downtime: 180, efficiency: 35, status: 'Production Loss' }
  ]);

  aiRecommendations = [
    { text: 'Machine CNC-01 can handle 15% more output by optimizing tool change time.', type: 'success', icon: 'auto_awesome' },
    { text: 'High rejection rate detected in Shift B for Style S-405. Check material quality.', type: 'danger', icon: 'report_problem' },
    { text: 'Machine MC-303 shows high risk of breakdown due to excessive downtime.', type: 'warning', icon: 'warning' },
    { text: 'Predicted efficiency for next shift: 91.5% with current operator mapping.', type: 'info', icon: 'psychology' }
  ];

  constructor(private fb: FormBuilder) {
    this.productionForm = this.fb.group({
      // Basic Details
      productionDate: [new Date().toISOString().split('T')[0], Validators.required],
      machineName: ['', Validators.required],
      machineId: ['MC-101', Validators.required],
      designName: ['', Validators.required],
      styleNumber: ['', Validators.required],
      productCategory: ['Industrial'],
      shift: ['A', Validators.required],
      department: ['Assembly'],
      operatorName: ['', Validators.required],
      supervisorName: [''],

      // Production Details
      producedQty: [0, [Validators.required, Validators.min(0)]],
      expectedQty: [1, [Validators.required, Validators.min(1)]],
      rejectedQty: [0, [Validators.required, Validators.min(0)]],
      reworkQty: [0],
      productionHours: [8],
      downtimeMinutes: [0],
      operatorCount: [1],
      machineSpeed: [100],
      efficiency: [0],
      qualityScore: [100],

      // Shift Details
      shiftStart: ['08:00'],
      shiftEnd: ['16:00'],
      overtimeHours: [0],
      breakDuration: [60],
      shiftProductivity: [0],
      remarks: [''],

      // Analytics
      machineStatus: ['Running'],
      machineHealth: [95],
      downtimeReason: [''],
      maintenanceImpact: ['None']
    });

    // Auto-calculate efficiency
    this.productionForm.valueChanges.subscribe(val => {
      if (val.producedQty > 0 && val.expectedQty > 0) {
        const eff = Math.round((val.producedQty / val.expectedQty) * 100);
        this.productionForm.patchValue({ efficiency: eff }, { emitEvent: false });
      }
    });
  }

  openAddModal() {
    this.showAddModal.set(true);
  }

  closeAddModal() {
    this.showAddModal.set(false);
  }

  viewDetails(entry: ProductionEntry) {
    this.selectedEntry.set(entry);
    this.showViewModal.set(true);
  }

  closeViewModal() {
    this.showViewModal.set(false);
    this.selectedEntry.set(null);
  }

  getStatusClass(status: string) {
    switch (status.toLowerCase()) {
      case 'completed': return 'status-success';
      case 'overachieved': return 'status-indigo';
      case 'underperforming': return 'status-warning';
      case 'delayed': return 'status-amber';
      case 'production loss': return 'status-danger';
      case 'maintenance impact': return 'status-purple';
      default: return 'status-muted';
    }
  }

  saveProduction() {
    if (this.productionForm.invalid) {
      this.productionForm.markAllAsTouched();
      alert('Please fill all required fields correctly before saving.');
      return;
    }

    if (this.productionForm.valid) {
      this.isLoading.set(true);
      setTimeout(() => {
        const val = this.productionForm.value;
        const newEntry: ProductionEntry = {
          id: Math.random().toString(36).substr(2, 9),
          date: val.productionDate,
          machine: val.machineName,
          machineId: val.machineId,
          design: val.designName,
          style: val.styleNumber,
          shift: val.shift,
          produced: val.producedQty,
          expected: val.expectedQty,
          achievement: Math.round((val.producedQty / val.expectedQty) * 100),
          rejected: val.rejectedQty,
          downtime: val.downtimeMinutes,
          efficiency: val.efficiency,
          status: val.producedQty >= val.expectedQty ? 'Completed' : 'Underperforming'
        };

        this.productionHistory.update(h => [newEntry, ...h]);
        this.isLoading.set(false);
        this.closeAddModal();
        this.productionForm.reset({
          productionDate: new Date().toISOString().split('T')[0],
          machineId: 'MC-101',
          shift: 'A',
          productCategory: 'Industrial',
          productionHours: 8,
          machineSpeed: 100,
          qualityScore: 100,
          machineStatus: 'Running'
        });
      }, 1500);
    }
  }

  exportData() {
    alert('Exporting production history to Excel...');
  }
}
