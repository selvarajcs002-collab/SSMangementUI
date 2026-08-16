import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface MachineStatus {
  id: string;
  name: string;
  status: 'UP' | 'DOWN' | 'In Service' | 'Holiday';
  upTime: string;
  downTime: string;
  lastStatusChange: number;
  cumulativeUpSeconds: number;
  cumulativeDownSeconds: number;
}

interface MachineHistory {
  machineId: string;
  machineName: string;
  previousStatus: string;
  newStatus: string;
  timestamp: Date;
  duration: string;
}

@Component({
  selector: 'app-operator-mapping',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './operator-mapping.component.html',
  styleUrls: ['./operator-mapping.component.css']
})
export class OperatorMappingComponent implements OnInit, OnDestroy {
  machines: MachineStatus[] = [
    { id: 'MC-001', name: 'CNC Lathe A1', status: 'UP', upTime: '0h 0m 0s', downTime: '0h 0m 0s', lastStatusChange: Date.now(), cumulativeUpSeconds: 0, cumulativeDownSeconds: 0 },
    { id: 'MC-002', name: 'Milling Center B2', status: 'DOWN', upTime: '0h 0m 0s', downTime: '0h 0m 0s', lastStatusChange: Date.now(), cumulativeUpSeconds: 0, cumulativeDownSeconds: 0 },
    { id: 'MC-003', name: 'Hydraulic Press P1', status: 'In Service', upTime: '0h 0m 0s', downTime: '0h 0m 0s', lastStatusChange: Date.now(), cumulativeUpSeconds: 0, cumulativeDownSeconds: 0 },
    { id: 'MC-004', name: 'Laser Cutter L5', status: 'UP', upTime: '0h 0m 0s', downTime: '0h 0m 0s', lastStatusChange: Date.now(), cumulativeUpSeconds: 0, cumulativeDownSeconds: 0 },
    { id: 'MC-005', name: 'Injection Molder M3', status: 'Holiday', upTime: '0h 0m 0s', downTime: '0h 0m 0s', lastStatusChange: Date.now(), cumulativeUpSeconds: 0, cumulativeDownSeconds: 0 },
    { id: 'MC-006', name: 'Robotic Welder R2', status: 'UP', upTime: '0h 0m 0s', downTime: '0h 0m 0s', lastStatusChange: Date.now(), cumulativeUpSeconds: 0, cumulativeDownSeconds: 0 },
    { id: 'MC-007', name: 'Drilling Unit D4', status: 'DOWN', upTime: '0h 0m 0s', downTime: '0h 0m 0s', lastStatusChange: Date.now(), cumulativeUpSeconds: 0, cumulativeDownSeconds: 0 },
    { id: 'MC-008', name: 'Plasma Cutter X1', status: 'UP', upTime: '0h 0m 0s', downTime: '0h 0m 0s', lastStatusChange: Date.now(), cumulativeUpSeconds: 0, cumulativeDownSeconds: 0 }
  ];

  history: MachineHistory[] = [];

  private timerInterval: any;

  ngOnInit(): void {
    // Update times every second
    this.timerInterval = setInterval(() => {
      this.updateAllTimers();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  updateAllTimers(): void {
    const now = Date.now();
    this.machines.forEach(machine => {
      const elapsedSeconds = Math.floor((now - machine.lastStatusChange) / 1000);
      
      let totalUp = machine.cumulativeUpSeconds;
      let totalDown = machine.cumulativeDownSeconds;

      if (machine.status === 'UP') {
        totalUp += elapsedSeconds;
      } else if (machine.status === 'DOWN') {
        totalDown += elapsedSeconds;
      }
      // If 'In Service' or 'Holiday', we don't accumulate UP/DOWN time in this simple model

      machine.upTime = this.formatTime(totalUp);
      machine.downTime = this.formatTime(totalDown);
    });
  }

  setStatus(machine: MachineStatus, newStatus: 'UP' | 'DOWN'): void {
    // Before changing status, save the elapsed time to cumulative
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - machine.lastStatusChange) / 1000);
    const prevStatus = machine.status;

    if (machine.status === 'UP') {
      machine.cumulativeUpSeconds += elapsedSeconds;
    } else if (machine.status === 'DOWN') {
      machine.cumulativeDownSeconds += elapsedSeconds;
    }

    // Log History
    this.history.unshift({
      machineId: machine.id,
      machineName: machine.name,
      previousStatus: prevStatus,
      newStatus: newStatus,
      timestamp: new Date(),
      duration: this.formatTime(elapsedSeconds)
    });

    machine.status = newStatus;
    machine.lastStatusChange = now;
    this.updateAllTimers(); // Immediate update
  }

  toggleHoliday(machine: MachineStatus): void {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - machine.lastStatusChange) / 1000);
    const prevStatus = machine.status;

    // Save current state time
    if (machine.status === 'UP') {
      machine.cumulativeUpSeconds += elapsedSeconds;
    } else if (machine.status === 'DOWN') {
      machine.cumulativeDownSeconds += elapsedSeconds;
    }

    const newStatus = machine.status === 'Holiday' ? 'DOWN' : 'Holiday';

    // Log History
    this.history.unshift({
      machineId: machine.id,
      machineName: machine.name,
      previousStatus: prevStatus,
      newStatus: newStatus,
      timestamp: new Date(),
      duration: this.formatTime(elapsedSeconds)
    });

    machine.status = newStatus;
    machine.lastStatusChange = now;
    this.updateAllTimers();
  }

  toggleService(machine: MachineStatus): void {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - machine.lastStatusChange) / 1000);
    const prevStatus = machine.status;

    if (machine.status === 'UP') {
      machine.cumulativeUpSeconds += elapsedSeconds;
    } else if (machine.status === 'DOWN') {
      machine.cumulativeDownSeconds += elapsedSeconds;
    }

    const newStatus = machine.status === 'In Service' ? 'DOWN' : 'In Service';

    this.history.unshift({
      machineId: machine.id,
      machineName: machine.name,
      previousStatus: prevStatus,
      newStatus: newStatus,
      timestamp: new Date(),
      duration: this.formatTime(elapsedSeconds)
    });

    machine.status = newStatus;
    machine.lastStatusChange = now;
    this.updateAllTimers();
  }

  formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  }

  getCount(status: string): number {
    return this.machines.filter(m => m.status === status).length;
  }

  getMachineIcon(status: string): string {
    switch (status) {
      case 'UP': return 'settings_suggest';
      case 'DOWN': return 'error_outline';
      case 'In Service': return 'build';
      case 'Holiday': return 'event_busy';
      default: return 'precision_manufacturing';
    }
  }
}
