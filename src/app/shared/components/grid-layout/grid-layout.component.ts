import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-grid-layout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid-layout" [style.gap]="gap" [style.grid-template-columns]="columns">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .grid-layout {
      display: grid;
      width: 100%;
    }

    @media (max-width: 768px) {
      .grid-layout {
        grid-template-columns: 1fr !important;
        gap: 16px !important;
      }
    }
  `]
})
export class GridLayoutComponent {
  @Input() columns: string = '1fr 1fr';
  @Input() gap: string = '20px';
}
