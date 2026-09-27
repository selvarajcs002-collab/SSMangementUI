import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-add-employee-selection',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './add-employee-selection.component.html',
  styleUrl: './add-employee-selection.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEmployeeSelectionComponent {
  
  constructor(private router: Router) {}

  navigateBack() {
    this.router.navigate(['/dashboard']);
  }
  
  navigateToAdvance() {
    this.router.navigate(['/dashboard/advance-amount']);
  }
  
  navigateToEmployee() {
    window.open('http://200.141.4.172:4300/', '_blank');
  }
}
