import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-machine-reports',
  standalone: true,
  imports: [CommonModule],
  template: '<div class=\"glass-panel\"><h2>MachineReports Page</h2><p>This module is under development.</p></div>',
  styles: ['.glass-panel { background: white; padding: 40px; border-radius: 24px; border: 1px solid #e2e8f0; } h2 { font-weight: 800; color: #1e293b; margin-bottom: 16px; }']
})
export class MachineReportsComponent {}
