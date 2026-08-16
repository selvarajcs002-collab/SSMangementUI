import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-monitoring',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-monitoring.component.html',
  styleUrls: ['./status-monitoring.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusMonitoringComponent {
  machines = signal([
    { id: 'M-101', name: 'CNC Milling Center', type: 'CNC', status: 'running', operator: 'John Doe', shift: 'A', efficiency: 94, uptime: '6h 12m' },
    { id: 'M-102', name: 'Hydraulic Press', type: 'Press', status: 'idle', operator: 'Jane Smith', shift: 'A', efficiency: 82, uptime: '4h 45m' },
    { id: 'M-103', name: 'Laser Cutter X5', type: 'Laser', status: 'maintenance', operator: 'N/A', shift: 'B', efficiency: 0, uptime: '0h 0m' },
    { id: 'M-104', name: 'Assembly Robot R1', type: 'Robotic', status: 'running', operator: 'Auto', shift: 'A', efficiency: 98, uptime: '22h 30m' },
    { id: 'M-105', name: 'Quality Scanner', type: 'Vision', status: 'warning', operator: 'Mike Ross', shift: 'B', efficiency: 75, uptime: '2h 15m' },
    { id: 'M-106', name: 'Injection Mold 2', type: 'Mold', status: 'breakdown', operator: 'N/A', shift: 'C', efficiency: 0, uptime: '0h 0m' }
  ]);

  getStatusClass(status: string) {
    return `status-${status}`;
  }

  markActive(machine: any) {
    machine.status = 'running';
    // Logic to update backend
  }

  markDown(machine: any) {
    machine.status = 'breakdown';
    // Logic to open downtime dialog
  }
}
