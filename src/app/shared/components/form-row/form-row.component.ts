import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-row',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-row" [class.responsive]="responsive">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .form-row {
      display: flex;
      gap: 20px;
      margin-bottom: 4px;
      width: 100%;
    }

    .responsive {
      flex-direction: column;
    }

    @media (min-width: 768px) {
      .responsive {
        flex-direction: row;
      }

      .responsive > * {
        flex: 1;
      }
    }
  `]
})
export class FormRowComponent {
  @Input() responsive: boolean = true;
}
