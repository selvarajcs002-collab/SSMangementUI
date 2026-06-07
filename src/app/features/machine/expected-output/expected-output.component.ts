import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger, keyframes } from '@angular/animations';

@Component({
  selector: 'app-expected-output',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './expected-output.component.html',
  styleUrls: ['./expected-output.component.css'],
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
export class ExpectedOutputComponent {
  targetForm: FormGroup;
  showModal = signal(false);
  editingIndex = signal<number | null>(null);

  kpiCards = [
    { title: 'Active Targets', value: '124', trend: '+12%', up: true, icon: 'track_changes', color: 'blue', progress: 75 },
    { title: 'Overall Achievement', value: '94.2%', trend: '+2.1%', up: true, icon: 'stars', color: 'green', progress: 94 },
    { title: 'Underperforming', value: '4', trend: '-2', up: false, icon: 'trending_down', color: 'red', progress: 15 },
    { title: 'Overachieved', value: '12', trend: '+5', up: true, icon: 'trending_up', color: 'indigo', progress: 40 },
    { title: 'Total Production', value: '1.2M', trend: 'Units', up: true, icon: 'inventory_2', color: 'purple', progress: 85 },
    { title: 'AI Optimized', value: '88%', trend: 'Confidence', up: true, icon: 'psychology', color: 'deep-purple', progress: 88 }
  ];

  targets = signal([
    { machine: 'CNC-01', design: 'Radial Gear V2', style: 'S-102', shift: 'A', daily: 1200, actual: 1150, achievement: 95.8, efficiency: 92, status: 'Active' },
    { machine: 'LATH-04', design: 'Shaft 20mm', style: 'S-405', shift: 'B', daily: 800, actual: 620, achievement: 77.5, efficiency: 74, status: 'Underperforming' },
    { machine: 'MILL-02', design: 'Housing-Alpha', style: 'H-901', shift: 'A', daily: 500, actual: 520, achievement: 104, efficiency: 96, status: 'Overachieved' },
    { machine: 'CNC-05', design: 'Plate-Type-X', style: 'P-112', shift: 'C', daily: 1500, actual: 1480, achievement: 98.6, efficiency: 91, status: 'Active' },
    { machine: 'DRILL-03', design: 'Bracket-V8', style: 'B-202', shift: 'A', daily: 2000, actual: 1400, achievement: 70.0, efficiency: 68, status: 'Delayed' }
  ]);

  constructor(private fb: FormBuilder) {
    this.targetForm = this.fb.group({
      machineName: ['', Validators.required],
      machineId: ['MC-101', Validators.required],
      designName: ['', Validators.required],
      styleNumber: ['', Validators.required],
      dailyTarget: [0, [Validators.required, Validators.min(1)]],
      shift: ['A', Validators.required]
    });
  }

  openAddTarget() {
    this.editingIndex.set(null);
    this.targetForm.reset({ shift: 'A', machineId: 'MC-101', dailyTarget: 0 });
    this.showModal.set(true);
  }

  editTarget(target: any, index: number) {
    this.editingIndex.set(index);
    this.targetForm.patchValue({
      machineName: target.machine, 
      machineId: target.machine,
      designName: target.design,
      styleNumber: target.style,
      dailyTarget: target.daily,
      shift: target.shift
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  getStatusClass(status: string) {
    switch (status.toLowerCase()) {
      case 'active': return 'status-active';
      case 'overachieved': return 'status-success';
      case 'underperforming': return 'status-danger';
      case 'delayed': return 'status-warning';
      default: return 'status-muted';
    }
  }

  onSubmit() {
    if (this.targetForm.valid) {
      const formVal = this.targetForm.value;
      const index = this.editingIndex();

      if (index !== null) {
        // Update logic
        this.targets.update(t => {
          const updated = [...t];
          updated[index] = {
            ...updated[index],
            machine: formVal.machineId,
            design: formVal.designName,
            style: formVal.styleNumber,
            shift: formVal.shift,
            daily: formVal.dailyTarget,
            achievement: updated[index].actual ? (updated[index].actual / formVal.dailyTarget) * 100 : 0
          };
          return updated;
        });
      } else {
        // Add logic
        const newTarget = {
          machine: formVal.machineId,
          design: formVal.designName,
          style: formVal.styleNumber,
          shift: formVal.shift,
          daily: formVal.dailyTarget,
          actual: 0,
          achievement: 0,
          efficiency: 90,
          status: 'Active'
        };
        this.targets.update(t => [newTarget, ...t]);
      }
      
      this.closeModal();
      this.targetForm.reset({ shift: 'A', machineId: 'MC-101' });
    }
  }
}
