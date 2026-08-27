import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-option-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './option-card.component.html',
  styleUrls: ['./option-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptionCardComponent {
  @Input() icon: string = '';
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() route?: string;
  @Input() externalLink?: string;

  handleClick() {
    if (this.externalLink) {
      window.open(this.externalLink, '_blank');
    }
  }
}
