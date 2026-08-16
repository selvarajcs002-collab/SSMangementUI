import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChallanData } from '../../../../../core/services/outward-preview.service';

@Component({
  selector: 'app-meter-print-template',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './meter-print-template.component.html',
  styleUrl: './meter-print-template.component.scss'
})
export class MeterPrintTemplateComponent {
  @Input() data!: ChallanData;
}
